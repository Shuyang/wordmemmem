import { process_history_item, default_regexes } from './core.js';


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


// Pure validation function - returns validation result without DOM manipulation
function validateRuleData(name, regex) {
    const trimmedName = name ? name.trim() : '';
    const trimmedRegex = regex ? regex.trim() : '';
    
    // Empty rules are valid (will be filtered out)
    if (!trimmedName && !trimmedRegex) {
        return { valid: true, error: '' };
    }
    
    if (!trimmedName) {
        return { valid: false, error: 'Name required' };
    }
    
    if (!trimmedRegex) {
        return { valid: false, error: 'Regex required' };
    }
    
    // Test regex validity
    try {
        new RegExp(trimmedRegex);
        return { valid: true, error: '' };
    } catch(e) {
        return { valid: false, error: 'Regex parsing error' };
    }
}

// Validate individual rule (UI version)
function validateRule(ruleRow) {
    const nameInput = ruleRow.find('.rule-name-input');
    const regexInput = ruleRow.find('.rule-regex-input');
    const status = ruleRow.find('.rule-status');
    
    const name = nameInput.val();
    const regex = regexInput.val();
    
    // Use the pure validation function
    const result = validateRuleData(name, regex);
    
    // Clear previous status
    status.text('').removeClass('valid error');
    
    if (result.valid && name.trim() && regex.trim()) {
        status.text('✓').addClass('valid');
    } else if (result.error) {
        status.text(result.error).addClass('error');
    }
    
    return result.valid;
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

// Event handlers
$("#add_rule").click(function() {
    const newRule = createRuleRow();
    $('#rules_list').append(newRule);
    newRule.find('.rule-name-input').focus();
    autoSaveRules(); // Silent operation
});

$("#save_json").click(function() {
    const status = $('#save_json_status');
    
    // Step 1: Parse JSON
    let rules;
    try {
        const jsonText = $('#regex_text').val().trim();
        if (!jsonText) {
            status.text('No JSON content to save');
            return;
        }
        
        status.text('Parsing JSON...');
        rules = JSON.parse(jsonText);
    } catch(e) {
        status.text('Invalid JSON syntax.');
        return;
    }
    
    // Step 2: Validate rules
    let validRules;
    try {
        status.text('Validating rules...');
        const validationErrors = [];
        validRules = [];
        
        rules.forEach(function(rule, index) {
            const validation = validateRuleData(rule.name, rule.regex);
            
            if (validation.valid) {
                if (rule.name?.trim() && rule.regex?.trim()) {
                    validRules.push(rule);
                }
            } else {
                const errorMsg = validation.error || 'Unknown validation error';
                validationErrors.push(`Rule ${index + 1}: ${errorMsg}`);
            }
        });
        
        if (validationErrors.length > 0) {
            status.text(`${validationErrors.length} error(s): ${validationErrors[0]}`);
            return;
        }
    } catch(e) {
        status.text('Error during validation');
        console.error('Validation error:', e);
        return;
    }
    
    // Step 3: Update UI
    try {
        status.text('Loading rules...');
        const rulesList = $('#rules_list');
        rulesList.empty();
        
        validRules.forEach(function(rule) {
            const ruleRow = createRuleRow(rule.name, rule.regex);
            rulesList.append(ruleRow);
        });
    } catch(e) {
        status.text('Error updating interface');
        console.error('UI update error:', e);
        return;
    }
    
    // Step 4: Auto-save
    try {
        autoSaveRules(status);
    } catch(e) {
        status.text('Rules loaded but save failed');
        console.error('Auto-save error:', e);
    }
});

// Add collapsible functionality to the JSON section
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
