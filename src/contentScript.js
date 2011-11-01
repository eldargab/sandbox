//require(['arabic/wordSplitter', 'lib/getTargetWordOfDomEvent'], (function (wordSplitter, getTargetWordOfDomEvent) {
	var wordSplitter = function (string) {
		return splitString(/\s+/g, string);
	}

	var popup;

	popup = new Popup();
	window.ondblclick = handleTranslateRequest;
	window.onclick = function (evt) {
	}

	function handleTranslateRequest (domEvent) {
		var wordRange = getTargetWordOfDomEvent(wordSplitter, domEvent);
		if (!wordRange) 
			return;

		chrome.extension.sendRequest({type: 'translate', word: wordRange.toString()}, function (response) {
			displayTranslateResult(response, wordRange.getBoundingClientRect(), false);
		});
	}

	function displayTranslateResult (result, anchorRect, isPositionFixed) {
		popup.setContent(result);

		var anchorCenterX = anchorRect.left + anchorRect.width / 2;
		var anchorTop = anchorRect.top;
		var anchorBottom = anchorRect.bottom;
		var popupWidth = popup.getWidth();
		var popupHeight = popup.getHeight();

		var popupLeft = Math.max(
			Math.min((anchorCenterX - popupWidth / 2), (window.innerWidth - popupWidth)),
			0
		);
		var popupTop = (anchorTop - 5 - popupHeight) > 0 ? (anchorTop - 5 - popupHeight) : (anchorBottom + 5);

		popup.display({
			top: popupTop + window.pageYOffset,
			left: popupLeft + window.pageXOffset,
			isFixed: isPositionFixed
		});
	}

	function Popup() {
		var container = window.document.createElement('div');
		container.className = 'arabic-dict-popup';
		container.style.position = 'absolute';
		container.style.visibility = 'hidden';
		document.body.appendChild(container);

		this.getWidth = function () {
			return container.getBoundingClientRect().width;
		}

		this.getHeight = function () {
			return container.getBoundingClientRect().height;
		}

		this.setContent = function (htmlString) {
			container.innerHTML = htmlString;
		}

		this.display = function (options) {
			container.style.position = options.isFixed ? 'fixed' : 'absolute';
			container.style.top = options.top + 'px';
			container.style.left = options.left + 'px';
			container.style.visibility = 'visible';
		}

		this.hide = function () {
			container.style.visibility = 'hidden';
		}
	}
//}));
