var factory = require('./require')
var mixAsync = require('./mix-async')

exports.Require = function () {
    return mixAsync(factory())
}

exports.syncScript = function (target) {
    return target + '(' + factory + ')()\n'
}

exports.globalClientScript = function () {
    var s = exports.syncScript('window.require = ')
    s += '\n(' + mixAsync + ')(window.require)'
    return s
}

exports.wrapModule = function (name, src, deps) {
    var depsCode = ''
    if (deps && deps.length) {
        depsCode = ', [' + deps.map(function (dep) {
            return "'" + dep + "'"
        }).join(', ') + ']'
    }
    return "require.register('" + name + "', function (exports, module, require) {" + src + '\n}' + depsCode + ')\n'
}

exports.wrapPackage = function (name, main) {
    return "require.registerPackage('" + name + "', '" + main + "')\n"
}