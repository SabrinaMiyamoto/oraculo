const express = require('express');
const { 
    createEvent,
    updateEvent,
    getEventById, 
    deleteEvent
} = require('../services/gcalendar'); 
const router = express.Router();

// Middleware para verificar a autorização do evento, para garantir que somente o agendado mexa na sua consulta!!!
async function verifyEventAuthorization(req, res, next) { 
    const eventId = req.params.id;
    const clientEmail = req.body.clientEmail || (req.body.attendees && req.body.attendees[0] ? req.body.attendees[0].email : null);

    if (!clientEmail) {
        return res.status(400).json({ error: 'Client email (from clientEmail field or first attendee) is required for this operation.' });
    }

    try {
        const existingEvent = await getEventById(eventId); 

        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found for authorization check.' });
        }
        const isAuthorized = existingEvent.attendees && existingEvent.attendees.some(
            attendee => attendee.email === clientEmail
        );

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to modify this event.' });
        }
        req.clientEmail = clientEmail; 
        req.existingEvent = existingEvent; 
        next();
    } catch (error) {
        console.error('Error in event authorization middleware:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error during authorization check.', 
            details: error.message 
        });
    }
}

router.get('/evento/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await getEventById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.status(200).json({ success: true, event: event });
    } catch (error) {
        console.error('Error fetching event by ID:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error fetching event', 
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
router.post('/evento', async (req, res) => {
    try {
        console.log('Received data (POST):', req.body); 
        const clientEmail = req.body.attendees && req.body.attendees[0] ? req.body.attendees[0].email : null;
        if (!clientEmail) {
             return res.status(400).json({ error: 'Client email must be provided in the attendees array.' });
        }
        const event = await createEvent({ 
            summary: req.body.summary,
            description: req.body.description,
            location: req.body.location,
            start: {
                dateTime: req.body.start.dateTime,
                timeZone: req.body.start.timeZone 
            },
            attendees: req.body.attendees
        });

        console.log('Event created with ID:', event.id);
        res.status(201).json({
            success: true,
            eventId: event.id,
            link: event.htmlLink
        });

    } catch (error) {
        console.error('Detailed error (POST):', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error creating event',
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.put('/evento/:id', verifyEventAuthorization, async (req, res) => { 
    try {
        const eventId = req.params.id;
        const updatedFields = req.body; 

        console.log('Received data (PUT) for ID:', eventId, 'Data:', updatedFields);

        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({ error: 'No update fields provided in the request body.' });
        }

        const result = await updateEvent(eventId, updatedFields); 

        console.log('Event updated with ID:', result.id);
        res.status(200).json({ 
            success: true, 
            message: 'Event updated successfully!', 
            eventId: result.id, 
            link: result.htmlLink 
        });

    } catch (error) {
        console.error('Detailed error (PUT):', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error rescheduling/updating event',
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.delete('/evento/:id', verifyEventAuthorization, async (req, res) => { 
    try {
        const eventId = req.params.id;

        await deleteEvent(eventId); 

        console.log('Event with ID:', eventId, 'cancelled successfully.');
        res.status(200).json({ success: true, message: 'Event cancelled successfully!' }); 

    } catch (error) {
        console.error('Error deleting event:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error deleting event', 
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;