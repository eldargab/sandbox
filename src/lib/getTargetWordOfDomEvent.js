define(function () {
	function getTextNodesOfElement(element) {
		var textNodes = [];
		var childNodes = element.childNodes;
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i].nodeName == '#text')
				textNodes.push(childNodes[i]);
		}
		return textNodes;
	}

	function isEventPointInRange(range, domEvent) {
		var clientRects = range.getClientRects();
		for (var i = 0; i < clientRects.length; i++) {
			var rect = clientRects[i];
			if (rect.top < domEvent.clientY &&
				rect.bottom > domEvent.clientY &&
				rect.left < domEvent.clientX &&
				rect.right > domEvent.clientX)
		   return true;	
		}
		return false;
	}

	return function (wordSplitter, domEvent) {
		var targetWordRange;
		var textNodesOfTargetElement = getTextNodesOfElement(domEvent.target); 

		textNodesOfTargetElement.forEach(function (textNode) {
			var text = textNode.data;
			var words = wordSplitter(text);
			words.forEach(function (word) {
				var range = document.createRange();
				range.setStart(textNode, word.begin);
				range.setEnd(textNode, word.end);
				if (isEventPointInRange(range, domEvent))
					targetWordRange = range;
			});
		});
		return targetWordRange;
	}
});
