module.exports = function () {
    var req = relativeFrom('/')

    function relativeFrom (from) {
        return function require (p, cb) {
            return req.getModule(from, p, cb)
        }
    }

    req.relative = relativeFrom

    req.modules = {}

    req.packages = {}

    req.register = function (name, fn, deps) {
        fn.dir = resolvePath(name, '..')
        fn.path = /\.js$/.test(name) ? name : name + '.js'
        fn.deps = deps || []
        fn.isDepsSatisfied = fn.deps.length == 0
        req.modules[fn.path] = fn
    }

    req.registerPackage = function (name, main) {
        req.packages[name] = main
    }

    req.getModule = function (from, p) {
        var modPath = req.resolveModule(from, p)
        var mod = req.modules[modPath]
        if (!mod)
            throw new Error('Module `' + p + '` not defined')
        if (!mod.exports) {
            mod.exports = {}
            mod.call(mod.exports, mod.exports, mod, req.relative(mod.dir))
        }
        return mod.exports
    }

    req.resolveModule = function (from, path) {
        var p = resolvePath(from, path)
        var packMain = req.packages[p]
        if (packMain) return req.resolveModule(p, packMain)
        if (/\.js$/.test(p)) return p
        return p + '.js'
    }

    function resolvePath (from, to) {
        if (to.charAt(0) != '.' && to.charAt(0) != '..')
            return trimSlash(to)

        var path = from.split('/')
        var segs = to.split('/')
        segs.forEach(function (seg) {
            if (seg == '.') return
            if (seg == '..') {
                path.pop()
                return
            }
            path.push(seg)
        })
        return trimSlash(path.join('/'))
    }

    function trimSlash (s) {
        return s.charAt(0) == '/' ? s.slice(1) : s
    }

    return req
}