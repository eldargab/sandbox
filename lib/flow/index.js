
module.exports = LightBox

function LightBox () {}

LightBox.prototype.def = function (task, deps, fn) {
  if (typeof deps == 'function') {
    fn = deps
    deps = fn.deps
  }
  this['_fn_' + task] = fn || function noop () {}
  this['_deps_' + task] = deps
  return this
}

LightBox.prototype.eval = function (task, cb) {
  if (this[task] !== undefined) {
    this[task] instanceof Error
      ? cb.call(this, this[task])
      : cb.call(this, null, this[task])
    return this
  }
  var promise = '_promise_' + task
  if (!this[promise]) {
    this[promise] = new Promise(this, task)
    cb && this[promise].ondone(cb)
    this[promise].eval()
  } else {
    cb && this[promise].ondone(cb)
  }
  return this
}

LightBox.prototype.run = function (task, cb) {
  var instance = Object.create(this)
  task && instance.eval(task, cb)
  return instance
}

LightBox.prototype.set = function (name, val) {
  this[name] = val
  return this
}

LightBox.prototype.onerror = function (task, fn) {
  arguments.length == 1
    ? this._onerror_ = task
    : this['_onerror_' + task] = fn
  return this
}

LightBox.prototype.raise = function (task, err) {
  if (arguments.length == 1) {
    this._onerror_(task)
  } else {
    var handler = this['_onerror_' + task] || this._onerror_
    handler.call(this, err, task)
  }
}

LightBox.prototype._onerror_ = function (err) {

}


function Promise (box, task) {
  this.box = box
  this.task = task
  this.fn = this.box['_fn_' + task]
  if (!this.fn) throw new Error('Task "' + task + '" is not defined')
  this.deps = this.box['_deps_' + task]
  this.callbacks = []
}

Promise.prototype.ondone = function (cb) {
  this.callbacks.push(cb)
}

Promise.prototype.eval = function () {
  this.deps ? this.evalWithDeps(0) : this.exec()
}

Promise.prototype.evalWithDeps = function (index) {
  var sync = true, self = this
  while (sync) {
    var dep = this.deps[index++]
    if (!dep) return this.exec()
    var val = this.box[dep]
    if (val !== undefined) {
      if (val instanceof Error) return this.unsatisfiedDependency(val)
      continue
    }
    var done = false
    this.box.eval(dep, function (err) {
      if (err) return self.unsatisfiedDependency(err)
      done = true
      if (sync) return
      self.deps.length > index // safe stack space if it's easy to safe
        ? self.evalWithDeps(index)
        : self.exec()
    })
    sync = done
  }
}

Promise.prototype.unsatisfiedDependency = function (dep, err) {
  var e = new Error('Unsatisfied dependency: ' + dep)
  e.original = err
  this.done(e)
}

Promise.prototype.exec = function () {
  var isSync = this.fn.length == 0
  try {
    if (isSync) {
      this.done(null, this.fn.call(this.box))
    } else {
      this.fn.call(this.box, this.done.bind(this))
    }
  } catch (e) {
    this.done(e)
  }
}

Promise.prototype.done = function (err, val) {
  if (err != null) {
    if (!err instanceof Error) {
      var e = new Error(String(err))
      e.original = err
      err = e
    }
    this.box[this.task] = err
    this.box.raise(this.task, err)
  } else {
    this.box[this.task] = val === undefined ? null : val
  }
  delete this.box['_promise_' + this.task] // cleanup
  for (var i = 0; i < this.callbacks.length; i++) {
    this.callbacks[i].call(this.box, err, val)
  }
}