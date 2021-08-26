const express = require('express')
const mongoose = require('mongoose')
const fetch = require('node-fetch');
require('./models/userModel')
var cache = require('memory-cache');

const userDB = mongoose.model('users')

const app = express()
app.use(express.json())

mongoose.connect('mongodb+srv://Erik:12345@cluster0.hfkvb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("conexão realizada com sucesso")
}).catch((erro) => {
    console.log("não houve conexão")
});

fetch('https://simple-api-selection.herokuapp.com/list-games/?title=race')
    .then(response => response.json())
    .then(data => {
        cache.put('steamGameList', data.applist.apps.app, 3600000)
    })

app.get('/', async (req, res) => {
    let games = await cache.get('steamGameList')
    if(games === null)
    {
        fetch('https://simple-api-selection.herokuapp.com/list-games/?title=race')
            .then(response => response.json())
            .then(async data => {
                await cache.put('steamGameList', data.applist.apps.app, 3600000)
                games = await cache.get('steamGameList')
                res.send(games)
            }).catch(err => res.send(err));
    } else res.send(games)
})

app.get('/favorite/', async (req, res) => {
    if(req.headers['user-hash'] === null)
        return res.status(400).json({
            erro: true,
            message: 'É necessário um nome de usuário'
        })

    const user = await userDB.findOne({user: req.headers['user-hash']})
    if(user === null)
    {
        let empty = []
        res.send(empty)
    }else{
        let gameList = cache.get(`${req.headers['user-hash']}`)
        res.send(gameList)
    }
})

app.get('/:id', (req, res) => {
    fetch(`https://store.steampowered.com/api/appdetails?appids=${req.params.id}`)
        .then(response => response.json())
        .then(data => {
            res.send(data)
        })
        .catch(err => res.send(err));
})

const criarDado = (user, body) => { 
    return {
        user: user,
        games: [body]
    }
}

const criarGetFavorite = (value1, value2) => { 
    return {
        lista: [value1],
        detalhes: value2
    }
}

app.post('/favorite/',  async (req, res) => {
    if(req.headers['user-hash'] === null)
        return res.status(400).json({
            erro: true,
            message: 'É necessário um nome de usuário'
        })

    const user = await userDB.findOne({user: req.headers['user-hash']})
    if(user === null){
        const data = userDB.create(criarDado(req.headers['user-hash'], req.body), (erro) => {
            if(erro)
                return res.status(400).json({
                    erro: true,
                    message: 'Não foi possível cadastrar o jogo. Erro: ' + erro
                })

            fetch(`https://store.steampowered.com/api/appdetails?appids=${req.body.appid}`)
                .then(response => response.json())
                .then(data => {
                    let gameInfo = []
                    gameInfo.push(data)
                    cache.put(`${req.headers['user-hash']}`, criarGetFavorite(req.body, gameInfo))
                })
    
            return res.status(200).json({
                erro: false,
                message: 'Jogo cadastrado com sucesso!'
            })
        })
    }else{
        user.games.push(req.body)
        user.save().then(async savedDoc => {
            if(savedDoc === user){
                let info = await cache.get(`${req.headers['user-hash']}`)
                info.lista.push(req.body)
                let response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${req.body.appid}`)
                let json = await response.json()
                info.detalhes.push(json)
                cache.put(`${req.headers['user-hash']}`, info)
                
                return res.status(200).json({
                    erro: false,
                    message: 'Jogo cadastrado com sucesso!'
                })
            }

            res.status(400).json({
            erro: true,
            message: 'Não foi possível cadastrar o jogo'
            })

        }).catch(erro => res.status(400).json({
            erro: true,
            message: 'Não foi possível cadastrar o jogo. Erro: ' + erro
        }))
    }
})

app.delete('/favorite/:appid', async (req, res) => {
    if(req.headers['user-hash'] == null)
        return res.status(400).json({
            erro: true,
            message: 'É necessário um nome de usuário'
        })
        
    let user = await userDB.findOne({user: req.headers['user-hash']})

    if(user === null)
    {
        let empty = []
        res.send(empty)
    }else{
        user.games = user.games.filter((e) => e.appid != req.params.appid)
        user.save().then(async savedDoc => {
            if(savedDoc === user){
                let info = await cache.get(`${req.headers['user-hash']}`)
                info.lista = info.lista.filter((e) => e.appid != req.params.appid)
                info.detalhes = info.detalhes.filter((e) => e[req.params.appid] === undefined)
                cache.put(`${req.headers['user-hash']}`, info)

                return res.status(200).json({
                    erro: false,
                    message: 'Jogo deletado com sucesso!'
                })
            }

            res.status(400).json({
            erro: true,
            message: 'Não foi possível deletar o jogo'
            })
            
        }).catch(erro => res.status(400).json({
            erro: true,
            message: 'Não foi possível deletar o jogo. Erro: ' + erro
        }))
    }
})

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`Servidor ligado na porta ${PORT}`)
})

