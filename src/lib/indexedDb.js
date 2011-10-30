define(['lib/js', 'lib/async'], function (js, a) {
var idb = {};
idb.factory = webkitIndexedDB; 
idb.keyRange = webkitIDBKeyRange;
idb.DatabaseException = webkitIDBDatabaseException;

idb.Error = function (request, message) {
	if (!message)
		message = '';

	if (request) {
		var errorCode = request.errorCode;
		if (request.transaction) {
			var dbName = request.transaction.db.name;
		}
		var codeDescription = getCodeDescription(errorCode);
		message += js.print(' IndexedDb error: %s.', codeDescription);
	}

	this.prototype = Error.prototype;
	this.name = 'IndexedDbError';
	this.message = message;
	this.errorCode = errorCode;
	this.errorDescription = codeDescription;
	this.dbName = dbName;

	function getCodeDescription (errorCode) {
		for (var prop in idb.DatabaseException) {
			if (/.*_ERR$/.test(prop) && idb.DatabaseException[prop] == errorCode)
				return prop;
		}	
		return '';
	}
}

idb.getStoreName = function (store) {
	if(store.objectStore) {
		return js.print('index "%s" of object store "%s"', store.name, store.objectStore.name);
	}
	else {
		return store.name;
	}
}

idb.dispatchRequest = function (request, callback, errorMsg) {
	request.addEventListener('success', function () {
		callback(undefined, request.result);
	});
	request.addEventListener('error', function () {
		callback(new idb.Error(request, errorMsg));
	});
}

idb.open = function (dbName, callback) {
	idb.dispatchRequest(
		idb.factory.open(dbName),
		callback,
		js.print('Failed to open "%s" database.', dbName)
	);
}

idb.setVersion = function (db, version, updateProcedure, onblocked, callback) {
	a.proc
		(startTransaction)
		(a.TRY)
		  (runUpdateProcedure)
		  (waitForTransactionComplete)
		(a.CATCH)
			(abortTransaction)
			(throwError)
		()
	()
	(callback);

	var transaction;
	var monitor;

	function startTransaction (cb) {
		var setVersionReq = db.setVersion(version);
		setVersionReq.onblocked = onblocked;
		setVersionReq.onerror = function () {
			cb(new idb.Error(
				setVersionReq.errorCode, 
				js.print('Failed to start setVersion transaction on "%s"', db.name))
			);
		}
		setVersionReq.onsuccess = function () {
			transaction = setVersionReq.result;
			monitor = new TransactionMonitor(transaction);
			cb();
		}
	}

	function runUpdateProcedure (cb) {
		updateProcedure(transaction, cb);
	}

	function waitForTransactionComplete (cb) {
		monitor.waitForTransactionComplete(cb);
	}

	function abortTransaction () {
		if (!monitor.isTransactionEnded()) {
			transaction.abort();
		}
		return null;
	}

	function throwError (e) {
		throw e;
	}

	function TransactionMonitor (transaction) {
		var isCompleted = false;
		var isAborted = false;
		var error;
		var oncomplete;

		transaction.oncomplete = function () {
			isCompleted = true;
			callOnComplete();
		}

		transaction.onabort = function () {
			isAborted = true;
			callOnComplete();
		}

		transaction.onerror = function (evt) {
			error = new idb.Error(evt.target.errorCode);
		}

		this.isTransactionEnded = function () {
			return isAborted || isCompleted;
		}

		this.waitForTransactionComplete = function (cb) {
			oncomplete = cb;
			callOnComplete();
		}

		function callOnComplete () {
			if (!oncomplete) return;
			if (isCompleted) {
				oncomplete();
			}
			else if (isAborted) {
				if (!error) {
					error = new idb.Error(
						null, 
						js.print('SetVersrion transaction on "%s" was aborted', 
								 transaction.db.name)
					);
				}
				oncomplete(error);
			}
		}
	}
}

idb.clear = function (dbName, callback) {
	a.proc
		(openDb)
		(a.TRY)
			(executeClearing)
		(a.FINALLY)
			(closeDb)
		()
	()
	(callback);

	var db;

	function openDb (cb) {
		if (js.isString(dbName)) {
			idb.open(dbName, function (error, _db) {
				db = _db;
				cb(error);
			});
		}
		else {
			db = dbName;
			cb();
		}
	}

	function closeDb () {
		if (js.isString(dbName))
			db.close();
		return null;
	}

	function executeClearing (callback) {
		idb.setVersion(db, '', updateProcedure, onblocked, callback);
			
		function updateProcedure (transaction, cb) {
			var stores = js.toArray(db.objectStoreNames);
			stores.forEach(function (store) {
				db.deleteObjectStore(store);
			});
			cb();
		}

		function onblocked () {
			closeDb();
			callback(new idb.Error(null, js.print('Database "%s" is blocked', dbName)));
		}
	}
}

idb.getObjectsStream = function (store, range) {
	var request;
	var cursor;
	var cb;
	return function objectsStream (callback) {
		cb = callback;
		if (request) {
			cursor.continue();
			return;
		}
		request = store.openCursor(range);
		request.onsuccess = function () {
			cursor = request.result;
			if (!cursor) {
				cb(a.base.END_OF_STREAM);
				return;
			}
			cb(undefined, cursor.value);
		}
		request.onerror = function () {
			callback(new idb.Error(
				request, 
				js.print('Error while opening or reading cursor of "%s"', idb.getStoreName(store))
			));
		}
	}
}

idb.getAll = function (store, range, callback) {
	a.chain
		(idb.getObjectsStream(store, range))
		(a.node.toArray)
	()
	(callback);
}

idb.getByKey = function (store, key, callback) {
	idb.dispatchRequest(
		store.get(key),
		callback,
		js.print('Error while getting object with key "%s" from "%s"', key, idb.getStoreName(store))
	);
}

return idb;
});
