function show_cards(result) {
    let word_record_array = Object.entries(result);
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
            <div class="left">
                <div class="word">
                    ${word_display}
                </div>
                <div>
                    ${time_ago} 
                </div>
            </div>
            <div class="right">
                <a href="${url}"><img src="icons/link.svg" class="icon"/></a>
            </div>
        </div>`);
        let right = card.find(".right").hide()
        let delete_button = $(`
            <img src="icons/trash-alt.svg" class="icon"/>
        `).click(function(){
            card.hide();
            chrome.storage.local.remove(word);
        });
        delete_button.appendTo(right);
        card.hover(
            function(){
                right.fadeIn(10);
            },
            function(){
                right.fadeOut(50);
            }
        );
        card.appendTo("#cardsDiv");
        
    });
}
chrome.storage.local.get(null, show_cards);

