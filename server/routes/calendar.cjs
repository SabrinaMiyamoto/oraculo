const express = require('express');
const { agendarConsulta } = require('../services/gcalendar');
const router = express.Router();

// Rota GET para teste
router.get('/evento', (req, res) => {
  res.json({ message: "Use POST para agendar eventos" });
});

// Rota POST para criação de eventos
router.post('/evento', async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body); // Log para debug
    
    const evento = await agendarConsulta({
      summary: req.body.summary,
      start: {
        dateTime: req.body.start.dateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: req.body.end.dateTime,
        timeZone: 'America/Sao_Paulo'
      },
      attendees: req.body.attendees
    });

    console.log('Evento criado com ID:', evento.id);
    res.status(201).json({
      success: true,
      eventId: evento.id,
      link: evento.htmlLink
    });

  } catch (error) {
    console.error('Erro detalhado:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao criar evento',
      details: error.message,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;