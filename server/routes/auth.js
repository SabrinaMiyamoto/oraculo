const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
require('dotenv').config();

const User = require('../models/User'); 

const oauth2Client = new google.auth.OAuth2(
 process.env.CLIENT_ID,
 process.env.CLIENT_SECRET,
 process.env.REDIRECT_URI
);

const scopes = [
 'https://www.googleapis.com/auth/calendar.events',
 'https://www.googleapis.com/auth/calendar.readonly',
 'https://www.googleapis.com/auth/userinfo.email',
 'https://www.googleapis.com/auth/userinfo.profile'
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

// Rota de callback após a autenticação do Google

router.get('/oauth2callback', async (req, res) => {
 const { code } = req.query;
  if (!code) {
    console.error('Código de autorização não recebido.');
    return res.status(400).send('Erro: Código de autorização não recebido.');
 }

  try {
   const { tokens } = await oauth2Client.getToken(code);
   oauth2Client.setCredentials(tokens);

   console.log('\n--- TOKENS RECEBIDOS ---');
   console.log('Access Token:', tokens.access_token);
   console.log('Refresh Token:', tokens.refresh_token); 
   console.log('Expiry Date:', new Date(tokens.expiry_date));
   console.log('-------------------------\n');

   const plus = google.people({ version: 'v1', auth: oauth2Client });
   const profileResponse = await plus.people.get({ 
       resourceName: 'people/me',
       personFields: 'emailAddresses,names,photos,metadata', 
     });

    const googleId = profileResponse.data.resourceName.split('/').pop();
    const userEmail = profileResponse.data.emailAddresses[0].value;
    const userName = profileResponse.data.names[0].displayName;


    let user = await User.findOne({ googleId: googleId });

    if (user) {
        user.refreshToken = tokens.refresh_token || user.refreshToken; 
        user.name = userName;
        user.email = userEmail;
        await user.save();
        console.log(`Usuário ${userName} (ID: ${googleId}) atualizado no DB.`);
    } else {
        user = await User.create({
            googleId: googleId,
            email: userEmail,
            name: userName,
            refreshToken: tokens.refresh_token,
        });
        console.log(`Novo usuário ${userName} (ID: ${googleId}) criado no DB.`);
    }

   req.session.userId = user._id; // Usar o ID do MongoDB como ID da sessão
   req.session.userName = userName;
   req.session.isAuthenticated = true;
   req.session.googleId = googleId; // Armazena o Google ID na sessão também

     res.send(`
     <h1>Autenticação Google Calendar concluída para ${userName}!</h1>
     <p>Você está logado como: ${userEmail}</p>
     <p>Seu Refresh Token foi salvo com segurança no banco de dados.</p>
     <p><a href="/">Ir para a página inicial (se houver)</a></p>
     <p><a href="/api/auth/logout">Fazer Logout</a></p>
     `);
   } catch (error) {
     console.error('Erro ao trocar código por tokens ou obter perfil:', error.response?.data?.error || error.message);
     res.status(500).send('Erro na autenticação: ' + (error.response?.data?.error?.message || error.message));
   }
});

// Rota de Logout
router.get('/logout', (req, res) => {
     req.session.destroy(err => {
       if (err) {
         console.error('Erro ao destruir a sessão:', err);
         return res.status(500).send('Erro ao fazer logout.');
       }
         res.send('<h1>Logout realizado com sucesso!</h1><p><a href="/api/auth/google">Fazer login novamente</a></p>');
     });
});

module.exports = router;