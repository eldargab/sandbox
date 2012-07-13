var TranslitEdit = require('translit-edit')

$(function () {
    window.config = TranslitEdit(document.getElementById('translit'))
})