var sinon = require('sinon')
var should = require('should')
var registerModule = require('./utils/registerModule')
var createScriptLoader = require('./utils/createScriptLoader')

var req

function Module (name, exports, deps) {
    registerModule(req, name, exports, deps)
}

function defScript (name, deps, mod) {
    req.loadScript.script(name, deps, mod)
}

function script (name) {
    return req.loadScript.scripts[name]
}


describe('Client-side `require`', function () {
    beforeEach(function () {
        req = require('../lib').Require()
        req.loadScript = createScriptLoader(req)
    })

    it('registered modules can be required', function () {
        Module('a', 'a')
        Module('a/b/c', 'abc')

        req('a').should.equal('a')
        req('a/b/c').should.equal('abc')
   })

    it('`require` supplied to module supports relative paths', function () {
        Module('a/b', 'ab')
        Module('a/c/d', 'acd')
        Module('e/g', 'eg')

        var runned = false

        Module('a/c/test', function (r) {
            r('./d').should.equal('acd')
            r('../b').should.equal('ab')
            r('e/g').should.equal('eg')
            runned = true
        })

        req('a/c/test')
        runned.should.be.true
    })

    it('It is possible to register main files for packages', function () {
        Module('a/b/c/d', 'abcd')
        req.registerPackage('a/b', './c/d') // main files resolved relatively from packages folder
        req('a/b').should.equal('abcd')
    })

    it('Modules with names other than *.js are registered with .js suffix appended', function () {
        Module('a', 'a')
        req('a.js').should.equal('a')
    })

    describe('async module loading', function () {
        var cb

        beforeEach(function () {
            cb = sinon.spy()
        })

        it('When all required modules and their dependencies already present, callback called immediately', function () {
            Module('a/b')
            Module('b')

            req(['a/b', 'b'], cb)

            cb.calledOnce.should.be.true
        })

        it('Resolves all dependecies correctly and waits until all of them have been fetched', function () {
            defScript('a/b.js', ['.', './c', 'e'])
            defScript('a/c.js', ['e'])
            defScript('e.js')
            defScript('a/b/c/d.js')
            req.registerPackage('a', './b/c/d')

            req(['a/b', 'a'], cb)

            script('a/b.js').called.should.be.true
            script('a/b/c/d.js').called.should.be.true

            script('a/b.js').complete()

            script('a/c.js').called.should.be.true
            script('e.js').called.should.be.true

            cb.called.should.be.false

            script('a/c.js').complete()
            script('e.js').complete()
            script('a/b/c/d.js').complete()

            cb.calledOnce.should.be.true
        })

        it('Works inside module', function () {
            defScript('a/c.js')
            Module('a/b.js', function (r) {
                r(['./c'], cb)
            })

            req('a/b')
            cb.called.should.be.false
            script('a/c.js').complete()
            cb.calledOnce.should.be.true
        })

        it('Handles circular dependencies', function () {
            defScript('a.js', ['b'])
            defScript('b.js', ['a'])

            req(['a'], cb)
            script('a.js').complete()
            script('b.js').complete()

            cb.calledOnce.should.be.true
        })

        it('If error occured during script fetching callback is not called', function () {
            req(['a'], cb)
            cb.called.should.be.false
        })

        it('Supports setting of base url for all module lookups', function () {
            req.baseUrl = 'script'
            req.loadScript = sinon.spy()
            req(['a'])
            req.loadScript.calledWith('script/a.js').should.be.true

            req.baseUrl = '/script'
            req(['b'])
            req.loadScript.calledWith('/script/b.js').should.be.true
        })

        describe('require.launch', function () {
            it('fetches specified modules and requires them', function () {
                var a = sinon.spy()
                var b = sinon.spy()
                defScript('a.js', null, a)
                defScript('b.js', null, b)

                req.launch('a', 'b')

                script('a.js').complete()
                script('b.js').complete()

                a.calledOnce.should.be.true
                b.calledOnce.should.be.true
            })

            it('Works inside modules', function () {
                var ac = sinon.spy()
                defScript('a/c.js', null, ac)

                Module('a/b', function (r) {
                    r.launch('./c')
                })

                req('a/b')
                script('a/c.js').complete()

                ac.calledOnce.should.be.true
            })
        })
    })

})

