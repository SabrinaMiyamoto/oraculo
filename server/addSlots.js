const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

//console.log('Conteúdo de process.env.MONGODB_URI:', process.env.MONGODB_URI);

const mongoose = require('mongoose');
const AvailableSlot = require('./models/availableSlots'); 
const moment = require('moment-timezone'); 

async function addInitialSlots() {
    try {
        console.log('Iniciando adição de slots de 90 minutos...');
        const slotsToAdd = [];
        const timeZone = 'America/Sao_Paulo';

        const startDate = moment().tz(timeZone).startOf('day');
        const numDaysAhead = 90;


        await mongoose.connect(process.env.MONGODB_URI, {

        });
        console.log('Conexão MongoDB para addSlots estabelecida.');

        for (let i = 0; i < numDaysAhead; i++) {
            const currentDate = startDate.clone().add(i, 'days');
            const dayOfWeek = currentDate.day();

            if (dayOfWeek >= 1 && dayOfWeek >= 1 && dayOfWeek <= 6) {
                let currentTime = currentDate.clone().hour(13).minute(0).second(0);
                const endTime = currentDate.clone().hour(20).minute(0).second(0);

                const consultationDurationMinutes = 90;

                while (currentTime.clone().add(consultationDurationMinutes, 'minutes').isSameOrBefore(endTime)) {
                    slotsToAdd.push({
                        date: currentTime.format('YYYY-MM-DD'),
                        time: currentTime.format('HH:mm'),
                        isBooked: false
                    });
                    currentTime.add(consultationDurationMinutes, 'minutes');
                }
            }
        }

        let addedCount = 0;
        for (const slot of slotsToAdd) {
            const result = await AvailableSlot.findOneAndUpdate(
                { date: slot.date, time: slot.time },
                { $setOnInsert: slot },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (result.createdAt && result.updatedAt && result.createdAt.getTime() === result.updatedAt.getTime()) {
                addedCount++;
            }
        }

        console.log(`Finalizado! Total de ${addedCount} novos slots de 90 minutos adicionados (duplicatas ignoradas).`);
    } catch (error) {
        console.error('Erro ao adicionar slots iniciais:', error);
    } finally {
        mongoose.connection.close();
        console.log('Conexão MongoDB para addSlots fechada.');
    }
}

addInitialSlots();