var Classes = require('classes')

module.exports = Css

function Css (el, klass) {
  this.classes = Classes(el)
  this.klass = klass
}

Css.prototype.get = function () {
  return this.classes.has(this.klass)
}

Css.prototype.set = function (val) {
  val
    ? this.classes.add(this.klass)
    : this.classes.remove(this.klass)
}
