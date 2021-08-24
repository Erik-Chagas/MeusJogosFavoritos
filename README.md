# MeusJogosFavoritos
Repositório do projeto de seleção back-end para vaga de estágio na AppMasters

Esse projeto foi feito para um teste para vaga de estágio da empresa App Masters.
Site da App Masters: https://appmasters.io/pt/

Link para o projeto publicado na Heroku: https://meusjogosfavoritos.herokuapp.com/

Tecnologias utilizadas:
- Node.js
- Express.js
- Mongodb
- Heroku
- memory-cache (npm package)

# Rotas:
- GET em https://meusjogosfavoritos.herokuapp.com/ - retorna appid e nome de todos os jogos da steam
- GET em https://meusjogosfavoritos.herokuapp.com/:id - retorna detalhes sobre o jogo correspondente ao parâmetro id da url

- POST em https://meusjogosfavoritos.herokuapp.com/favorite/ - salva no banco de dados o appid e a nota(aceita apenas notas entre 1 e 5) para um jogo específico. Utiliza a header da requisição para especificar o usuário.
#### Estrutura da header:
```
user: "nome-de-usuário"
```
#### Estrutura do body:
```
{
    "appid": 4,
    "rating": 5
}
```

- GET em https://meusjogosfavoritos.herokuapp.com/favorite/ - retorna os jogos e suas respectivas notas, junto com os detalhes de cada jogo. Utiliza a header da requisição para especificar o usuário.
#### Estrutura da header:
```
user: "nome-de-usuário"
```

- DELETE em https://meusjogosfavoritos.herokuapp.com/favorite/:appid - deleta do banco de dados um jogo correspondente ao parâmetro appid da url. Utiliza a header da requisição para especificar o usuário.
#### Estrutura da header:
```
user: "nome-de-usuário"
```
