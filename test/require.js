var sinon = require('sinon');
require('should');

var req = require('..');
var regModule = require('./utils/registerModule');
var createScriptLoader = require('./utils/createScriptLoader');


function defScript (name, deps) {
    req.loadScript.script(name, deps);
}

function script (name) {
    return req.loadScript.scripts[name];
}

function resetState () {
    req.modules = {}
    req.packages = {}
    req.loading = {}
    req.baseUrl = undefined
}

describe('Client-side `require`', function () {
    beforeEach(resetState);

    it('registered modules can be required', function () {
        regModule('a', 'a');
        regModule('a/b/c', 'abc');
        
        req('a').should.equal('a');
        req('a/b/c').should.equal('abc');
   });

    it('`require` supplied to module supports relative paths', function () {
        regModule('a/b', 'ab');
        regModule('a/c/d', 'acd');
        regModule('e/g', 'eg');
        
        var runned = false;

        regModule('a/c/test', function (r) {
            r('./d').should.equal('acd');
            r('../b').should.equal('ab');
            r('e/g').should.equal('eg');
            r('/e/g').should.equal('eg');
            runned = true;
        });

        req('a/c/test');
        runned.should.be.true;
    });

    it('It is possible to register main files for packages', function () {
        regModule('a/b/c/d', 'abcd');
        req.registerPackage('a/b', './c/d'); // main files resolved relatively from packages folder
        req('a/b').should.equal('abcd');
    });

    it('Modules with names other than *.js are registered with .js suffix appended', function () {
        regModule('a', 'a');
        req('a.js').should.equal('a');
    });

    describe('async module loading and require', function () {
        var cb;

        beforeEach(function () {
            req.loadScript = createScriptLoader();
            cb = sinon.spy();
        });

        it('When all required modules and their dependencies already present, callback called immediately', function () {
            regModule('a/b');
            regModule('b');
            
            req(['a/b', 'b'], cb);

            cb.calledOnce.should.be.true;
        });

        it('Resolves all dependecies correctly and waits until all of them have been fetched', function () {
            defScript('a/b.js', ['.', './c', 'e']);
            defScript('a/c.js', ['e']);
            defScript('e.js');
            defScript('a/b/c/d.js');
            req.registerPackage('a', './b/c/d');

            req(['a/b', 'a'], cb);

            script('a/b.js').called.should.be.true;
            script('a/b/c/d.js').called.should.be.true;
            
            script('a/b.js').complete();

            script('a/c.js').called.should.be.true;
            script('e.js').called.should.be.true;

            cb.called.should.be.false;

            script('a/c.js').complete();
            script('e.js').complete();
            script('a/b/c/d.js').complete();

            cb.calledOnce.should.be.true;
        });

        it('Handles circular dependencies', function () {
            defScript('a.js', ['b']);
            defScript('b.js', ['a']);

            req(['a'], cb);
            script('a.js').complete();
            script('b.js').complete();

            cb.calledOnce.should.be.true;
        });

        it('If error occured during script fetching callback is not called', function () {
            req(['a'], cb);
            cb.called.should.be.false;
        });

        it('Supports setting of base url for all module lookups', function () {
            req.baseUrl = 'script';
            req.loadScript = sinon.spy();
        
            req(['a'])

            req.loadScript.calledWith('script/a.js').should.be.true;
        });
    });
    
});

