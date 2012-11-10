var monk = require('monk')

var db = module.exports = monk(process.env.DB_CONNECTION_STRING || 'localhost/test')

db.get('properties').index('slug', {unique: true},function (err) {
  if (err) throw err
})

