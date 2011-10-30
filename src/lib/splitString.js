define(function () {
	return function (delimRegex, string) {
		var results = [];

		var getNextDelimeter = function () {
			var match = delimRegex.exec(string);
			if (match) {
				return {
					begin: match.index,
					end: delimRegex.lastIndex
				};
			}
		}

		var pushResult = function (delim, prevDelim) {
			var result = {};
			result.begin = (prevDelim !== undefined) ? prevDelim.end : 0;
			result.end = (delim !== undefined) ? delim.begin : string.length;
			if (result.end > result.begin)
				results.push(result);
		}

		var delim;
		var prevDelim;

		do {
			delim = getNextDelimeter();
			pushResult(delim, prevDelim);
			prevDelim = delim;
		} while (delim);

		return results;
	}
});
