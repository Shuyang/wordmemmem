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
    // Any other initialization can go here
    console.log('Extension installed');
});

