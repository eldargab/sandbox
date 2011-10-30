define(['./base', 
	   './builder', 
	   './lib/accumulators', 
	   './lib/js'], 
function (base, builder, acc, js) {
var controls = {};

var TRY = controls.TRY = function (write) {
	var fakeProc = function (cb) {
		cb();
	}
	var tryProc = fakeProc;
	var catchProc;
	var finallyProc = fakeProc;
	var error;
	var errorStream = function (cb) {
		cb(undefined, error);
	}

	return builder.readProc(onTryProc, function isStop (obj) {
		return obj === FINALLY || obj === CATCH;
	});

	function onTryProc (proc, stopArg) {
		tryProc = proc || fakeProc;
		if (stopArg === FINALLY)
			return builder.readProc(onFinallyProc);
		return readProcAndBindUpstreamToEachApp(errorStream, onCatchProc, function isStop (obj) {
			return obj === FINALLY || obj === undefined;
		});
	}

	function onCatchProc (proc, stopArg) {
		catchProc = proc || fakeProc;
		if (stopArg === FINALLY)
			return builder.readProc(onFinallyProc);
		return write(tryApp);
	}

	function onFinallyProc (proc) {
		finallyProc = proc || fakeProc;
		return write(tryApp);
	}

	function tryApp (callback) {
		tryProc(function (e) {
			finallyProc(function (finallyError) {
				if (finallyError) {
					js.console.error('Error ' + 
									 finallyError + 
									 ' occured while processing async.FINALLY block');
				}
				if (e) {
					error = e;
					catchProc ? catchProc(callback) : callback(e);
					return;
				}
				callback();
			});
		});
	}
}

var CATCH = controls.CATCH = {};
var FINALLY = controls.FINALLY = {};


var IF = controls.IF = function (write, cond) {
	cond = js.isFunction(cond) ? builder.toApp(cond) : base.toStream(cond);
	var trueProc;
	var falseProc;

	return builder.readProc(onTrueProc, function isEndOfTrueProc (obj) {
		return obj === undefined || obj === ELSE;
	});

	function onTrueProc (proc, stop) {
		trueProc = proc;
		return stop === ELSE ? builder.readProc(onFalseProc) : write(ifApp);
	}

	function onFalseProc (proc) {
		falseProc = proc;
		return write(ifApp);
	}

	function ifApp (callback) {
		cond(function (error, isTrue) {
			if (error) {
				callback(error);
				return;
			}
			var nextApp = isTrue ? trueProc : falseProc;
			if (nextApp) {
				nextApp(callback);
			} 
			else {
				callback();
			}
		});
	}
}

var ELSE = controls.ELSE = {}

builder.markAsControl(TRY, IF);

return controls;

function readProcAndBindUpstreamToEachApp (upstream, ondone, stop) {
	return builder.readApps(function (apps, stopArg) {
		if (!apps) return ondone(undefined, stopArg);
		apps = apps.map(function (app) {
			return base.bind(app, [upstream]);
		});
		return ondone(base.proc(apps), stopArg);
	}, stop);
}
});
