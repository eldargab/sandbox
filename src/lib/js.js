define({
	extend: function(target, source) {
		for (prop in source) {
			target[prop] = source[prop];
		}
	},

	inherit: function(childCtr, parentCtr) {
		function tempCtr() {};
		tempCtr.prototype = parentCtr.prototype;
		childCtr.superClass_ = parentCtr.prototype;
		childCtr.prototype = new tempCtr();
		childCtr.prototype.constructor = childCtr;
	},

	isString: function(val) {
		return typeof val == 'string';
	},

	isNumber: function(val) {
		return typeof val == 'number';
	},

	isBoolean: function () {
		return typeof val == 'boolean';
	},

	isFunction: function(val) {
		return typeof val == 'function';
	},

	isArray: function(val) {
		return val instanceof Array;
	},

	toArray: function (obj) {
		return Array.prototype.slice.call(obj);
	},

	print: function (str, var_args) {
		for (var i = 1; i < arguments.length; i++) {
			var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
			str = str.replace(/\%s/, replacement);
		}
		return str;
	},

	console: console,
});
