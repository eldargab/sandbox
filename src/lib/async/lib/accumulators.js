define(function () {
acc = {};

acc.array = function (array, value) {
	if (!array) return [value];
	array.push(value);
	return array;
}
acc.array.def = Array;

acc.first = function (firstValue, value) {
	return firstValue === undefined ? value : firstValue;
}

return acc;
});
