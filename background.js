// Import core functionality
import { get_word, update_record, process_history_item } from './core.js';

// Listen for history visits
chrome.history.onVisited.addListener(process_history_item);

// Handle extension icon click
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.create({url: 'flashcards.html'});
});

// Initialize on installation
chrome.runtime.onInstalled.addListener(function(){
    const init_regexes = [
        {name: "dictionary.com", regex: "https://www.dictionary.com/browse/([^?&]+)"}, 
        {name: "google dobs", regex: "https://www.google.com/search.*#dobs=(.+)"},
        {name: "google define", regex: "https://www.google.com/search\\?q=define\\+([^&?]+)"},
        {name: "merriam-webster", regex: "https://www.merriam-webster.com/dictionary/([^?&]+)"},
        {name: "youdao.com/search", regex: "http://dict.youdao.com/search\\?q=([^&?]+)"},
        {name: "youdao.com/w", regex: "http://dict.youdao.com/w/([^/?&]+)/"},
    ]
    chrome.storage.sync.set({regexes: init_regexes});
});

