const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const calendarRoutes = require('./routes/calendar.js');
const clientRoutes = require('./routes/client');
const authRoutes = require('./routes/auth'); 

dotenv.config();
const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json()); 

// Rotas
app.use('/api/calendar', calendarRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));