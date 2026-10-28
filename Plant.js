const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    watering: {
        type: String,
        default: 'Weekly'
    },
    sunlight: {
        type: String,
        default: 'Indirect sunlight'
    },
    emoji: {
        type: String,
        default: '🪴'
    },
    status: {
        type: String,
        default: 'Healthy'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Plant', plantSchema);