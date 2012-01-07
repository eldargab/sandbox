var req = require('../..');

module.exports = function regModule (name, exports, deps) {
    function m (exp, module, r) {
        if (m.isCalled) throw new Error('Module fn called twice');
        m.isCalled = true;

        if (typeof exports == 'function') {
            exports(r, exp);
            return;
        }
        if (exports)
            module.exports = exports;
    }
    req.register(name, deps, m);
    return m;
}
