define(['./lib/asyncLoop', './lib/js'], function (asyncLoop, js) {

var base = {};
var END_OF_STREAM = base.END_OF_STREAM = {};

base.proc = function (var_apps) {
	var queue = js.isArray(var_apps) ? var_apps : arguments;
	var index = 0;
	var STOP = {};

	return function (callback) {
		asyncLoop(getNextValue, procNextValue);

		function getNextValue (cb) {
			if (queue.length == index) {
				index = 0;
				cb(STOP);
				return;
			}
			queue[index](cb);
		} 
		
		function procNextValue (error) {
			if (error === STOP) {
				callback();
				return true;
			}
			if (error) {
				index = 0;
				callback(error);
				return true;
			}
			index++;
			return false;
		}
	}
}

base.combine = function (var_streams) {
	var streams = js.isArray(var_streams) ? var_streams : arguments;
	if (streams.length < 2)
		return var_streams;

	return function (callback) {
		var values = [];
		var receivedCount = 0;
		var done = false;

		for (var i = 0; i < streams.length; i++) {
			streams[i](valueReceiver(i));
			if (done) return;
		}

		function valueReceiver (i) {
			return function (error) {
				if (done) return;
				if (error) {
					callback(error);
					done = true;
					return;
				}
				values[i] = arguments;
				receivedCount++;
				if (receivedCount == streams.length) {
					callback.apply(undefined, createCallbackArgs());
					done = true;
				}
			}
		}

		function createCallbackArgs() {
			var args = [undefined];
			values.forEach(function (val) {
				args = args.concat(js.slice(val, 1));
			});
			return args;
		}
	}
}

base.bind = function (app, streams) {
	if (streams.length == 0) return app;
	var combinedUpstream = base.combine.apply(undefined, streams);
	return function () {
		var params = parseAppParams(arguments);	
		combinedUpstream(function (error) {
			if (error) {
				params.callback(error);
				return;
			}
			callApp(
				app, 
				params.args.concat(js.toArray(arguments).slice(1)), 
				params.callback
			);
		});
	}
}

base.connect = function (upstream, downstream) {
	return function (callback) {
		downstream(upstream, callback);
	}
}

base.map = function (stream, app) {
	return base.bind(app, [stream]);
}

base.foreach = function (stream, app) {
	return base.map(stream, function () {
		var params = parseAppParams(arguments);
		callApp(app, params.args, function (error) {
			if (error) {
				params.callback(error)
			}
			else {
				returnResult(params.callback, params.args);
			}
		});
	});
}

base.accumulate = function (upstream, accumulator) {
	return function accumulate (callback) {
		var accumulatedValue;

		asyncLoop(upstream, function (error) {
			if (error === END_OF_STREAM) {
				if (accumulatedValue === undefined && accumulator.def) {
					accumulatedValue = new accumulator.def;
				}
				callback(undefined, accumulatedValue);
				return true;
			}
			if (error) {
				callback(error);
				return true;
			}
			arguments[0] = accumulatedValue;
			accumulatedValue = accumulator.apply(undefined, arguments);
		});
	}
}

base.toStream = function (val) {
	var args = js.toArray(arguments);
	args.unshift(undefined);
	return function (callback) {
		callback.apply(undefined, args);
	}
}

base.sync2async = function (fn) {
	return function () {
		var params = parseAppParams(arguments);
		
		js.console.log('Called ' + fn.name + ' with ' + params.args.toString());

		var callback = function (error) {
			if (error) {
				js.console.error('___ throwed ' + error);
			}
			else {
				var args = js.toArray(arguments);
				js.console.log('___ returned ' + args.slice(1).toString());
			}
			params.callback.apply(undefined, arguments);
		};

		try {
			var returnedValue = fn.apply(undefined, params.args.concat(callback));
		}
		catch (e) {
			callback(e);
			return;
		}
		if (returnedValue !== undefined) {
			callback(undefined, returnedValue);
		}
	}	
}

base.parseAppParams = parseAppParams;

return base;

function parseAppParams (params) {
	params = js.toArray(params);
	var callback = params.pop();
	return {
		args: params,
		callback: callback
	}
}

function callApp (app, args, callback) {
	app.apply(undefined, args.concat(callback));
}

function returnResult (callback, args) {
	callback.apply(undefined, [undefined].concat(args));
}
});
