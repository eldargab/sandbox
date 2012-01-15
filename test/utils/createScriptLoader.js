var regModule = require('./registerModule');

module.exports = function createScriptLoader () {
    function load (name, cb) {
        var script = load.scripts[name];
        if (!script) {
            // console.log('Attempt to load undefined resource ' + name);
            cb(new Error('Resource ' + name + ' not found'));
            return;
        }
        if (script.called) throw new Error('Attempt to load resource ' + name + ' twice');
        script.called = true;
        script.cb = cb;
    }

    load.scripts = {};

    load.script = function (name, deps) {
        load.scripts[name] = {
            name: name,
            deps: deps,
            called: false,
            complete: function () {
                if (!this.called) throw new Error('Loading of ' + name + ' wasnt requested');
                regModule(name, name.split('/').join(''), deps);
                this.cb();
            }
        }
        return load.scripts[name];
    }

    return load;
}
