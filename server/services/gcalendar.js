const { google } = require('googleapis');
require('dotenv').config();


const CONSULTATION_DURATION_MINUTES = 90;

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});

const calendar = google.calendar({
    version: 'v3',
    auth: oauth2Client,
});


async function checkTimeConflict(startTime, endTime, excludeEventId = null) {
    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
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


async function createEvent(eventData) {
    try {
        const startDateTime = new Date(eventData.start.dateTime);
        const endDateTime = new Date(startDateTime.getTime() + CONSULTATION_DURATION_MINUTES * 90 * 1000); 
        eventData.end = {
            dateTime: endDateTime.toISOString(),
            timeZone: eventData.start.timeZone 
        };

        const conflictingEvent = await checkTimeConflict(
            eventData.start.dateTime, 
            eventData.end.dateTime
        );

        if (conflictingEvent) {
            throw new Error(`Horário conflitante! O período de ${eventData.start.dateTime} até ${eventData.end.dateTime} já está ocupado pelo evento: "${conflictingEvent.summary}" (ID: ${conflictingEvent.id})`);
        }

        const response = await calendar.events.insert({
            calendarId: 'primary',
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
        throw new Error('Falha ao agendar evento: ' + (error.message || (error.response ? error.response.data.error.message : 'Erro desconhecido')));
    }
}

async function getEventById(eventId) {
    try {
        const response = await calendar.events.get({
            calendarId: 'primary',
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

async function updateEvent(eventId, updatedEventData) {
    try {
        let finalStartDateTime;
        let finalEndDateTime;
        let finalTimeZone;

        if (updatedEventData.start && updatedEventData.start.dateTime) {
            finalStartDateTime = new Date(updatedEventData.start.dateTime);
            finalTimeZone = updatedEventData.start.timeZone || 'America/Sao_Paulo';
            finalEndDateTime = new Date(finalStartDateTime.getTime() + CONSULTATION_DURATION_MINUTES * 90 * 1000);
            
            updatedEventData.end = {
                dateTime: finalEndDateTime.toISOString(),
                timeZone: finalTimeZone
            };
        } else {
            const existingEvent = await getEventById(eventId);
            if (!existingEvent || !existingEvent.start || !existingEvent.end) {
                 throw new Error('Não foi possível determinar o horário do evento existente para atualização.');
            }
            finalStartDateTime = new Date(existingEvent.start.dateTime);
            finalEndDateTime = new Date(existingEvent.end.dateTime);
            finalTimeZone = existingEvent.start.timeZone;
        }

        const conflictingEvent = await checkTimeConflict(
            finalStartDateTime.toISOString(), 
            finalEndDateTime.toISOString(),
            eventId
        );

        if (conflictingEvent) {
            throw new Error(`Horário conflitante! O período de ${finalStartDateTime.toISOString()} até ${finalEndDateTime.toISOString()} já está ocupado pelo evento: "${conflictingEvent.summary}" (ID: ${conflictingEvent.id})`);
        }

        const response = await calendar.events.update({
            calendarId: 'primary',
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
async function deleteEvent(eventId) {
    try {

        const existingEvent = await getEventById(eventId); 

        if (!existingEvent) {
            throw new Error('Event not found for cancellation.');
        }

        existingEvent.status = 'cancelled';


        const response = await calendar.events.update({
            calendarId: 'primary', 
            eventId: eventId,
            requestBody: existingEvent,
            sendUpdates: 'all'
        });

        console.log(`[ALERT - EVENT CANCELLED] Event with ID: ${eventId} was cancelled. Status: ${response.data.status}`);
        return response.status; 
    } catch (error) {
        console.error('Error cancelling event from Google Calendar:', error.response?.data || error.message);
        throw new Error('Falha ao cancelar evento: ' + (error.response ? error.response.data.error.message : error.message));
    }
}

module.exports = {
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent
};