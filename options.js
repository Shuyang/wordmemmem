import { process_history_item } from './core.js';

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
function autoSaveRules() {
    const status = $('#auto_save_status');
    status.text('Saving...');
    
    try {
        const rules = collectRulesFromForm();
        chrome.storage.sync.set({regexes: rules}, function() {
            status.text('Saved!');
            $('#regex_text').val(JSON.stringify(rules, null, 2));
            setTimeout(() => status.text(''), 2000);
        });
    } catch(e) {
        status.text('Save error!');
        setTimeout(() => status.text(''), 2000);
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
        autoSaveRules();
    });
    
    // Add validation and auto-save on input changes
    ruleRow.find('.rule-name-input, .rule-regex-input').on('input', function() {
        clearTimeout(window.autoSaveTimeout);
        validateRule(ruleRow);
        window.autoSaveTimeout = setTimeout(() => {
            if (validateRule(ruleRow)) {
                autoSaveRules();
            }
        }, 500);
    });
    
    // Validate on blur as well
    ruleRow.find('.rule-name-input, .rule-regex-input').on('blur', function() {
        validateRule(ruleRow);
    });
    
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
    autoSaveRules();
});

$("#save_json").click(function() {
    try {
        const jsonText = $('#regex_text').val().trim();
        if (!jsonText) return;
        
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
        
        // Auto-save after loading from JSON
        autoSaveRules();
    } catch(e) {
        alert('Invalid JSON format. Please check your syntax.');
    }
});

// Initialize
chrome.storage.sync.get("regexes", loadRules);
