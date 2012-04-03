var factory = require('./require')
var mixAsync = require('./mix-async')

exports.Require = function () {
    return mixAsync(factory())
}

exports.syncScript = function (target) {
    return target + ' = (' + factory + ')()\n'
}

exports.globalClientScript = function () {
    var s = exports.syncScript('window.require')
    s += '\n(' + mixAsync + ')(window.require)'
    return s
}