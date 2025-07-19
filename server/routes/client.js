const express = require('express');
const cors = require('cors');
const { enviarEmail } = require('../services/mailer');
const { agendarConsulta } = require('../services/gcalendar');

const router = express.Router();

router.post('/agendar', async (req, res) => {
  const { nome, email, telefone, data } = req.body;

  try {
    // 1. Agenda no Google Calendar
    const evento = await agendarConsulta({
      nome,
      dataInicio: data,
      dataFim: new Date(new Date(data).getTime() + 60 * 60 * 1000), // +1 hora
    });

    // 2. Envia e-mail para a mãe de santo
    await enviarEmail(
      process.env.EMAIL_NOTIFICACAO,
      'Nova consulta agendada',
      `Cliente: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\nData: ${data}`
    );

    // 3. Confirmação para o cliente (opcional)
    await enviarEmail(
      email,
      'Consulta agendada com sucesso!',
      'Sua consulta espiritual foi confirmada.'
    );

    res.status(200).json({ success: true, evento });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao agendar consulta' });
  }
});

module.exports = router;