var app = require('./server')
var db = require('db')

app.post('/property', function (req, res, next) {
  var doc = req.body

  if (!doc.slug) return res.send(400, 'Property slug is required')

  db.col('properties')
    .insert(doc)
    .success(function () {
      res.send(200)
    })
    .error(function (err) {
      if (err.code == 11000) // duplicate index key
        return res.send(400, 'Property with slug "' + doc.slug + '" already exists')
      next(err)
    })
})

app.get('/:slug', function (req, res, next) {
  var slug = req.param('slug')

  db.col('properties')
    .findOne({slug: slug})
    .success(function (doc) {
      doc ? res.json(doc) : res.send(404)
    })
    .error(next)
})



