const { google } = require('googleapis');
require('dotenv').config();
const User = require('../models/User');
const CONSULTATION_DURATION_MINUTES = 90;

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

async function getAuthenticatedCalendarClient(userId) {
    const user = await User.findById(userId);
    if (!user || !user.refreshToken) {
        throw new Error('Usuário ou Refresh Token não encontrado. O usuário precisa fazer login novamente.');
    }

    oauth2Client.setCredentials({ refresh_token: user.refreshToken });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
    } catch (refreshError) {
        console.error('Erro ao renovar Access Token para o usuário:', userId, refreshError.message);
        throw new Error('Falha ao renovar Access Token. O usuário precisa se reautenticar.');
    }

    return google.calendar({
        version: 'v3',
        auth: oauth2Client,
    });
}

async function checkTimeConflict(userId, targetCalendarId, startTime, endTime, excludeEventId = null) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        const response = await calendar.events.list({
            calendarId: targetCalendarId,
            timeMin: startTime,
            timeMax: endTime,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;

        if (!events || events.length === 0) {
            return null;
        }

        const conflictingEvents = events.filter(event =>
            event.status !== 'cancelled' &&
            event.id !== excludeEventId
        );

        if (conflictingEvents.length > 0) {
            return conflictingEvents[0];
        }
        return null;
    } catch (error) {
        console.error('Error checking time conflict in Google Calendar:', error.response?.data || error.message);
        throw new Error('Failed to check time conflict: ' + (error.response ? error.response.data.error.message : error.message));
    }
}

async function createEvent(userId, targetCalendarId, eventData) {
    const calendarClient = await getAuthenticatedCalendarClient(userId);

    const { summary, description, start, attendees, location } = eventData; // Não desestrutura 'duration' aqui, pois é calculada

    try {
        if (!eventData.start || !eventData.start.dateTime || !eventData.start.timeZone) {
            throw new Error('As informações de início do evento (start.dateTime e start.timeZone) são obrigatórias.');
        }

        const parsedStartDateTime = new Date(eventData.start.dateTime);
        if (isNaN(parsedStartDateTime.getTime())) {
            throw new Error('Formato de data e hora de início inválido.');
        }

        // Calcula o horário final adicionando 90 minutos
        const calculatedEndDateTime = new Date(parsedStartDateTime.getTime() + CONSULTATION_DURATION_MINUTES * 60 * 1000);

        // Adiciona a propriedade 'end' ao eventData para a API do Google Calendar
        eventData.end = {
            dateTime: calculatedEndDateTime.toISOString(),
            timeZone: eventData.start.timeZone
        };

        const startTimeForConflictCheck = parsedStartDateTime.toISOString();
        const endTimeForConflictCheck = calculatedEndDateTime.toISOString();

        const conflictingEvent = await checkTimeConflict(
            userId,
            targetCalendarId,
            startTimeForConflictCheck,
            endTimeForConflictCheck
        );

        if (conflictingEvent) {
            throw new Error(`Horário conflitante! O período de ${eventData.start.dateTime} até ${eventData.end.dateTime} já está ocupado pelo evento: "${conflictingEvent.summary}" (ID: ${conflictingEvent.id})`);
        }

        // Insere o evento usando a API direta do Google Calendar
        const response = await calendarClient.events.insert({
            calendarId: targetCalendarId,
            requestBody: {
                ...eventData, // Isso inclui summary, description, start, end (calculado), attendees, location
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 60 }
                    ]
                }
            },
            sendUpdates: 'all'
        });

        return response.data;
    } catch (error) {
        console.error('Error scheduling event in Google Calendar:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('Detalhes do erro da API Google (completo):', JSON.stringify(error.response.data.error, null, 2));
        }
        throw new Error('Falha ao agendar evento: ' + (error.response?.data?.error?.message || error.message || 'Erro desconhecido'));
    }
}

async function getEventById(userId, targetCalendarId, eventId) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        const response = await calendar.events.get({
            calendarId: targetCalendarId,
            eventId: eventId,
        });
        return response.data;
    } catch (error) {
        if (error.code === 404) {
            return null;
        }
        console.error('Error fetching event from Google Calendar by ID:', error.response?.data || error.message);
        throw new Error('Failed to fetch event: ' + (error.response ? error.response.data.error.message : error.message));
    }
}

async function updateEvent(userId, targetCalendarId, eventId, updatedEventData) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        let finalStartDateTime;
        let finalEndDateTime;
        let finalTimeZone;

        if (updatedEventData.start && updatedEventData.start.dateTime) {
            finalStartDateTime = new Date(updatedEventData.start.dateTime);
            finalTimeZone = updatedEventData.start.timeZone || 'America/Sao_Paulo';
            finalEndDateTime = new Date(finalStartDateTime.getTime() + CONSULTATION_DURATION_MINUTES * 60 * 1000);

            updatedEventData.end = {
                dateTime: finalEndDateTime.toISOString(),
                timeZone: finalTimeZone
            };
        } else {
            const existingEvent = await getEventById(userId, targetCalendarId, eventId);
            if (!existingEvent || !existingEvent.start || !existingEvent.end) {
                throw new Error('Não foi possível determinar o horário do evento existente para atualização.');
            }
            finalStartDateTime = new Date(existingEvent.start.dateTime);
            finalEndDateTime = new Date(existingEvent.end.dateTime);
            finalTimeZone = existingEvent.start.timeZone;
        }

        const conflictingEvent = await checkTimeConflict(
            userId,
            targetCalendarId,
            finalStartDateTime.toISOString(),
            finalEndDateTime.toISOString(),
            eventId
        );

        if (conflictingEvent) {
            throw new Error(`Horário conflitante! O período de ${finalStartDateTime.toISOString()} até ${finalEndDateTime.toISOString()} já está ocupado pelo evento: "${conflictingEvent.summary}" (ID: ${conflictingEvent.id})`);
        }

        const response = await calendar.events.update({
            calendarId: targetCalendarId,
            eventId: eventId,
            requestBody: updatedEventData,
            sendUpdates: 'all'
        });

        return response.data;
    } catch (error) {
        console.error('Error updating event in Google Calendar:', error.response?.data || error.message);
        throw new Error('Falha ao atualizar evento: ' + (error.message || (error.response ? error.response.data.error.message : 'Erro desconhecido')));
    }
}

async function deleteEvent(userId, targetCalendarId, eventId) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        const existingEvent = await getEventById(userId, targetCalendarId, eventId);

        if (!existingEvent) {
            throw new Error('Event not found for cancellation.');
        }

        existingEvent.status = 'cancelled';

        const response = await calendar.events.update({
            calendarId: targetCalendarId,
            eventId: eventId,
            requestBody: existingEvent,
            sendUpdates: 'all'
        });

        return response.status;
    } catch (error) {
        console.error('Error cancelling event from Google Calendar:', error.response?.data || error.message);
        throw new Error('Falha ao cancelar evento: ' + (error.response ? error.response.data.error.message : 'Erro desconhecido'));
    }
}

module.exports = {
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent
};