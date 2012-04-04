window.require = (function () {
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
})()

(function (req) {
    var getModule = req.getModule
    var relative = req.relative

    req.getModule = function (from, p, cb) {
        if (Array.isArray(p)) // async require
            return _satisfyDependencies({deps: p, dir: from}, [], cb || NOOP)
        return getModule(from, p)
    }

    req.launch = function (var_modules) {
        var modules = Array.prototype.slice.call(arguments)
        var r = this
        r(modules, function () {
            modules.forEach(function (mod) {
                r(mod)
            })
        })
    }

    req.relative = function (from) {
        var r = relative(from)
        r.launch = req.launch
        return r
    }


    function _satisfyDependencies (module, dependents, callback) {
        if (module.isDepsSatisfied) return callback()
        var dependentsOfRequired = dependents.concat(module.path)
        var t = new ParallelTask()

        module.deps.forEach(function (dep) {
            var path = req.resolveModule(module.dir, dep)
            if (dependents.indexOf(path) >= 0) return // It's circular dependency.
            var cb = t.cb()
            load(path, function () {
                var m = req.modules[path]
                if (!m) {
                    console.error('Module `' + path + '` was not found at expected location')
                    return
                }
                _satisfyDependencies(m, dependentsOfRequired, cb)
            })
        })

        t.ondone(function () {
            module.isDepsSatisfied = true
            callback()
        })
    }

    req.loading = {}

    function load (path, ondone) {
        if (req.modules[path]) return ondone()
        if (req.loading[path]) return req.loading[path].then(ondone)
        _loadRequest(path).then(ondone)
    }

    function _loadRequest (path) {
        var p = new Promise()
        req.loading[path] = p

        var baseUrl = req.baseUrl || ''
        var url = baseUrl == '' ? path : (baseUrl + '/' + path).replace('//', '/')

        req.loadScript(url, function (error) {
            delete req.loading[path]
            if (error) return
            p.resolve()
        })
        return p
    }

    req.loadScript = function loadScript (path, callback) {
        var head = document['head'] || document.getElementsByTagName('head')[0]
        var el = document.createElement('script')
        el.type = 'text/javascript'

        el.onload = el.onreadystatechange = function (ev) {
            ev = ev || window.event
            if (ev.type === 'load' || ['loaded', 'interactive', 'complete'].indexOf(this.readyState) >= 0) {
                this.onload = this.onreadystatechange = this.onerror = null
                callback(null, el)
            }
        }

        el.onerror = function () {
            callback(new Error('Error while loading: ' + path))
        }

        el.charset = 'utf-8'
        el.async = true
        el.src = path

        // use insertBefore to keep IE from throwing Operation Aborted (thx Bryan Forbes!)
        head.insertBefore(el, head.firstChild)
    }


    function Promise () {
        this.subscribers = []
    }

    Promise.prototype.resolve = function () {
        this.subscribers.forEach(function (s) {
            s()
        })
    }

    Promise.prototype.then = function (fn) {
        if (fn) this.subscribers.push(fn)
    }

    function ParallelTask () {
        this.tasks = []
        this.completed = 0
    }

    ParallelTask.prototype.cb = function () {
        var self = this
        var index = self.tasks.push(false) - 1
        return function () {
            if (self.tasks[index]) {
                console.error('Async function called its callback twice')
                return
            }
            self.tasks[index] = true
            self.completed++
            if (self.tasks.length == self.completed && self._ondone)
                self._ondone()
        }
    }

    ParallelTask.prototype.ondone = function (cb) {
        if (this.tasks.length == this.completed) return cb()
        this._ondone = cb
    }

    function NOOP () { }

    return req
})(window.require)