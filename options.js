import { process_history_item } from './core.js';

$("#remove_all").click(function() {
    chrome.storage.local.clear();
});

$("#load_history").click(function() {
    let query = {
        text: "",
        startTime: 0,
        maxResults: 0  // load entire history
    };
    chrome.history.search(query, function(results) {
        results.forEach(process_history_item);
    });
})

let regex_table = $('#regex_table');
function update_regexes(result) { 
    regex_table.empty();
    regex_table.append("<tr><th>Name</th><th>Regular expression</th></tr>")
    result.regexes.forEach(function(element) {
        let name = element.name;
        let regex = element.regex;
        let regex_item = $(`
        <tr>
            <td>${name}</td>
            <td>${regex}</td>
        </tr>`);
        regex_table.append(regex_item);
    });
    $('#regex_text').text(JSON.stringify(result.regexes))
}
chrome.storage.sync.get("regexes", update_regexes);
$("#wrong_format").hide();


$('#save_regex').click(function(){
    $("#wrong_format").hide();
    let reg_text = $('#regex_text').val();
    try {
        let reg_object = JSON.parse(reg_text);
        chrome.storage.sync.set({regexes: reg_object});
        update_regexes({regexes: reg_object})
    } catch(e) {
        $("#wrong_format").show();
    }

})
