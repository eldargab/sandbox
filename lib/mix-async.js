module.exports = function (req) {
    var getModule = req.getModule

    req.getModule = function (from, p, cb) {
        if (Array.isArray(p)) // async require
            return _satisfyDependencies({deps: p, dir: from}, [], cb || NOOP)
        return getModule(from, p)
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
                var m = req.modules[req.resolveModule(module.dir, dep)]
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

    var relative = req.relative

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

    return req
}