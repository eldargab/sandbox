define(['./lib/js', './base', './lib/accumulators'], function (js, base, acc) {
var builder = {};
var CONTROL = {};
var DIRECTLY = {};

builder.markAsControl = function (var_fn) {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].CONTROL = CONTROL;
	}
}

builder.markAsDirect = function (var_fn) {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].DIRECTLY = DIRECTLY;
	}
}

builder.toApp = function (fn) {
	return base.sync2async(fn);
}

builder.readApp = function (fn) {
	var args = Array.prototype.slice.call(arguments, 1);
	var argStreams = toStreams(args).map(function (stream) {
		return builder.toApp(stream);
	});
	return base.bind(builder.toApp(fn), argStreams);
}

builder.readApps = function (ondone, stop) {
	var apps = [];
	var isStop = js.isFunction(stop) ? stop : function (obj) {
		return obj === stop;
	};

	return function read (firstArg) {
		if (isStop(firstArg)) {
			return ondone(apps, firstArg);
		}
		if (firstArg && firstArg.CONTROL === CONTROL) {
			var control = firstArg;
			arguments[0] = read;
			return control.apply(undefined, arguments);
		}
		if (firstArg && firstArg.DIRECTLY === DIRECTLY) {
			apps.push(firstArg);
			return read;
		}
		if (js.isFunction(firstArg)) {
			var app = builder.readApp.apply(undefined, arguments);
			apps.push(app);
			return read;
		}
		apps.push(base.toStream.apply(undefined, arguments));
		return read;
	}
}

builder.readProc = function (ondone, stop) {
	return builder.readApps(function (apps, stopArg) {
		return apps ? ondone(base.proc(apps), stopArg) : ondone(undefined, stopArg);
	}, stop);
}

builder.proc = function () {
	return builder.readProc(function (proc) {
		return proc;
	}).apply(undefined, arguments);
}

builder.readChain = function (ondone, stop) {
	return builder.readApps(function (apps, stopArg) {
		var chain;
		apps.forEach(function (app) {
			var accumulator = app.__chain_acc ? app.__chain_acc : base.map;
			chain = chain ? accumulator(chain, app) : app;
		});
		return ondone(chain, stopArg);
	}, 
	stop);
}

builder.setChainAccumulator = function (app, accumulator) {
	app.__chain_acc = accumulator;
}

builder.chain = function () {
	return builder.readChain(function (chain) {
		return chain;
	}).apply(undefined, arguments)
}

return builder;

function toStreams (values) {
	var streams = [];
	values.forEach(function (val) {
		js.isFunction(val) ? streams.push(val) : streams.push(base.toStream(val));
	});
	return streams;
}
});
