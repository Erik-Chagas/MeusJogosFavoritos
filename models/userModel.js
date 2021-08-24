const mongoose = require('mongoose')

const users = new mongoose.Schema({
    user:{type: String, required: true, ref: 'user'},
    games: [{
        appid:{type: Number, required: true, ref: 'appid'},
        rating:{type: Number, required: true, min: [0, 'A nota deve ser no mínimo 1 e no máximo 5'], max: [5, 'A nota deve ser no mínimo 1 e no máximo 5'] , ref: 'rating'}
    }]
})

module.exports = mongoose.model('users', users)