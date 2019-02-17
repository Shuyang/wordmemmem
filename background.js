chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({url: 'flashcards.html'});
});

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    console.log(url);
    chrome.storage.local.set()
});