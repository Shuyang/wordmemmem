
chrome.history.onVisited.addListener(process_history_item);

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.create({url: 'flashcards.html'});
});

chrome.runtime.onInstalled.addListener(function(){
    const init_regexes = [
        {name: "dictionary.com", regex: "https://www.dictionary.com/browse/([^?&]+)"}, 
        {name: "google dobs", regex: "https://www.google.com/search.*#dobs=(.+)"},
        {name: "google define", regex: "https://www.google.com/search\\?q=define\\+([^&?]+)"},
        {name: "merriam-webster", regex: "https://www.merriam-webster.com/dictionary/([^?&]+)"},
        {name: "youdao.com/search", regex: "http://dict.youdao.com/search\\?q=([^&?]+)"},
        {name: "youdao.com/w", regex: "http://dict.youdao.com/w/([^/?&]+)/"},
    ]
    chrome.storage.sync.set({regexes: init_regexes})
    regexes = init_regexes.map(x => new RegExp(x.regex));
});

