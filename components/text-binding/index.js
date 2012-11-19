module.exports = Text

function Text (el) {
  this.el = el
}

Text.prototype.get = function () {
  return this.el.textContent
}

Text.prototype.set = function (text) {
  this.el.textContent = text || ''
}
