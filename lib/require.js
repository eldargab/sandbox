;(function () {
    var global = (function () { return this })();
    if (module && module.exports) {
        module.exports = require;
    }
    else {
        global.require = require;
    }

    function require (p, fn) {
        return _requireRelative('/', p, fn);
    }

    require.modules = {};
    require.packages = {};

    function _requireRelative (from, p, fn) {
        if (Array.isArray(p)) { // async require
            _satisfyDependencies({
                deps: p || [],
                path: from
            }, [], fn || NOOP);
            return;
        }

        var modPath = resolveModule(from, p);
        var mod = require.modules[modPath];
        if (!mod)
            throw new Error('Module ' + p + ' not defined');
        if (!mod.exports) {
            mod.exports = {};
            mod.call(mod.exports, mod.exports, mod, _requireRelative.bind(null, getModuleDir(modPath)));
        }
        return mod.exports;
    }

    function resolveModule (from, path) {
        var p = resolvePath(from, path);
        var packMain = require.packages[p];
        if (packMain) return resolveModule(p, packMain);
        if (/\.js$/.test(p)) return p;
        return p + '.js';
    }

    function getModuleDir (mod) {
        return mod == '/' ? '/' : resolvePath(mod, '..');
    }

    function resolvePath (from, to) {
        function trimSlash (s) {
            return s.charAt(0) == '/' ? s.slice(1) : s;
        }

        if (to.charAt(0) != '.' && to.charAt(0) != '..') 
            return trimSlash(to);

        var path = from.split('/');
        var segs = to.split('/');
        segs.forEach(function (seg) {
            if (seg == '.') return;
            if (seg == '..') {
                path.pop();
                return;
            }
            path.push(seg);
        });
        return trimSlash(path.join('/'));
    }

    require.register = function (name, deps, fn) {
        fn.deps = deps || [];
        fn.isDepsSatisfied = fn.deps.length == 0;
        fn.path = /\.js$/.test(name) ? name : name + '.js';
        require.modules[fn.path] = fn;
    }

    require.registerPackage = function (name, main) {
        require.packages[name] = main;
    }

    function _satisfyDependencies (module, dependents, callback) {
        if (module.isDepsSatisfied) {
            callback();
            return;
        }
        var dependentsOfRequired = dependents.concat(module.path);
        var t = new ParallelTask();

        module.deps.forEach(function (dep) {
            var path = resolveModule(getModuleDir(module.path), dep);
            if (dependents.indexOf(path) >= 0) return; // It's circular dependency. 
            var cb = t.cb();
            require.load(path, function () {
                var m = require.modules[path];
                if (!m) {
                    console.error('Module ' + path + ' was not found at expected location');
                    return;
                }
                _satisfyDependencies(m, dependentsOfRequired, cb);
            });
        });

        t.ondone(function () {
            module.isDepsSatisfied = true;
            callback();
        });
    }

    require.loading = {};

    require.load = function (path, ondone) {
        if (require.modules[path]) {
            ondone();
            return;
        }
        if (require.loading[path]) {
            require.loading[path].then(ondone);
            return;
        }
        _loadRequest(path).then(ondone);
    }

    function _loadRequest (path) {
        var p = new Promise();
        require.loading[path] = p;
        require.loadScript(path, function (error) {
            delete require.loading[path];
            if (error) return;
            p.resolve(); 
        });
        return p;
    }

    require.loadScript = function loadScript (path, callback) {
        var el = doc.createElement('script');
        el.type = 'text/javascript';

        el.onload = el.onreadystatechange = function (ev) {
            ev = ev || global.event;
            if (ev.type === 'load' || ['loaded', 'interactive', 'complete'].indexOf(this.readyState) >= 0) {
                this.onload = this.onreadystatechange = this.onerror = null;
                callback(null, el);
            }
        }

        el.onerror = function () {
            callback(new Error('Error while loading: ' + path));
        }

        el.charset = 'utf-8';
        el.async = true;
        el.src = path;

        // use insertBefore to keep IE from throwing Operation Aborted (thx Bryan Forbes!)
        head.insertBefore(el, head.firstChild);
    }

    function ParallelTask () {
        var tasks = [];
        var completed = 0;
        var ondone;

        this.cb = function () {
            var taskIndex = tasks.push(false) - 1;
            return function () {
                if (tasks[taskIndex]) {
                    console.error('Async function called its callback twice');
                    return;
                }
                tasks[taskIndex] = true;
                completed++;
                if (tasks.length == completed && ondone)
                    ondone();
            }
        }

        this.ondone = function (cb) {
            if (tasks.length == completed) {
                cb();
                return;
            }
            ondone = cb;
        }
    }

    function Promise () {
        var subscribers = [];

        this.resolve = function () {
            subscribers.forEach(function (s) {
                s();
            });
        }

        this.then = function (fn) {
            if (fn) subscribers.push(fn);
        }
    }

    function NOOP () { }
})();
