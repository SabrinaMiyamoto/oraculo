const express = require('express');
const router = express.Router();
const gcalendar = require('../services/gcalendar');
const AvailableSlot = require('../models/availableSlots'); 
const YABETE_USER_ID = '687ec28508de3d4d3200fa06';
const TARGET_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const isAuthenticated = (req, res, next) => {
    next();
};

router.post('/agendar', async (req, res) => {
    const { nome, email, dateTime, timeZone, slotId } = req.body; 
     console.log('Dados recebidos no backend para agendamento:', { nome, email, dateTime, timeZone, slotId });
    if (!nome || !email || !dateTime || !timeZone || !slotId) { 
        console.log('Validação do backend falhou. Campos ausentes:', { nome, email, dateTime, timeZone, slotId });
        return res.status(400).json({ error: 'Nome, e-mail, data/hora, fuso horário e ID do slot são obrigatórios.' });
    }

    try {
        // 1. Verificar e marcar o slot como reservado no MongoDB
        const slot = await AvailableSlot.findById(slotId);

        if (!slot) {
            return res.status(404).json({ error: 'Horário selecionado não encontrado.' });
        }
        if (slot.isBooked) {
            return res.status(409).json({ error: 'Este horário já foi reservado. Por favor, escolha outro.' });
        }

        // 2. Criar o evento no Google Calendar
        const eventData = {
            summary: `Consulta com ${nome}`,
            description: `E-mail: ${email}`, 
            start: {
                dateTime: dateTime,
                timeZone: timeZone,
            },
            end: {
                dateTime: new Date(new Date(dateTime).getTime() + 90 * 60 * 1000).toISOString().slice(0, -5),
                timeZone: timeZone,
            },
            attendees: [{ email: email }],
        };

        const event = await gcalendar.createEvent(YABETE_USER_ID, TARGET_CALENDAR_ID, eventData);


        slot.isBooked = true;
        slot.bookedBy = YABETE_USER_ID; 
        slot.bookedEmail = email;
        await slot.save();

        res.status(200).json({
            message: 'Agendamento solicitado com sucesso! Aguarde a confirmação.',
            eventId: event.id,
            eventLink: event.htmlLink,
            slotBooked: { date: slot.date, time: slot.time }
        });
    } catch (error) {
        console.error('Erro na rota /api/client/agendar:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao agendar.' });
    }
});

router.get('/protected', isAuthenticated, (req, res) => {
    res.json({ message: 'Acesso autorizado ao cliente!' });
});

module.exports = router;