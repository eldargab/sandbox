require([
	'words/db', 
	'lib/indexedDb',
	'lib/async',
   	'/tests/runTest.js'
], 
function (WordsDb, idb, a, runTest) {
describe('Word articles database', function () {
	var words = [
		{ word: 'a', index: ['a', 'A'] },
		{ word: 'first letter', index: ['a'] },
		{ word: 'b', index: ['b', 'B'] }
	];

	var fakeSrc = {
		VERSION: '1.0',
		getWords: function () { return words }
	}

	var IDB_NAME = 'TEST';

	beforeEach(function () {
		this.runTest = runTest;
		this.openDb = function () {
			this.db = new WordsDb(fakeSrc, IDB_NAME);
		}
	});

	afterEach(function () {
		var spec = this;
		a.proc
			(function () {
				if (spec.db)
					spec.db.close();
				return null;
			})
			(idb.clear, IDB_NAME)
		()
		(function (error) {
			if (error)
				console.error('AfterEach error: ' + error);
		})
		waits(10);
	});

	it('Finds words correctly', function () {
		var spec = this;
		var test = a.proc
			(a.sleep, 200)
			(checkFind, 'a', [words[0], words[1]])
			(checkFind, 'B', [words[2]])
		   	(checkFind, 'c', [])	
		()

		function checkFind (word, expectedResults, callback) {
			spec.db.findWord(word, function (error, results) {
				if (error) {
					callback(error)
					return;
				}
				expect(results.length).toEqual(expectedResults.length);
				results.forEach(function (word) {
					delete word.id;	
					expect(results).toContain(word);
				});	
				callback();
			});	
		}

		this.openDb();
		this.runTest({app: test});
	});

	function expectError (callback, errType) {
		expect(callback).toHaveBeenCalled();
		expect(callback.args[0][0].type).toEqual(errType);
	}

	it('When initialization not complete, responds immediatly with NOT_READY_ERR', function () {
		var callback = sinon.spy();
		this.openDb();
		this.db.findWord('a', callback);
		expectError(callback, WordsDb.NOT_READY_ERR);
	});

	xit('When error occured during initialization, responds with INIT_ERR', function () {
		var vars = new a.Vars();
		var test = a.proc
			(vars('db'), a.c(idb.open, IDB_NAME))
			(a.sync, this.openDb)
			(a.sleep, 10)
			(a.TRY)
				(this.db.findWord, 'word')
			(a.CATCH)
			(a.FINALLY)
				(idb.close, vars.db)
			()
		()
	});
});
});
