require(['lib/splitString'], function (splitString) {
	describe('Split string function', function () {
		it('Splits string at delimeters specified by RegExp', function () {
			expectSplitToBe('a b c', ['a', 'b', 'c']);
		});

		it('Always returns an Array, even if there are no results', function () {
			expectSplitToBe('', []);
		});

		describe('Never includes empty string to the final results array. Whether it goes from:', function () {
			it('Splitting of empty string', function () {
				expectSplitToBe('', []);
			});
			it('Splitting of two sequental delimeters', function () {
				expectSplitToBe('a' + ' ' + ' ' + 'b', ['a', 'b']);
			});
			it('Splitting of strings wich are ending or starting with delimeter tags', function () {
				expectSplitToBe(' a b ', ['a', 'b']);
			});
		});

		function expectSplitToBe(string, result) {
			expect(toSubstrings(splitAtSpaces(string), string)).toEqual(result);
		}

		function splitAtSpaces (string) {
			return splitString(/\s/g, string);
		}

		function toSubstrings (results, string) {
			var substrings = [];
			results.forEach(function (result) {
				substrings.push(string.slice(result.begin, result.end));
			});
			return substrings;
		}
	});
});
