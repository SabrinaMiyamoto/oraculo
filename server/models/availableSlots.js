const mongoose = require('mongoose');

const availableSlotSchema = new mongoose.Schema({
    date: {
        type: String, 
        required: true
    },
    time: {
        type: String, // Formato 'HH:MM'
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },
    bookedEmail: {
        type: String,
        default: null
    }
}, { timestamps: true });

availableSlotSchema.index({ date: 1, time: 1 }, { unique: true });

const AvailableSlot = mongoose.model('AvailableSlot', availableSlotSchema);

module.exports = AvailableSlot;