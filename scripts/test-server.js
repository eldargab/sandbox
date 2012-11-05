var join = require('path').join
var parse = require('url').parse
var fs = require('fs')
var express = require('express')
var app = express()


var lib = join(__dirname, '../lib')

app.engine('jade', require('jade').renderFile)
app.locals.pretty = true

app.use(function (req, res, next) {
  var path = parse(req.url).pathname
  path = decodeURIComponent(path)
  path = path.slice(1) // strip leading '/'
  path = join(lib, path) + '.jade'
  fs.stat(path, function (err, stat) {
    if (err && err.code == 'ENOENT') return next()
    if (err) return next(err)
    res.render(path)
  })
})

app.use(express.static(lib))
app.use(express.errorHandler())

app.listen(3000)
console.log('Test server listening on port 3000')
