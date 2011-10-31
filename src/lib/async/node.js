define([
	'./lib/js',
   	'./base',
   	'./builder',
   	'./lib/accumulators',
	'./generators'
], function (js, base, builder, acc, gen) {

var node = function (write, nodeFactory) {
	var obj = {};
	builder.markAsDirect(obj);
	builder.setChainAccumulator(obj, function (upstream) {
		return nodeFactory(upstream);
	});	
	return write(obj);
}
builder.markAsControl(node);

node.foreach = builderNodeApp(base.foreach);

node.fold = nodeApp(function (upstream, accumulator) {
	accumulator = accumulator || acc.array;
	return base.fold(upstream, accumulator);
})

node.unfold = nodeApp(function (upstream, generator) {
	generator = generator || gen.array;
	return base.unfold(upstream, generator);
});

for (var method in node) {
	builder.markAsControl(node[method]);
}
return node;

function builderNodeApp (factory) {
	return function (write) {
		var app = builder.readApp.apply(undefined, js.slice(arguments, 1));
		return node(write, function (upstream) {
			return factory(upstream, app);
		});
	}
}

function nodeApp (factory) {
	return function (write) {
		var factoryArgs = js.slice(arguments, 1);
		return node(write, function (upstream) {
			return factory.apply(undefined, [upstream].concat(factoryArgs));
		});
	}
}
});
