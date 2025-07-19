// routes/auth.js
const express = require('express');
const router = express.Router();
const { oauth2Client } = require('../services/gcalendar'); // Certifique-se que oauth2Client é exportado de gcalendar.js

// Novo endpoint para iniciar o processo de autenticação
router.get('/google', (req, res) => {
  const SCOPES = ['https://www.googleapis.com/auth/calendar'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // <-- ISSO É CRUCIAL para que o refresh_token seja emitido
    scope: SCOPES,
    prompt: 'consent' // <-- ISSO FORÇA o Google a te pedir consentimento novamente e gerar um NOVO refresh_token
  });

  // Redireciona o navegador do usuário para a página de autorização do Google
  res.redirect(authUrl);
});

// Seu endpoint de callback que já existe
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Salve o refresh_token (apenas na primeira vez)
    console.log('Novo refresh_token:', tokens.refresh_token);

    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Erro no callback de autenticação:', error.message);
    res.status(500).send('Erro na autenticação');
  }
});

module.exports = router;