const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const calendarRoutes = require('./routes/calendar.cjs');
const clientRoutes = require('./routes/client');

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/calendar', calendarRoutes);
app.use('/api/client', clientRoutes);
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST']
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));