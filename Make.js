var Bundle = require('exposer').Bundle

Bundle('.compiled/app.js', function () {
    this.includeRequire = true
    this.main = 'app'
    this.add('lib', '.')
})
