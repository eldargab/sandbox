var bind = require('event').bind
var Emitter = require('emitter')

module.exports = Value

function Value (el) {
  this.el = el
  bind(this.el, 'change', this.emit.bind(this, 'change'))
}

Value.prototype = Object.create(Emitter.prototype)

Value.prototype.onchange = function (fn) {
  this.on('change', fn)
}

Value.prototype.get = function () {
  return this.el.type == 'checkbox' || this.el.type == 'radio'
    ? this.el.checked
    : this.el.value
}

Value.prototype.set = function (val) {
  this.type == 'checkbox' || this.el.type == 'radio'
    ? this.el.checked = !!val
    : this.el.value = val
}
