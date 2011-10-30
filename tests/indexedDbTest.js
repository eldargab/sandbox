require(['lib/indexedDb', 'lib/async', 'lib/js', '/tests/runTest.js'], function (idb, a, js, runTest) {
describe('indexedDb', function () {
	beforeEach(function () {
		this.runTest = 	runTest;
	});

	it('setVersion CRUD', function () {
		var test = a.proc
			(openDb)
			(a.TRY)
				(setVersion)	
				(expectVersionIsUpdated)
			(a.FINALLY)
				(closeDb)
				(idb.clear, 'TEST')
			()
			(openDb)
			(expectDatabaseToBeClear)
			(closeDb)
		()

		var db;

		function openDb (cb) {
			a.chain
				(idb.open, 'TEST')
				(function (_db) { db = _db; return null; })
			()
			(cb);
		}

		function setVersion (cb) {
			idb.setVersion(db, '1.0', updateProc, onblocked, cb);

			function updateProc (transaction, cb) {
				db.createObjectStore('store');
				cb();
			}

			function onblocked () {
				cb(new Error('Database is blocked'));
			}
		}

		function expectVersionIsUpdated () {
			expect(db.version).toEqual('1.0');
			expect(js.toArray(db.objectStoreNames)).toEqual(['store']);
			arguments.callee.called = true;
			return null;
		}

		function expectDatabaseToBeClear () {
			expect(db.version).toEqual('');
			expect(db.objectStoreNames.length).toEqual(0);
			arguments.callee.called = true;
			return null;
		}

		function closeDb () {
			db.close();
			return null;
		}

		this.runTest({
			app: test,
			expects: [expectVersionIsUpdated, expectDatabaseToBeClear]
		});
	});

	it('Supports storage with out-of line keys and autoIncrement', function () {
		var db;
		var dbObjects = [
			{id: 'a', val: 1},
			{id: 'b', val: 2},
			{id: 'c', val: 3}
		]

		var test = a.proc
			(openDb, 'TEST')
			(a.TRY)
				(buildDb)
				(checkDbObjects, {range: idb.keyRange.bound('a', 'b'), expected: [dbObjects[0], dbObjects[1]]})
				(checkDbObjects, {range: idb.keyRange.only('c'), expected: [dbObjects[2]]})
			(a.FINALLY)
				(closeDb)
				(idb.clear, 'TEST')
			()
		();

		function openDb (dbName, cb) {
			idb.open(dbName, function (error, _db) {
				db = _db;
				cb(error);
			});
		}

		function buildDb (callback) {
			idb.setVersion(db, '1.0', updateProc, onblocked, callback);

			function updateProc (transaction, cb) {
				var store = db.createObjectStore('store', {autoIncrement: true});
				store.createIndex('index', 'id');
				dbObjects.forEach(function (obj) {
					store.add(obj);
				});
				cb();
			}

			function onblocked () {
				callback(new Error('Database is blocked'));
			}
		}
		
		function checkDbObjects (expectation, callback) {
			var index = db.transaction(['store']).objectStore('store').index('index');
			a.chain
				(idb.getAll, index, expectation.range)
				(function (objects) {
					expect(objects).toEqual(expectation.expected);
					return null;
				})
			()
			(callback);	
		}

		function closeDb () {
			db.close();
			return null;
		}

		this.runTest({
			app: test
		});
	});
});
});
