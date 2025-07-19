const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_NOTIFICACAO,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function enviarEmail(destinatario, assunto, texto) {
  try {
    await transporter.sendMail({
      from: `"Agendamento Espiritual" <${process.env.EMAIL_NOTIFICACAO}>`,
      to: destinatario,
      subject: assunto,
      text: texto,
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
}

module.exports = { enviarEmail };