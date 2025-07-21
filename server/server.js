const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session= require('express-session');
const connectDB = require('./config/database.js')
const MongoStore = require('connect-mongo'); 

const calendarRoutes = require('./routes/calendar.js');
const clientRoutes = require('./routes/client');
const authRoutes = require('./routes/auth'); 


dotenv.config();
const app = express();
console.log('Servidor Node.js está inicializando...');

connectDB();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
console.log('Middleware express.json() executado para requisição.');

//Cookies

app.use(cookieParser());

//Session

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: 'test', 
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
    }
}));

// Rotas
app.get('/', (req, res) => {
    console.log('Requisição recebida na raiz!');
    res.send('Servidor está ativo!');
});
app.use('/api/calendar', calendarRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));