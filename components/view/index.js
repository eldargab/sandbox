var Model = require('model')
var parse = require('./parse-bindings')

module.exports = View

function View () {
}

View.prototype = Object.create(Model.prototype)

View.prototype._set = function (name, val) {
}

View.prototype.get = function (name) {
}

View.prototype.render = function () {
  this.initBindings()
}

View.prototype.initBindings = function () {
  this._traverse(this.el)
  this.el.setAttribute('data-scope')
}

View.prototype._traverse = function (el) {
  if (el.hasAttribute('data-scope')) return
  this.emit('binding', el)
  child = el.firstChild
  while (child) {
    if (child.nodeType === 1) this._traverse(child)
    child = child.nextSibling
  }
}

View.prototype.on('binding', function (el) { // default data-bind syntax
  var bindings = el.getAttribute('data-bind')

  if (!bindings) return

  parse(bindings, function (type, param, path, filters) {
    var createPoint = 'point_' + type
    if (!this[createPoint]) return

    var point = this[createPoint](el, param)

    for (var i = 0; i < filters.length; i++) {
      var createFilter = 'filter_' + filters[i]
      if (!createFilter) continue
      var f = this[createFilter]()
      point = f(point)
    }

    var bind = 'bind_' + type
    if (this[bind]) {
      this[bind](point, path)
      return
    }

    this.bind(point, path)
  }.bind(this))
})

View.prototype.bind = function (point, path) {
  point.onchange && point.onchange(function push () {
    this.set(path, point.get())
  }.bind(this))

  function pull () {
    point.set(this.get(path))
  }

  this.on('sync:' + path, pull)
  this.on('reset', pull)
}

var Css = require('css-binding')
View.prototype.point_css = function (el, klass) {
  return new Css(el, klass)
}

var Attr = require('attribute-binding')
View.prototype.point_attr = function (el, name) {
  return new Attr(el, name)
}

var Value = require('value-binding')
View.prototype.point_value = function (el) {
  return new Value(el)
}

var Event = require('event-binding')
View.prototype.point_event = function (el, name) {
  return new Event(el, name)
}

View.prototype.bind_event = function (point, path) {
  point.on('domevent', function (ev) {
    this.emit('domevent', ev, path)
  }.bind(this))
}

var Text = require('text-binding')
View.prototype.point_text = function (el) {
  return new Text(el)
}
