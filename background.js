function get_word(url) {
    let url_parser =  document.createElement('a');
    url_parser.href = url;
    let hostname = url_parser.hostname;
    let word;
    if (hostname == 'www.dictionary.com') {
        // example url https://www.dictionary.com/browse/cat?r=75&src=ref&ch=dic
        let paths = url_parser.pathname.split('/');
        if (paths[1] == 'browse') 
            word = paths[2];
    } 
    return word;
}

function update_record(word, history_item, result) {
    var word_record = result[word] ;
    if (word_record != undefined) {
        word_record.visit_count++;
        word_record.last_visit_time = history_item.lastVisitTime;
    } else {
        word_record = {
            'last_visit_time': history_item.lastVisitTime,
            'visit_count': history_item.visitCount,
        }
    }
    save_object = {};
    save_object[word] = word_record;
    chrome.storage.local.set(save_object);
}

chrome.history.onVisited.addListener(function (history_item) {
    let url = history_item.url;
    let word = get_word(url);
    if (word == undefined)
        return;
    let update_record_callback = update_record.bind(null, word, history_item);
    chrome.storage.local.get(word, update_record_callback);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({url: 'flashcards.html'});
});