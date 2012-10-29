var jsdom = require('jsdom')
var request = require('superagent')
var Box = require('../lib/flow')
var mkdir = require('mkdirp')
var PATH = require('path')
var fs = require('fs')
var STATUS_CODES = require('http').STATUS_CODES
var mime = require('mime')

function httpError (res) {
  return String(res.status) + ' ' + STATUS_CODES[res.status]
}

function parallel (threads, fn, cb) {
  var inprogress = 0
  var end = false
  var cbCalled = false
  function exec () {
    inprogress++
    fn(function (done) {
      inprogress--
      if (done) end = true
      if (!end) exec()
      if (inprogress == 0 && end && !cbCalled) {
        cbCalled = true
        cb && cb()
      }
    })
  }
  for (var i = 0; i < threads; i++) {
    if (end) return
    exec()
  }
}


function TroikaPage (window) {
  this.doc = window.document
}

TroikaPage.prototype.field = function (name) {
  var el = this.doc.querySelector('.' + name)
  return el && el.textContent || undefined
}

TroikaPage.prototype.name = function () {
  var name = this.field('type')
  var m = /«(.*)»/.exec(name)
  if (m) return m[1].trim()
  m = /Бизнес центр([^\,]+)\,/.exec(name)
  if (m) return m[1].trim()
}

TroikaPage.prototype.price = function () {
  return parseInterval(this.field('costs'))
}

TroikaPage.prototype.area = function () {
  return parseInterval(this.field('area'))
}

function parseInterval (s) {
  var i = {}, val
  s.replace('от\s*(\d+)', function (m, num) {
    i.from = Number(num) || undefined
  }).replace('до\s*(\d+)', function (m, num) {
    i.to = Number(num) || undefined
  }).replace('\d+', function (m) {
    val = Number(num) || undefined
  })
  return i.from || i.to ? i : val
}

TroikaPage.prototype.option = function (name) {
  var els = this.doc.querySelectorAll('th')
  for (var i = 0; i < els.length; i++) {
    var el = els[i]
    if (el.textContent == name) {
      return nextElement(el).textContent
    }
  }
}

function nextElement (el) {
  while ((el = el.nextSibling) && (el.nodeType !== 1))
  return el
}

TroikaPage.prototype.included = function () {
  return this.option('Включено в аренду')
}

TroikaPage.prototype.chargedSeparately = function () {
  return this.option('Оплачивается отдельно')
}

TroikaPage.prototype.parking = function () {
  return this.option('Паркинг')
}

TroikaPage.prototype.images = function () {
  return [].slice.call(this.doc.querySelectorAll('#galleryCarousel img')).map(function (img) {
    var m = /\d+\.\w+$/.exec(img.src)
    if (m) return 'http://troikarealty.ru/images/realestates/gallery/' + m[0]
  }).filter(function (url) {
    return !!url
  })
}

TroikaPage.prototype.toJSON = function () {
  var json = {}

  var renames = {
    'equipment': 'equipments',
    'metro': 'station',
    'distanceFromMetro': 'distance'
  }

  ;[
    'name',
    'class',
    'metro',
    'distanceFromMetro',
    'district',
    'area',
    'price',
    'included',
    'chargedSeparately',
    'condition',
    'layout',
    'equipment',
    'communications',
    'security',
    'parking',
    'desc',
    'images'
  ].forEach(function (f) {
    var val = this[f] ? this[f]() : this.field(renames[f] || f)
    if (typeof val == 'string') val = val.trim()
    json[f] = val || undefined
  }, this)

  return json
}

var download = new Box

download.def('page', ['id'], function (done) {
  jsdom.env({
    html: 'http://troikarealty.ru/object/' + this.id,
    features: {
      QuerySelector: true,
      FetchExternalResources: false
    },
    done:  function (err, window) {
      if (err) return done(err)
      var page = new TroikaPage(window)
      if (!page.name()) return done('Unrecognized content')
      done(null, page.toJSON())
    }
  })
})

download.def('realty_guide_page', ['page'], function (done) {
  request
    .get('https://api.datamarket.azure.com/Bing/SearchWeb/v1/Web')
    .auth('', process.env.AZURE_DATAMARKET_KEY)
    .query({
      $top: 10,
      $format: 'Json',
      Query: "'site:office.realty-guide.ru " + this.page.name + "'"
    })
    .end(function (res) {
      if (!res.ok) return done(httpError(res))
      var url = res.body.d.results.reduce(function (res, item) {
        var m = /key=\d+/.exec(item.Url)
        if (m) res.push('http://office.realty-guide.ru/objects/?' + m[0] + '&part=2')
        return res
      }, [])[0]
      url ? done(null, url) : done('Not found')
    })
})

download.def('location', ['realty_guide_page'], function (done) {
  var self = this
  var req = request
    .get(this.realty_guide_page)
    .end(function (res) {
      if (!res.ok) return done(httpError(res))
      var m = /N ([\d\.]+), E ([\d\.]+)/.exec(res.text)
      if (!m) return done('Failed extract location from ' + req.url)
      done(null, self.page.latLng = {
        lat: m[1],
        lng: m[2]
      })
    })
})

download.def('folder', ['page'], function (done) {
  var dir = PATH.join('adverts', this.page.name)
  mkdir(dir, function (err) {
    done(err, dir)
  })
})

download.def('images_folder', ['folder'], function (done) {
  var dir = PATH.join(this.folder, 'images')
  mkdir(dir, function (err) {
    done(err, dir)
  })
})

download.def('images', ['images_folder'], function (done) {
  var self = this
  var images = []
  var index = 0

  parallel(1, function (cb) {
    var i = index++
    var url = self.page.images[i]
    if (!url) return cb('done')
    request.get(url, function (res) {
      if (!res.ok) return cb()
      var file = PATH.join(self.images_folder, String(i) + '.' + mime.extension(res.type))
      var stream = fs.createWriteStream(file)
      res.pipe(stream)
      stream.on('close', function () {
        images.push(PATH.basename(file))
        cb()
      })
    })
  }, function () {
    done(null, images)
  })
})

download.def('end', ['page', 'location', 'images', 'folder'], function (done) {
  var info = this.page
  info.images = this.images
  info.latLng = this.location
  fs.writeFile(PATH.join(this.folder, 'info.json'), JSON.stringify(info, null, 2), 'utf8', done)
})

download.onerror(function (err, task) {
  var msg = this.id.toString()
  if (task) msg += ' (' + task + ')'
  msg += ' ' + err.toString()
  console.log(msg)
})


var start = process.env.START || 350
var end = process.env.END || 600
var current = start

parallel(10, function (cb) {
  if (current > end) return cb('done')
  download.run().set('id', current++).eval('end', function (err) {
    if (!err) console.log('Downloaded: ' + this.page.name + ' (' + this.id + ')')
    cb()
  })
})