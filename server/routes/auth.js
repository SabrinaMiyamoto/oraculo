const express = require('express');
const router = express.Router();
const { oauth2Client } = require('../services/gcalendar'); 
router.get('/google', (req, res) => {
  const SCOPES = ['https://www.googleapis.com/auth/calendar'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: SCOPES,
    prompt: 'consent' 
  });


  res.redirect(authUrl);
});


router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

  
    console.log('Novo refresh_token:', tokens.refresh_token);

    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Erro no callback de autenticação:', error.message);
    res.status(500).send('Erro na autenticação');
  }
});

module.exports = router;