module.exports = function (storage) {

  function get (id, req, res, next) {
    var stream = storage.createReadStream(id)

    stream.pipe(res)

    req.on('close', function () {
      stream.destroy()
    })

    stream.on('error', function (err) {
      if (/blob .* not found/i.test(err.message))
        return next(NotFound(id))

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
  }

  function head (id, req, res, next) {
    storage.findOne(id, function (err, blob) {
      if (err) return next(err)
      if (!blob) return next(NotFound(id))
      setHeaders(blob, res)
      res.end()
    })
  }

  function post (req, res, next) {
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
  }

  return function blob (req, res, next) {
    if (req.method == 'POST') {
      if (req._body) return next()
      post(req, res, next)
      return
    }
    if (req.method != 'HEAD' && req.method != 'GET') return next()
    var id = req.param('id')
    if (!id) return next(new Error('Blob id is not defined in request params'))

    req.method == 'HEAD'
      ? head(id, req, res, next)
      : get(id, req, res, next)
  }
}

function setHeaders (blob, res) {
  res.type(blob.contentType)
  res.set('Content-Length', blob.length)
  res.set('ETag', blob.md5)
}

function NotFound (id) {
  var err = new Error('Blob ' + id + ' not found')
  err.status = 404
  return err
}
