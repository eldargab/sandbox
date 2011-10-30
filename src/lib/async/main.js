define([
	   './lib/js',
	   './base',
	   './builder',
	   './node',
	   './controls',
	   './lib/accumulators'
],
function (
	js, 
	base, 
	builder,
	node,
	ctr, 
	acc
) {
	var lib = {};

	lib.base = base;
	lib.acc = acc;
	lib.builder = builder;
	lib.proc = builder.proc;
	lib.chain = builder.chain;
	lib.node = node;
	js.extend(lib, ctr);
	
	lib.c = function () {
		return lib.chain.apply(this, arguments)();
	}

	lib.sleep = function (time, callback) {
		var params = base.parseAppParams(arguments);
		var callback = params.callback;
		var time = params.args.pop();
		var upstreamValues = params.args;

		setTimeout(function () {
			callback.apply(undefined, [undefined].concat(upstreamValues));
		}, time);
	}

	return lib;
});
