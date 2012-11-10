var express = require('express')
var db = require('db')
var storage = require('mongo-blobs')(db)

var app = module.exports = express()

app.set('storage', storage)

function setHeaders (blob, res) {
  res.type(blob.contentType)
  res.set('Content-Length', blob.length)
  res.set('ETag', blob.md5)
}

app.head('/:id', function (req, res, next) {
  var id = req.param('id')
  storage.findOne(id, function (err, blob) {
    if (err) return next(err)
    if (!blob) return res.send(404, 'Blob ' + id + ' not found')
    setHeaders(blob, res)
    res.end()
  })
})


app.get('/:id', function (req, res, next) {
  var id = req.param('id')

  var stream = storage.createReadStream(id)

  stream.pipe(res)

  req.on('close', function () {
    stream.destroy()
  })

  stream.on('error', function (err) {
    if (/blob .* not found/i.test(err.message))
      return res.send(404, 'Blob ' + id + ' not found')

    if (res.headersSent) { // too late to send something useful
      console.error(err.stack)
      req.destroy()
      return
    }

    next(err)
  })

  stream.on('head', function (blob) {
    setHeaders(blob, res)
  })
})

app.post('/', function (req, res, next) {
  var stream = storage.createWriteStream({
    contentType: req.get('Content-Type')
  })

  req.on('data', function (data) {
    stream.write(data)
  }).on('end', function () {
    stream.end()
  })

  stream.on('error', next)

  stream.on('_end', function () {
    res.json({
      id: this.file._id,
      contentType: this.file.contentType,
      length: this.file.length,
      md5: this.file.md5
    })
  })
})

if (require.main === module) {
  app.listen(3000)
  console.log('listening')
}
