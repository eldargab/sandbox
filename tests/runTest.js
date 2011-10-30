define(function () {
return function runTest (test) {
	var callback = sinon.spy();
	var expects = test.expects || [];

	test.app(callback);

	waitsFor(function () {
		return callback.called;
	});

	runs(function () {
		var spec = this;
		var error = callback.args[0][0];
		if (error) {
			spec.fail(error);
			return;
		}
		expects.forEach(function (fn) {
			if (!fn.called) 
				spec.fail('Expectation ' + fn.name + ' not called');
		});
	});
}
});
