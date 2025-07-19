const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

//oauth2Client.setCredentials({
 // refresh_token: process.env.REFRESH_TOKEN
//});

async function agendarConsulta(evento) {
  const calendar = google.calendar({ 
    version: 'v3',
    auth: oauth2Client
  });

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        ...evento,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro completo da API Google:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
}

module.exports = { agendarConsulta };