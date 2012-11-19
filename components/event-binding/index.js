var Emitter = require('emitter')
var bind = require('event').bind

module.exports = Event

function Event (el, name) {
  this.el = el
  bind(this.el, name, this.emit.bind(this, 'domevent'))
}

Event.prototype = Object.create(Emitter.prototype)
