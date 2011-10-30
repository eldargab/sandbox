define(['./js'], function (js) {
return function loop (asyncFn, callback) {
	var isAsync = false;
	do {
		var redo = false;
		var callbackCalled = false;
		asyncFn(function () {
			if (callbackCalled) {
				js.console.warn('AsyncFunction ' 
								 + asyncFn + 
								 ' called its callback twice'); 
				return;
			}
			callbackCalled = true;
			var isDone = callback.apply(undefined, arguments);
			if (isDone)
			   	return;
			if (isAsync) {
				loop(asyncFn, callback);
			}
			else {
				redo = true;
			}
		});	
	} while (redo);
	isAsync = true;
}
});
