var T = require('arabic-translit')

module.exports = TranslitEdit

function TranslitEdit (el) {
    var t = T(), prev

    function translit () {
        var str = el.value
        var cursorPos = el.selectionEnd

        // mark cursor position with NULL character
        str = str.slice(0, cursorPos) + '\u0000' + str.slice(cursorPos)

        el.value = prev = t(str, prev).replace(/\u0000/, function (_, offset) {
            cursorPos = offset
            return ''
        })
        el.selectionStart = el.selectionEnd = cursorPos
    }

    $(el).on('keydown', function (evt) {
        if (evt.keyCode == 27) { // Esc key
            translit()
        }
    }).on('keypress', function (evt) {
        var c = String.fromCharCode(evt.charCode)
        if (/[^\w`']/.test(c)) {
            translit()
        }
    })

    return function config (opts) {
        opts = opts || {}
        t = opts.disable
            ? function (s) { return s }
            : T(opts)
    }
}