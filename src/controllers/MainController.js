const fetch = require('node-fetch');
const cache = require('memory-cache');

class MainController{
    constructor(){
        fetch('https://simple-api-selection.herokuapp.com/list-games/?title=race')
            .then(response => response.json())
            .then(data => {
                cache.put('steamGameList', data.applist.apps.app, 3600000)
        })
    }

    async getAllGames(req, res){
        let games = await cache.get('steamGameList')
        if(games === null) {
            fetch('https://simple-api-selection.herokuapp.com/list-games/?title=race')
                .then(response => response.json())
                .then(async data => {
                    await cache.put('steamGameList', data.applist.apps.app, 3600000)
                    games = await cache.get('steamGameList')
                    res.send(games)
                }).catch(err => res.send(err));
        } else res.send(games)
    }

    async getId(req, res){
        fetch(`https://store.steampowered.com/api/appdetails?appids=${req.params.id}`)
            .then(response => response.json())
            .then(data => {
                res.send(data)
            })
            .catch(err => res.send(err));
    }
}

module.exports = new MainController()