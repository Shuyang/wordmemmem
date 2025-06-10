let regexes = [];

export const default_regexes = [
    {
        "name": "dictionary.com",
        "regex": "https://www\\.dictionary\\.com/browse/([^?&#]+)"
    },
    {
        "name": "google define",
        "regex": "https://www\\.google\\.com/search\\?.*?q=define[\\+%20]([^?&#&]+)"
    },
    {
        "name": "google meaning",
        "regex": "https://www\\.google\\.com/search\\?.*?q=([^?&#&+]+)[\\+%20]meaning"
    },
    {
        "name": "merriam-webster",
        "regex": "https://www\\.merriam-webster\\.com/dictionary/([^?&#]+)"
    },
    {
        "name": "youdao.com/search",
        "regex": "https://dict\\.youdao\\.com/search\\?.*?q=([^?&#&/]+)"
    },
    {
        "name": "youdao.com/w",
        "regex": "https://dict\\.youdao\\.com/w/([^?&#/]+)/?$"
    },
    {
        "name": "cambridge",
        "regex": "https://dictionary\\.cambridge\\.org/.*dictionary/[^/]+/([^?&#]+)"
    },
    {
        "name": "collins",
        "regex": "https://www\\.collinsdictionary\\.com/.*dictionary/[^/]+/([^?&#]+)"
    },
    {
        "name": "vocabulary.com",
        "regex": "https://www\\.vocabulary\\.com/dictionary/([^?&#]+)"
    },
    {
        "name": "wordnik",
        "regex": "https://wordnik\\.com/words/([^?&#]+)"
    },
    {
        "name": "thefreedictionary",
        "regex": "https://www\\.thefreedictionary\\.com/([^?&#]+)"
    },
    {
        "name": "urbandictionary",
        "regex": "https://www\\.urbandictionary\\.com/define\\.php\\?term=([^?&#]+)"
    },
];

// Function to load regexes from storage
export function load_regexes() {
    chrome.storage.sync.get("regexes", function (result) {
        if (result && result.regexes) {
            regexes = result.regexes.map(x => new RegExp(x.regex));
            console.log('Regexes reloaded:', regexes.length, 'patterns');
        } else {
            // Fallback to default regexes if none are found
            regexes = default_regexes.map(x => new RegExp(x.regex));
            // Save default regexes
            chrome.storage.sync.set({ regexes: default_regexes });
            console.log('Default regexes loaded:', regexes.length, 'patterns');
        }
    });
}

// Initialize regexes on startup
load_regexes();

export function get_word(url) {
    let word;
    // console.log(regexes);
    regexes.forEach(regex => {
        let res = url.match(regex);
        if (res !== null && res.length > 1) {
            word = res[1]
                .replace(/%20/g, ' ')  // Decode URL-encoded spaces
                .replace(/\+/g, ' ')   // Replace + with spaces
                .toLowerCase() 
            return word;
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
