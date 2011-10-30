define(['./base', './builder', './lib/accumulators'], function (base, builder, acc) {
var node = {};

node.foreach = appWithAcc(base.foreach);

node.accumulate = function (write, accumulator) {
	var chainAcc = function (chain) {
		return base.accumulate(chain, accumulator);
	}
	builder.setChainAccumulator(chainAcc, chainAcc);
	builder.markAsDirect(chainAcc);
	return write(chainAcc);
}

node.toArray = function (write) {
	return node.accumulate(write, acc.array);
}

for (var method in node) {
	builder.markAsControl(node[method]);
}
return node;

function appWithAcc (accumulator) {
	var writer = function (write, app) {
		var app = builder.readApp.apply(undefined, js.slice(arguments, 1));
		builder.markAsDirect(app);
		builder.setChainAccumulator(app, accumulator);
		return write(app);
	}
	return writer;
}
});
