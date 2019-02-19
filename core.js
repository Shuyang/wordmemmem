var regexes;
chrome.storage.sync.get("regexes", function(result) { 
    regexes = result.regexes.map(x => new RegExp(x.regex));
});

function get_word(url) {
    let url_parser =  document.createElement('a');
    url_parser.href = url;
    let hostname = url_parser.hostname;
    let word;

    regexes.forEach(regex => {
        let res = url.match(regex);
        if (res !== null && word == undefined) {
            word = res[1];
        }
    });
    return word;
}

function update_record(word, history_item, result) {
    var word_record = result[word] ;
    if (word_record != undefined) {
        word_record.visit_count++;
    } else {
        word_record = {
            'visit_count': history_item.visitCount,
        }
    }
    word_record.last_visit_time = history_item.lastVisitTime;
    word_record.url = history_item.url
    save_object = {};
    save_object[word] = word_record;
    chrome.storage.local.set(save_object);
}

function process_history_item(history_item) {
    let url = history_item.url;
    let word = get_word(url);
    if (word == undefined)
        return;
    let update_record_callback = update_record.bind(null, word, history_item);
    chrome.storage.local.get(word, update_record_callback);
}
