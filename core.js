let regexes = [];

// Default regexes configuration
export const default_regexes = [
    {name: "dictionary.com", regex: "https://www.dictionary.com/browse/([^?&]+)"}, 
    {name: "google dobs", regex: "https://www.google.com/search.*#dobs=(.+)"},
    {name: "google define", regex: "https://www.google.com/search\\?q=define\\+([^&?]+)"},
    {name: "merriam-webster", regex: "https://www.merriam-webster.com/dictionary/([^?&]+)"},
    {name: "youdao.com/search", regex: "http://dict.youdao.com/search\\?q=([^&?]+)"},
    {name: "youdao.com/w", regex: "http://dict.youdao.com/w/([^/?&]+)/"},
];

// Initialize regexes
chrome.storage.sync.get("regexes", function(result) { 
    if (result && result.regexes) {
    regexes = result.regexes.map(x => new RegExp(x.regex));
    } else {
        // Fallback to default regexes if none are found
        regexes = default_regexes.map(x => new RegExp(x.regex));
        // Save default regexes
        chrome.storage.sync.set({regexes: default_regexes});
    }
});

export function get_word(url) {
    let word;

    regexes.forEach(regex => {
        let res = url.match(regex);
        if (res !== null && word == undefined) {
            word = res[1];
        }
    });
    return word;
}

export function update_record(word, history_item, result) {
    var word_record = result[word];
    if (word_record != undefined) {
        word_record.visit_count++;
    } else {
        word_record = {
            'visit_count': history_item.visitCount,
        }
    }
    word_record.last_visit_time = history_item.lastVisitTime;
    word_record.url = history_item.url;
    const save_object = {};
    save_object[word] = word_record;
    chrome.storage.local.set(save_object);
}

export function process_history_item(history_item) {
    let url = history_item.url;
    let word = get_word(url);
    if (word == undefined)
        return;
    let update_record_callback = update_record.bind(null, word, history_item);
    chrome.storage.local.get(word, update_record_callback);
}
