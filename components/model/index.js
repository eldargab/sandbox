var Emitter = require('emitter')

module.exports = Model

function Model () { }

Model.prototype = Object.create(Emitter.prototype)

Model.prototype.use = require('reuse')

Model.prototype.set = function (attr, val) {
  if (typeof attr == 'string') {
    this.__setAttr(attr, val)
  } else {
    for (var key in attr) {
      this.__setAttr(key, attr[key])
    }
  }
}

Model.prototype.__setAttr = function (attr, val) {
  var setter = 'onset_' + attr
  this[setter] ? this[setter](val, attr) : this._set(attr, val)
}

Model.prototype._set = function (attr, val) {
  if (this[attr] !== val) {
    this[attr] = val
    this.emit('change:' + attr, attr)
  }
  this.emit('sync:' + attr, attr) // TODO: this should be defered
}
