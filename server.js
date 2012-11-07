var express = require('express')
var app = module.exports = express()

app.set('views', 'lib')
app.engine('jade', require('jade').renderFile)
app.locals.pretty = true


app.use(express.json())
app.use(express.urlencoded())
app.use(app.router)
app.use(express.errorHandler())

require('./lib/server/routes')

if (require.main === module) {
  app.listen(process.env.PORT || 3000)
  console.log('Listening...')
}
