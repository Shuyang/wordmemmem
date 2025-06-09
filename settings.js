import { process_history_item, default_regexes } from './core.js';

$("#remove_all").click(function() {
    const button = $(this);
    const status = $('#remove_all_status');
    
    button.prop('disabled', true);
    status.text('Clearing...');
    
    chrome.storage.local.clear(function() {
        button.prop('disabled', false);
        status.text('Cleared!');
    });
});

$("#load_history").click(function() {
    const button = $(this);
    const status = $('#load_history_status');
    
    button.prop('disabled', true);
    status.text('Loading...');
    
    let query = {
        text: "",
        startTime: 0,
        maxResults: 0  // load entire history
    };
    chrome.history.search(query, function(results) {
        results.forEach(process_history_item);
        button.prop('disabled', false);
        status.text('Loaded!');
    });
})

// Auto-save functionality
function autoSaveRules(statusElement) {
    if (statusElement) {
        statusElement.text('Saving...');
    }
    
    try {
        const rules = collectRulesFromForm();
        chrome.storage.sync.set({regexes: rules}, function() {
            $('#regex_text').val(JSON.stringify(rules, null, 2));
            if (statusElement) {
                statusElement.text('Saved!');
            }
        });
    } catch(e) {
        if (statusElement) {
            statusElement.text('Save error!');
        }
    }
}

// Validate individual rule
function validateRule(ruleRow) {
    const nameInput = ruleRow.find('.rule-name-input');
    const regexInput = ruleRow.find('.rule-regex-input');
    const status = ruleRow.find('.rule-status');
    
    const name = nameInput.val().trim();
    const regex = regexInput.val().trim();
    
    // Clear previous status
    status.text('').removeClass('valid error');
    
    if (!name && !regex) {
        return true; // Empty rules are valid (will be filtered out)
    }
    
    if (!name) {
        status.text('Name required').addClass('error');
        return false;
    }
    
    if (!regex) {
        status.text('Regex required').addClass('error');
        return false;
    }
    
    // Test regex validity
    try {
        new RegExp(regex);
        status.text('✓').addClass('valid');
        return true;
    } catch(e) {
        status.text('Regex parsing error').addClass('error');
        return false;
    }
}

// Rule management functions
function createRuleRow(name = '', regex = '') {
    const ruleRow = $(`
        <div class="rule-row">
            <img src="icons/trash-alt.svg" class="delete-rule-icon" alt="Delete">
            <input type="text" class="rule-name-input" value="${name}" placeholder="Rule name">
            <input type="text" class="rule-regex-input" value="${regex}" placeholder="Regular expression">
            <span class="rule-status"></span>
        </div>
    `);
    
    // Add delete functionality with auto-save
    ruleRow.find('.delete-rule-icon').click(function() {
        ruleRow.remove();
        autoSaveRules(); // Silent operation
    });
    
    // Add validation and auto-save on input changes
    ruleRow.find('.rule-name-input, .rule-regex-input').on('input', function() {
        clearTimeout(window.autoSaveTimeout);
        if (validateRule(ruleRow)) {
            autoSaveRules(); // Silent operation
        }
    });
    
    // Validate on blur as well
    ruleRow.find('.rule-name-input, .rule-regex-input').on('blur', function() {
        validateRule(ruleRow);
    });
    
    validateRule(ruleRow);
    return ruleRow;
}

function loadRules(result) {
    const rulesList = $('#rules_list');
    rulesList.empty();
    
    if (result && result.regexes) {
        result.regexes.forEach(function(rule) {
            const ruleRow = createRuleRow(rule.name, rule.regex);
            rulesList.append(ruleRow);
        });
        $('#regex_text').val(JSON.stringify(result.regexes, null, 2));
    }
    $('#regex_text').on('input', function(){
        $('#save_json_status').text('')
    })
}

function collectRulesFromForm() {
    const rules = [];
    let hasErrors = false;
    
    $('#rules_list .rule-row').each(function() {
        const ruleRow = $(this);
        const name = ruleRow.find('.rule-name-input').val().trim();
        const regex = ruleRow.find('.rule-regex-input').val().trim();
        
        if (name && regex) {
            // Validate before adding
            if (validateRule(ruleRow)) {
                rules.push({ name: name, regex: regex });
            } else {
                hasErrors = true;
            }
        }
    });
    
    if (hasErrors) {
        throw new Error('Validation errors found');
    }
    
    return rules;
}

// Event handlers
$("#add_rule").click(function() {
    const newRule = createRuleRow();
    $('#rules_list').append(newRule);
    newRule.find('.rule-name-input').focus();
    autoSaveRules(); // Silent operation
});

$("#save_json").click(function() {
    const status = $('#save_json_status');
    
    try {
        const jsonText = $('#regex_text').val().trim();
        if (!jsonText) return;
        
        status.text('Parsing JSON...');
        const rules = JSON.parse(jsonText);
        
        // Clear existing rules and load from JSON
        const rulesList = $('#rules_list');
        rulesList.empty();
        
        rules.forEach(function(rule) {
            if (rule.name && rule.regex) {
                const ruleRow = createRuleRow(rule.name, rule.regex);
                rulesList.append(ruleRow);
            }
        });
        
        // Auto-save after loading from JSON with status feedback
        autoSaveRules(status);
    } catch(e) {
        status.text('Invalid JSON format. Check your syntax.');
    }
});

// Collapsible section functionality
$('#json_section_header').click(function() {
    const content = $('#json_section_content');
    const chevron = $('#json_section_chevron');
    
    if (content.is(':visible')) {
        // Collapse
        content.slideUp(200);
        chevron.removeClass('expanded');
    } else {
        // Expand
        content.slideDown(200);
        chevron.addClass('expanded');
    }
});


$("#reset_defaults").click(function() {
    const status = $('#reset_defaults_status');
    
    status.text('Resetting...');
    
    // Clear existing rules and load defaults
    const rulesList = $('#rules_list');
    rulesList.empty();
    
    default_regexes.forEach(function(rule) {
        const ruleRow = createRuleRow(rule.name, rule.regex);
        rulesList.append(ruleRow);
    });
    
    // Auto-save after loading defaults with status feedback
    autoSaveRules(status);
});

// Initialize
chrome.storage.sync.get("regexes", loadRules);
