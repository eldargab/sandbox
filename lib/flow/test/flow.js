var should = require('should')
var Log = require('test-log')
var Box = require('../index')

describe('light-box', function () {
  var box, log

  beforeEach(function () {
    box = new Box
    log = Log()
  })

  describe('.eval(task, [cb])', function () {
    it('Throws if task is not defined', function () {
      ;(function () {
        box.eval('hi')
      }).should.throw(/task/i)
    })

    it('Calls task function to get actual value', function (done) {
      box.def('foo', function () {
        return 'bar'
      })
      box.eval('foo', function (err, val) {
        val.should.equal('bar')
        done()
      })
    })

    it('If task accepts arguments, it is async', function (done) {
      var end
      box.def('foo', function (_end) {
        end = _end
      })
      box.eval('foo', function (err, val) {
        val.should.equal('ok')
        done()
      })
      end(null, 'ok')
    })

    it('Calls callback with `this` set to box', function () {
      box.def('foo', function () {
        return 'bar'
      }).eval('foo', function () {
        this.should.equal(box)
      })
    })

    it('Task should be called with `this` set to box', function (done) {
      box.def('foo', function () {
        this.should.equal(box)
        done()
      }).eval('foo')
    })

    it('Stores result of the task in `this[task_name]` variable', function () {
      box.def('a', function () {
        return 'b'
      })
      should.ok(box.a === undefined)
      box.eval('a')
      box.a.should.equal('b')
    })

    it('Sets `this[task_name]` to `null` when the result is `undefined`', function () {
      box.def('undefined', function () {}).eval('undefined')
      should.ok(box['undefined'] === null)
    })

    it('Does not call task function when `this[task_name]` is not `undefined`', function (done) {
      box.hello = 10
      box.eval('hello', function (err, hello) {
        hello.should.equal(10)
        done()
      })
    })

    it('Evaluates all task dependencies before evaluating task itself', function () {
      var a, b, c, d

      box
        .def('a', ['b', 'c', 'd'], function (done) {
          log('a')
          a = done
        })
        .def('b', ['c'], function (done) {
          log('b')
          b = done
        })
        .def('c', function (done) {
          log('c')
          c = done
        })
        .def('d', function (done) {
          log('d')
          d = done
        })
        .eval('a', function () {
          log('done')
        })

      log.should.equal('c')
      c()
      log.should.equal('c b')
      b()
      log.should.equal('c b d')
      d()
      log.should.equal('c b d a')
      a()
      log.should.equal('c b d a done')
    })
  })

  describe('.run()', function () {
    it('Creates new box instance with everything been inherited', function () {
      box.def('foo', function () {
        return 'bar'
      })
      var New = box.run().eval('foo')
      New.foo.should.equal('bar')
      should.not.exist(box.foo)
    })
  })

  describe('Error handling', function () {
    it('Catches task exceptions', function (done) {
      box.def('hello', function () {
        throw 'hello error'
      })
      box.eval('hello', function (err) {
        err.should.equal('hello error')
        done()
      })
    })
  })
})