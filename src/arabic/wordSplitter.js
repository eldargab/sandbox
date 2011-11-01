define(['splitString'], function (splitString) {
	return function (string) {
		return splitString(/\s+/g, string);
	}
});
