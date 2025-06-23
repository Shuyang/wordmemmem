import { apply_theme } from './core.js';

function show_cards(result) {
    let word_record_array = Object.entries(result);
    if (word_record_array.length === 0) {
        $('#no-words-message').show();
        return;
    }
    word_record_array.sort(function(a,b){
        return b[1].last_visit_time - a[1].last_visit_time ;
    })
    word_record_array.forEach(function(word_record) {
        let word = word_record[0];
        let word_display = decodeURIComponent(word);
        let time_ago = timeago.format(new Date(word_record[1].last_visit_time));
        let url = word_record[1].url;
        let card = $(`
        <div class="card">
                <div class="word">
                    ${word_display}
                </div>
            <div class="bottom">
                <div class="left">
                    ${time_ago} 
            </div>
            <div class="right">
                <a href="${url}"><img src="icons/link.svg" class="icon"/></a>
                </div>
            </div>
        </div>`);
        let right = card.find(".right").hide()
        let delete_button = $(`
            <img src="icons/trash-alt.svg" class="icon"/>
        `).on('click', function(){
            card.hide();
            chrome.storage.local.remove(word);
        });
        delete_button.appendTo(right);
        card.on("mouseenter", function(){
            right.fadeIn(10);
        }).on("mouseleave", function(){
            right.fadeOut(50);
        });
        card.appendTo("#cardsDiv");
        
    });
}
chrome.storage.local.get(null, show_cards);


// Initialize theme
chrome.storage.sync.get("theme_mode", function(result) {
    const theme = result.theme_mode || "system";
    apply_theme(theme);
});

// Listen for storage changes to reload regexes automatically
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.theme_mode) {
        console.log('Theme mode updated in storage, reloading...');
        applyTheme(changes.theme_mode.newValue);
    }
});