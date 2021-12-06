const express = require('express')
const mongoose = require('mongoose')
const MainController = require('./src/controllers/MainController');
const UserController = require('./src/controllers/UserController');

const dotenv = require('dotenv');
dotenv.config();

const app = express()
app.use(express.json())

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("conexão realizada com sucesso")
}).catch((erro) => {
    console.log("não houve conexão")
});

app.get('/', MainController.getAllGames)

app.get('/favorite/', UserController.getFavorite)

app.get('/:id', MainController.getId)

app.post('/favorite/',  UserController.postFavorite)

app.delete('/favorite/:appid', UserController.deleteFavorite)

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`Servidor ligado na porta ${PORT}`)
})

