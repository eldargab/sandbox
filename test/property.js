var request = require('supertest')
var app = require('../server')

function drop (cb) {
  var db = require('monk')(process.env.DB_CONNECTION_STRING)
  db.get('properties').drop(function (err) {
    if (/ns not found/.test(String(err))) return cb()
    cb(err)
  })
}

function assert (slug, doc, cb) {
  request(app)
    .get('/' + slug)
    .expect(200, function (err, res) {
      if (err) return cb(err)
      try {
        for (var key in doc) {
          res.body[key].should.eql(doc[key])
        }
        cb()
      } catch (e) {
        cb(e)
      }
    })
}

function post (doc) {
  return request(app)
    .post('/property')
    .send(doc)
}


describe('POST /property', function () {
  after(drop)

  it('Should create property', function (done) {
    post({
      slug: 'hello',
      name: 'hello center'
    }).expect(200, function (err) {
      if (err) return done(err)
      assert('hello', {
        name: 'hello center'
      }, done)
    })
  })

  it('Should reject property with existing slug', function (done) {
    post({slug: 'reject'}).expect(200, function (err) {
      if (err) return done(err)
      post({slug: 'reject', name: 'Should be rejected'}).expect(400, done)
    })
  })
})

describe('GET /:property-slug', function () {
  it('Should respond with 404 if property not found', function (done) {
    request(app).get('/non-existent').expect(404, done)
  })
})
