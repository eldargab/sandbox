module.exports = function regModule (req, name, exports, deps) {
    function m (exp, module, r) {
        if (m.isCalled) throw new Error('Module fn called twice')
        m.isCalled = true

        if (typeof exports == 'function') {
            exports(r, exp)
            return
        }
        if (exports)
            module.exports = exports
    }
    m.isCalled = false
    req.register(name, m, deps)
    return m
}
