// Import core functionality
import { get_word, update_record, process_history_item, load_regexes, load_from_history } from './core.js';



// Listen for history visits
chrome.history.onVisited.addListener(process_history_item);

// Listen for storage changes to reload regexes automatically
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.regexes) {
        console.log('Regexes updated in storage, reloading...');
        load_regexes();
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.create({url: 'flashcards.html'});
});

// Initialize on installation
chrome.runtime.onInstalled.addListener(function(){
    console.log('Extension installed');
    load_from_history(function() {
        console.log('History loaded, extension ready');
    });
});

