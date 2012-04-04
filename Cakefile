task 'build', 'Build client-side script', ->
    req = require('./lib')
    require('fs').writeFileSync('require.js', req.globalClientScript(), 'utf8')