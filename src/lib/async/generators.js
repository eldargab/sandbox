define(['./base'], function (base) {
var gen = {};

gen.array = function createArrayGenerator (array) {
	if (!array || array.length == 0)
		return null;

	var index = -1;

	return function arrayGenerator (callback) {
		callback = arguments[arguments.length - 1];
		index++;
		if (array.length <= index) {
			index = -1;
			callback(base.END_OF_STREAM);
			return;
		}
		callback(undefined, array[index]);
	}
}

return gen;
});
