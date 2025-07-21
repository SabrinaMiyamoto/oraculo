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

/**
 * Verifica conflitos de horário em um calendário específico.
 * @param {string} userId
 * @param {string} targetCalendarId
 * @param {string} startTime 
 * @param {string} endTime 
 * @param {string} [excludeEventId=null] 
 * @returns {object|null}
 */
async function checkTimeConflict(userId, targetCalendarId, startTime, endTime, excludeEventId = null) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        console.log('--- checkTimeConflict: Parâmetros para Google Calendar API ---');
        console.log('  calendarId sendo usado:', targetCalendarId);
        console.log('  timeMin (startTime) sendo usado:', startTime);
        console.log('  timeMax (endTime) sendo usado:', endTime);

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

/**
 * Cria um evento em um calendário específico.
 * @param {string} userId 
 * @param {string} targetCalendarId 
 * @param {object} eventData 
 * @returns {object} 
 */
async function createEvent(userId, targetCalendarId, eventData) {
    const calendarClient = await getAuthenticatedCalendarClient(userId);

    console.log('Dados do evento INICIAIS recebidos para criar:', eventData);

    try {
        if (!eventData.start || !eventData.start.dateTime || !eventData.start.timeZone) {
            throw new Error('As informações de início do evento (start.dateTime e start.timeZone) são obrigatórias.');
        }

        // 1. Parsear a data de início fornecida pelo cliente
        const parsedStartDateTime = new Date(eventData.start.dateTime);
        if (isNaN(parsedStartDateTime.getTime())) {
            throw new Error('Formato de data e hora de início inválido.');
        }

        // 2. Calcular a data e hora de término com base na duração da consulta
        const calculatedEndDateTime = new Date(parsedStartDateTime.getTime() + CONSULTATION_DURATION_MINUTES * 60 * 1000);

        // 3. Atualizar eventData.end com o formato ISO completo para envio à API do Google Calendar
        eventData.end = {
            dateTime: calculatedEndDateTime.toISOString(),
            timeZone: eventData.start.timeZone
        };

        // 4. Normalizar as datas de início e fim para a VERIFICAÇÃO DE CONFLITO
        const startTimeForConflictCheck = parsedStartDateTime.toISOString();
        const endTimeForConflictCheck = calculatedEndDateTime.toISOString();

        console.log('Dados do evento COMPLETOS (com "end" calculado) antes de checkTimeConflict e insert:', eventData);
        console.log('calendarId que será usado para o evento:', targetCalendarId);
        console.log('Datas normalizadas para checkTimeConflict:');
        console.log('  startTimeForConflictCheck:', startTimeForConflictCheck);
        console.log('  endTimeForConflictCheck:', endTimeForConflictCheck);


        // 5. Chamar a função de verificação de conflito com as datas normalizadas
        const conflictingEvent = await checkTimeConflict(
            userId,
            targetCalendarId,
            startTimeForConflictCheck,
            endTimeForConflictCheck
        );

        if (conflictingEvent) {
            throw new Error(`Horário conflitante! O período de ${eventData.start.dateTime} até ${eventData.end.dateTime} já está ocupado pelo evento: "${conflictingEvent.summary}" (ID: ${conflictingEvent.id})`);
        }

        // 6. Inserir o evento no Google Calendar
        const response = await calendarClient.events.insert({
            calendarId: targetCalendarId,
            requestBody: {
                ...eventData, 
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

        console.log(`[ALERT - NEW EVENT] Event "${eventData.summary}" (ID: ${response.data.id}) scheduled by ${eventData.attendees[0]?.email || 'Unknown'} for ${eventData.start.dateTime}. Link: ${response.data.htmlLink}`);

        return response.data;
    } catch (error) {
        console.error('Error scheduling event in Google Calendar:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('Detalhes do erro da API Google (completo):', JSON.stringify(error.response.data.error, null, 2));
        }
        throw new Error('Falha ao agendar evento: ' + (error.response?.data?.error?.message || error.message || 'Erro desconhecido'));
    }
}

/**
 * Busca um evento específico em um calendário.
 * @param {string} userId -
 * @param {string} targetCalendarId 
 * @param {string} eventId 
 * @returns {object|null} 
 */
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

/**
 * @param {string} userId
 * @param {string} targetCalendarId
 * @param {string} eventId 
 * @param {object} updatedEventData 
 * @returns {object} 
 */
async function updateEvent(userId, targetCalendarId, eventId, updatedEventData) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        let finalStartDateTime;
        let finalEndDateTime;
        let finalTimeZone;

        // Se a data de início for atualizada, recalcula o fim e normaliza
        if (updatedEventData.start && updatedEventData.start.dateTime) {
            finalStartDateTime = new Date(updatedEventData.start.dateTime);
            finalTimeZone = updatedEventData.start.timeZone || 'America/Sao_Paulo';
            finalEndDateTime = new Date(finalStartDateTime.getTime() + CONSULTATION_DURATION_MINUTES * 60 * 1000);

            updatedEventData.end = {
                dateTime: finalEndDateTime.toISOString(),
                timeZone: finalTimeZone
            };
        } else {
            // Se a data de início não for atualizada, busca a data do evento existente
            const existingEvent = await getEventById(userId, targetCalendarId, eventId);
            if (!existingEvent || !existingEvent.start || !existingEvent.end) {
                throw new Error('Não foi possível determinar o horário do evento existente para atualização.');
            }
            finalStartDateTime = new Date(existingEvent.start.dateTime);
            finalEndDateTime = new Date(existingEvent.end.dateTime);
            finalTimeZone = existingEvent.start.timeZone;
        }

        // Verifica conflitos com as novas datas, excluindo o próprio evento que está sendo atualizado
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

        console.log(`[ALERT - EVENT UPDATED] Event "${updatedEventData.summary}" (ID: ${eventId}) updated. New data: ${updatedEventData.start?.dateTime || finalStartDateTime.toISOString()}.`);

        return response.data;
    } catch (error) {
        console.error('Error updating event in Google Calendar:', error.response?.data || error.message);
        throw new Error('Falha ao atualizar evento: ' + (error.message || (error.response ? error.response.data.error.message : 'Erro desconhecido')));
    }
}

/**

 * @param {string} userId - 
 * @param {string} targetCalendarId
 * @param {string} eventId - 
 * @returns {number} 
 */
async function deleteEvent(userId, targetCalendarId, eventId) {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);

        const existingEvent = await getEventById(userId, targetCalendarId, eventId);

        if (!existingEvent) {
            throw new Error('Event not found for cancellation.');
        }

        // Para "cancelar", a API do Google Calendar recomenda atualizar o status para 'cancelled'
        existingEvent.status = 'cancelled';

        const response = await calendar.events.update({
            calendarId: targetCalendarId,
            eventId: eventId,
            requestBody: existingEvent,
            sendUpdates: 'all'
        });

        console.log(`[ALERT - EVENT CANCELLED] Event with ID: ${eventId} was cancelled. Status: ${response.data.status}`);
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