const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];


router.get('/google', (req, res) => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: scopes.join(' '),
    prompt: 'consent',
  });
  console.log('Redirecionando para:', authorizeUrl);
  res.redirect(authorizeUrl);
});

router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    console.error('Código de autorização não recebido.');
    return res.status(400).send('Erro: Código de autorização não recebido.');
  }

  try {

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);


    res.send(`
      <h1>Autenticação Google Calendar concluída!</h1>
    `);
  } catch (error) {
    console.error('Erro ao trocar código por tokens:', error.message);
    res.status(500).send('Erro na autenticação: ' + error.message);
  }
});

module.exports = router;