function show_cards(result) {
    let word_record_array = Object.entries(result);
    word_record_array.sort(function(a,b){
        return b[1].last_visit_time - a[1].last_visit_time ;
    })
    word_record_array.forEach(function(word_record) {
        let word = word_record[0];
        let time_ago = timeago.format(new Date(word_record[1].last_visit_time));
        let card = $(`
        <div class="card">
            <div class="word">
                ${word}
            </div>
            <div>
                ${time_ago}
            </div>
        </div>`);
        let delete_button = $(`
            <button class="delete-button">
                &#10006;
            </button>
        `).click(function(){
            card.hide();
            chrome.storage.local.remove(word);
        });
        delete_button.appendTo(card);
        card.appendTo("#cardsDiv");
        
    });
}
chrome.storage.local.get(null, show_cards);

