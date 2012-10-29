var fs = require('fs')
var join = require('path').join
var rmdir = require('rimraf').sync

fs.readdirSync('adverts').forEach(function (item) {
  var dir = join('adverts', item)
  if (!fs.existsSync(join(dir, 'info.json'))) rmdir(dir)
})