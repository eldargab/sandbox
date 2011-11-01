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
	});

	it('Finds words correctly', function () {
		var db = new WordsDb(fakeSrc, IDB_NAME);
		var test = a.proc
			(a.sleep, 200)
			(checkFind, 'a', [words[0], words[1]])
			(checkFind, 'B', [words[2]])
		   	(checkFind, 'c', [])	
		()

		function checkFind (word, expectedResults, callback) {
			db.findArticles(word, function (error, results) {
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

		this.runTest({app: test});

		this.after(function () {
			db.close();
			idb.clear(IDB_NAME, function (error) {
				if (error)
					throw error;
			});
		});
	});

	xit('When initialization not complete, responds immediatly with NOT_READY_ERR', function () {
	});

	xit('When error occured during initialization, responds with INIT_ERR', function () {
	});
});
});
