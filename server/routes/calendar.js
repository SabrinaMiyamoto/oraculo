const express = require('express');
console.log('Arquivo calendar.js está sendo carregado e rotas estão sendo configuradas.');
const {
    createEvent,
    updateEvent,
    getEventById,
    deleteEvent
} = require('../services/gcalendar');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
    console.log('--- ensureAuthenticated middleware ---');
    console.log('Cookies recebidos (req.headers.cookie):', req.headers.cookie);
    console.log('Sessão encontrada (req.session):', req.session);
    console.log('ID da Sessão (req.sessionID):', req.sessionID);
    console.log('UserID na Sessão (req.session.userId):', req.session ? req.session.userId : 'NÃO ENCONTRADO');
    if (req.session && req.session.userId) {
        return next();
    }
    console.log('Falha na autenticação: req.session ou req.session.userId ausente. Redirecionando para login.');
    res.status(401).json({ error: 'Não autorizado. Por favor, faça login.' });
}

// Middleware para verificar a autorização do evento (melhorado para incluir calendarId)
async function verifyEventAuthorization(req, res, next) {

    const eventId = req.params.id;
    const { calendarId, clientEmail } = req.body;

    const organizerUserId = req.session.userId;

    if (!organizerUserId) {
        return res.status(401).json({ error: 'ID do usuário organizador não encontrado na sessão. Por favor, faça login.' });
    }
    if (!calendarId) {
        return res.status(400).json({ error: 'O ID do calendário (calendarId) é obrigatório para esta operação.' });
    }
    if (!clientEmail) {

        if (req.body.attendees && req.body.attendees.length > 0) {
            req.body.clientEmail = req.body.attendees[0].email;
        } else {
            return res.status(400).json({ error: 'E-mail do cliente (do campo clientEmail ou primeiro participante) é obrigatório para esta operação.' });
        }
    }


    try {
        // Obter o evento usando o calendarId fornecido
        const existingEvent = await getEventById(organizerUserId, calendarId, eventId);

        if (!existingEvent) {
            return res.status(404).json({ error: 'Evento não encontrado para verificação de autorização no calendário especificado.' });
        }

        // Verifica se o email do cliente está entre os participantes do evento existente
        const isAuthorized = existingEvent.attendees && existingEvent.attendees.some(
            attendee => attendee.email === req.body.clientEmail
        );

  
        const isOrganizer = existingEvent.organizer && existingEvent.organizer.self === true && existingEvent.organizer.email === req.session.userEmail;
      
        if (!isAuthorized && !isOrganizer) {
             return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para modificar/cancelar este evento.' });
        }

        req.clientEmail = req.body.clientEmail; 
        req.existingEvent = existingEvent;
        next();
    } catch (error) {
        console.error('Erro no middleware de autorização de evento:', error.response?.data || error.message);
        let errorMessage = 'Erro durante a verificação de autorização.';
        if (error.response?.data?.error?.message) {
            errorMessage = error.response.data.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


// Rota para obter um evento por ID 
router.get('/evento/:id', ensureAuthenticated, async (req, res) => {
    try {
        const eventId = req.params.id;
        const organizerUserId = req.session.userId;
        const { calendarId } = req.query; 

        if (!calendarId) {
            return res.status(400).json({ error: 'O ID do calendário (calendarId) é obrigatório como parâmetro de query (?calendarId=...).' });
        }

        const event = await getEventById(organizerUserId, calendarId, eventId); 
        if (!event) {
            return res.status(404).json({ error: 'Evento não encontrado no calendário especificado.' });
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

// Rota para criar um novo evento, protegida
router.post('/evento', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId; 
        const { calendarId, ...eventData } = req.body;
        if (!calendarId) {
            return res.status(400).json({ error: 'Erro ao criar evento', details: 'O ID do calendário (calendarId) é obrigatório no corpo da requisição.' });
        }

        // Log para depuração
        console.log(`Requisição para criar evento no calendário: ${calendarId} pelo usuário: ${userId}`);
        console.log('Dados do evento recebidos na rota:', eventData);

        const event = await createEvent(userId, calendarId, eventData); 
        res.status(201).json({ message: 'Evento criado com sucesso!', event });
    } catch (error) {
        console.error('Erro na rota POST /api/calendar/evento:', error.message);
        res.status(500).json({ error: 'Erro ao criar evento', details: error.message });
    }
});

// Rota para atualizar um evento existente
router.put('/evento/:id', ensureAuthenticated, verifyEventAuthorization, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { id: eventId } = req.params; 
        const { calendarId, ...updatedEventData } = req.body; 

        console.log(`Requisição para atualizar evento ${eventId} no calendário: ${calendarId} pelo usuário: ${userId}`);
        console.log('Dados do evento para atualização:', updatedEventData);

        if (Object.keys(updatedEventData).length === 0) {
            return res.status(400).json({ error: 'Nenhum campo de atualização fornecido no corpo da requisição (excluindo calendarId, clientEmail).' });
        }

        const result = await updateEvent(userId, calendarId, eventId, updatedEventData);

        console.log(`[ALERT - EVENT UPDATED] Evento atualizado com ID: ${result.id}. Link: ${result.htmlLink}`);
        res.status(200).json({
            success: true,
            message: 'Evento atualizado com sucesso!',
            event: result
        });

    } catch (error) {
        console.error('Erro na rota PUT /api/calendar/evento/:id:', error.message);
        console.error('Detalhes do erro:', error.response?.data || error);
        res.status(500).json({
            error: 'Erro ao reagendar/atualizar evento',
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Rota para cancelar/deletar um evento
router.delete('/evento/:id', ensureAuthenticated, verifyEventAuthorization, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { id: eventId } = req.params;
        const { calendarId } = req.body;
        if (!calendarId) {
            return res.status(400).json({ error: 'O ID do calendário (calendarId) é obrigatório no corpo da requisição para deletar o evento.' });
        }

        await deleteEvent(userId, calendarId, eventId);

        console.log('Evento com ID:', eventId, 'cancelado com sucesso no calendário:', calendarId);
        res.status(200).json({ success: true, message: 'Evento cancelado com sucesso!' });

    } catch (error) {
        console.error('Erro na rota DELETE /api/calendar/evento/:id:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Erro ao cancelar evento',
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;