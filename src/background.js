define([
	'lib/async',
	'lib/html',
	'words/db',
	'words/source',
	'arabic/main'
], function (a, html, WordsDb, wordsSource, arabic) {

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	if (request.type == 'translate') {
		translate(request.word, function (result) {
			sendResponse(result);
		});
	}
});

var wordsDb = new WordsDb(wordsSource, 'words');

function translate (word, callback) {
	var possibleForms = arabic.getPossibleMainForms(word);
	a.chain
		(a.gen.array(possibleForms))
		(wordsDb.findArticles)
		(a.node.unfold)
	()
	(function (error, wordArticle) {
		if (error === a.base.END_OF_STREAM) {
			callback(writeNothingFound(word));
		}
		else if (error) {
		   	callback(writeErrorResult(error));
		}
		else {
			callback(writeArticleResult(wordArticle));
		}
	});
}

function writeArticleResult (article) {
	with (html.tags) return html
		(DIV, {class: 'arabic-dict-word'})
			(article.mainForms.toString())
		()
		(DIV, {class: 'arabic-dict-translation'})
			(article.translation)
		()
	();
}

function writeNothingFound (word) {
	return 'Слово "' + word + '" не найдено.';
}

function writeErrorResult (error) {
	if (error.type === WordsDb.NOT_READY_ERR) {
		return 'Идёт инициализация базы данных словаря. Попробуйте чуть позже.';
	}
	else if (error.innerError) {
		return error.innerError.toString();
	}
	else {
		return error.toString();
	}
}
});
