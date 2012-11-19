module.exports = function parse (str, onpoint) {
  str.split(/,/g).forEach(function (binding) {
    var b = binding.split(/:/g)
    var path = b[1] && b[1].trim() || ''
    var p = b[0].split(/\|/g)
    var m = /([^\-]*)(?:\-(.*))?/.exec(p[0].trim())
    var type = m[1]
    var param = m[2]
    if (param) param = param.trim()
    var filters = p.slice(1).map(function (s) { return s.trim() })
    onpoint(type, param, path, filters)
  })
}
