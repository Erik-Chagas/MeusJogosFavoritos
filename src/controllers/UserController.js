const fetch = require('node-fetch');
const cache = require('memory-cache');
const mongoose = require('mongoose')
require('../../models/userModel')
const userDB = mongoose.model('users')

function criarDado(user, body){ 
    return {
        user: user,
        games: [body]
    }
}

function criarGetFavorite(lista, detalhes){ 
    return {
        lista: [lista],
        detalhes
    }
}

async function CacheUserFavoriteGamesDetails(userHash, games){
    let gameInfo = await Promise.all(games.map(async game => {
        const gameElementInfo = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.appid}`)
        const data = await gameElementInfo.json()
        
        return data
    }));

    cache.put(userHash, {
        lista: games,
        detalhes: gameInfo
    })
}

class UserController{
    async getFavorite(req, res){
        if(req.headers['user-hash'] === null){
            return res.status(400).json({
                erro: true,
                message: 'É necessário um nome de usuário'
            })
        }

        const user = await userDB.findOne({user: req.headers['user-hash']})
        
        if(user === null){
            let empty = []
            res.send(empty)
        }else{
            let gameList = cache.get(`${req.headers['user-hash']}`)
            
            if(gameList != null){
                res.send(gameList)
            }

            if(gameList == null){
                await CacheUserFavoriteGamesDetails(`${req.headers['user-hash']}`, user.games)
                gameList = cache.get(`${req.headers['user-hash']}`)
                res.send(gameList)
            }
            
        }
    }

    async postFavorite(req, res){
        if(req.headers['user-hash'] === null){
            return res.status(400).json({
                erro: true,
                message: 'É necessário um nome de usuário'
            })
        }

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

                    if(info == null){
                        await CacheUserFavoriteGamesDetails(`${req.headers['user-hash']}`, user.games)
                        info = cache.get(`${req.headers['user-hash']}`)
                    }

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
    }

    async deleteFavorite(req, res){
        if(req.headers['user-hash'] == null){
            return res.status(400).json({
                erro: true,
                message: 'É necessário um nome de usuário'
            })
        }
        
        let user = await userDB.findOne({user: req.headers['user-hash']})

        if(user === null){
            let empty = []
            res.send(empty)
        }else{
            user.games = user.games.filter((e) => e.appid != req.params.appid)
            user.save().then(async savedDoc => {
                if(savedDoc === user){
                    let info = await cache.get(`${req.headers['user-hash']}`)

                    if(info == null){
                        await CacheUserFavoriteGamesDetails(`${req.headers['user-hash']}`, user.games)
                        info = await cache.get(`${req.headers['user-hash']}`)
                    }
                    
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
    }
}

module.exports = new UserController()