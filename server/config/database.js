const mongoose= require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB conectado com sucesso! 🚀');
    } catch (error) {
        console.error('Erro ao conectar no MongoDB:', error);
        process.exit(1)
    }
}

module.exports = connectDB