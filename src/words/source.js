define({
	VERSION: '0.1',
	getWords: function (callback) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState != 4) 
				return;
			if (xhr.status != 200) {
				callback('Error occured while' +
						 'attempting to fetch words database source file: ' +
						xhr.status + ' ' + xhr.statusText);
				return;	 	 
			}
			callback(undefined, JSON.parse(xhr.responseText));
		}
		xhr.open('GET', '/words/source.json');
		xhr.send();
	}
});
