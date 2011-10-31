define(['lib/async', 'lib/indexedDb'], function (a, idb) {
var NOT_READY_ERR = WordsDb.NOT_READY_ERR = 1;
var REQUEST_ERR = WordsDb.REQUEST_ERR = 2;
var INIT_ERR = WordsDb.INIT_ERR = 3;
var CLOSED_ERR = WordsDb.CLOSED_ERR = 4;

return WordsDb;

function WordsDb (src, DB_NAME) {
	var db;
	var isReady = false;
	var isClosed = false;
	var initError;

	init(function (error) {
		if (error || isClosed) {
			initError = error;
			closeDb();
			return;
		}
		isReady = true;
	});

	this.findWord = function (word, callback) {
		if (returnErrorIfNotReady(callback)) return;

		var t = db.transaction(['index', 'articles']);
		var formsIndex = t.objectStore('index').index('forms');	
		var articles = t.objectStore('articles');

		a.chain
			(idb.getObjectsStream(formsIndex, idb.keyRange.only(word)))
			(function getWord (index, cb) {
				idb.getByKey(articles, index.id, cb);
			})
			(a.node.fold)
		()
		(function (error, variants) {
			if (error) {
				returnError(callback, REQUEST_ERR, error);
				return;
			}
			callback(undefined, variants);	
		});
	}

	this.close = function () {
		isClosed = true;
		if (isReady || initError)
			closeDb();
	}

	return;

	function returnErrorIfNotReady (callback) {
		if (initError) {
			returnError(callback, INIT_ERR, initError);
			return true;
		}
		if (isClosed) {
			returnError(callback, CLOSED_ERR);
			return true;
		}
		if (!isReady) {
			returnError(callback, NOT_READY_ERR);
			return true;
		}
		return false;
	}

	function returnError  (callback, type, innerError) {
		callback({
			type: type,
			innerError: innerError
		});
	}

	function closeDb () {
		if (db)
			db.close();
	}

	function init (callback) {
		a.proc
			(openDatabase)
			(a.IF, needsRebuilding)
				(buildDatabase)
			()
		()
		(callback)
	}

	function openDatabase (callback) {
		idb.open(DB_NAME, function (error, _db) {
			db = _db;
			callback(error);
		});
	}

	function needsRebuilding () {
		return db.version !== src.VERSION;
	}

	function buildDatabase (callback) {
		a.proc
			(idb.clear, db)
			(executeBuilding, src.VERSION, src.getWords)
		()
		(callback);
	}

	function executeBuilding (version, words, callback) {
		setVersion(version, function (transaction, cb) {
			var articlesStore = db.createObjectStore('articles', {keyPath: 'id'});
			var indexStore = db.createObjectStore('index', {autoIncrement: true});
			indexStore.createIndex('forms', 'form');

			var wordId = 0;
			words.forEach(function (word) {
				word.id = wordId++;
				articlesStore.add(word);

				word.index.forEach(function (form) {
					indexStore.add({
						form: form,
						id: word.id
					});
				});
			});
			cb();
		}, 
		callback);
	}

	function setVersion (version, updateProc, callback) {
		idb.setVersion(db, version, updateProc, onblocked, callback);

		function onblocked () {
			callback(new Error('Database is blocked'));
		}
	}
}
});	
