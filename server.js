var express = require('express')
var app = express()

app.set('views', 'views')

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded())
app.use(app.router)

app.listen(3000)
