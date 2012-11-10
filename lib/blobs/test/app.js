var request = require('supertest')
var should = require('should')
var app = require('../app')
var storage = app.get('storage')

storage.chunkSize = 4

describe('blobs', function () {
  var existent

  before(function (done) {
    storage.createWriteStream({
      contentType: 'text/plain'
    })
    .on('error', done)
    .end('aaaabbbbc', 'utf8', function () {
      existent = this.file._id
      done()
    })
  })

  describe('GET /:id', function () {
    it('Should respond with blob', function (done) {
      request(app)
        .get('/' + existent)
        .expect(200, 'aaaabbbbc')
        .expect('Content-Type', 'text/plain')
        .expect('ETag', md5('aaaabbbbc'))
        .end(done)
    })

    it('Should respond with 404 for non-existent blob', function () {
      request(app)
        .get('/non-existent')
        .expect(404, /non-existent/)
    })
  })

  describe('POST /', function () {
    it('Should respond with json', function (done) {
      request(app)
        .post('/')
        .type('text/html')
        .send('hello world')
        .expect(200, function (err, res) {
          if (err) return done(err)
          var body = res.body
          body.md5.should.equal(md5('hello world'))
          body.length.should.equal('hello world'.length)
          var id = body.id
          request(app).head('/' + id).expect(200, done)
        })
    })
  })
})

function md5 (str) {
  var hash = require('crypto').createHash('md5')
  hash.update(new Buffer(str, 'utf8'))
  return hash.digest('hex')
}

