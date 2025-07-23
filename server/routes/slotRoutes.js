const express = require('express');
const router = express.Router();
const AvailableSlots = require('../models/availableSlots');

router.get('/available', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7); 
        sevenDaysLater.setHours(23, 59, 59, 999); 

        const todayStr = today.toISOString().split('T')[0];
        const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];
        const availableDates = await AvailableSlots.find({ 
            isBooked: false,
            date: { $gte: todayStr, $lte: sevenDaysLaterStr }
        }).select('date').distinct('date');

        res.status(200).json(availableDates.sort());
    } catch (error) {
        console.error('Error fetching available dates:', error);
        res.status(500).json({ message: 'Erro ao buscar datas disponíveis.', error: error.message });
    }
});

// Rota para obter todos os horários disponíveis (não reservados)
router.get('/available-dates', async (req, res) => {
    try {
        const availableSlots = await AvailableSlots.find({ isBooked: false }).sort({ date: 1, time: 1 });
        res.status(200).json(availableSlots);
    } catch (error) {
        console.error('Erro ao buscar horários disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar horários.' });
    }
});
router.post('/client/agendar', async (req, res) => {
    const { name, email, date, time, timeZone, slotId } = req.body;

    if (!name || !email || !date || !time || !timeZone || !slotId) {
        console.log('Validação do backend falhou. Campos ausentes:', { name, email, date, time, timeZone, slotId });
        return res.status(400).json({ error: 'Nome, e-mail, data/hora, fuso horário e ID do slot são obrigatórios.' });
    }

    try {
        const slot = await AvailableSlots.findById(slotId); 

        if (!slot) {
            return res.status(404).json({ error: 'Slot não encontrado.' });
        }
        if (slot.isBooked) {
            return res.status(409).json({ error: 'Este horário já foi agendado.' });
        }

        if (slot.date !== date || slot.time !== time) {
            return res.status(400).json({ error: 'Inconsistência de dados: data ou hora do slot não corresponde.' });
        }

        slot.isBooked = true;
        slot.bookedBy = { name, email };
        slot.bookedAt = new Date();
        slot.timeZone = timeZone;

        await slot.save();

        res.status(200).json({ message: 'Agendamento realizado com sucesso!', slot });

    } catch (error) {
        console.error('Erro ao agendar horário:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao agendar horário.', details: error.message });
    }
});


// Futuras rotas para adicionar/remover slots (talvez para um painel admin)

module.exports = router;