const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameId: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'playing'
    },
    result: {
        type: String,
        enum: ['victory', 'defeat', 'draw', 'in-progress'],
        default: 'in-progress'
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    finishedAt: Date
});

module.exports = mongoose.models.Game || mongoose.model('Game', gameSchema);