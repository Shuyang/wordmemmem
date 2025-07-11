import { process_history_item, default_regexes, load_regexes, load_from_history, apply_theme } from './core.js';


// Auto-save functionality
function showStatusWithTimeout(element, message, timeout = 10000) {
    if (element) {
        element.text(message);
        setTimeout(() => {
            element.text('');
        }, timeout);
    }
}

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
        load_regexes();
    } catch(e) {
        if (statusElement) {
            statusElement.text('Save error!');
        }
    }
}


// Helper function to count capture groups in a regex
function countCaptureGroups(regexString) {
    let count = 0;
    let i = 0;
    
    while (i < regexString.length) {
        if (regexString[i] === '\\') {
            // Skip escaped character
            i += 2;
        } else if (regexString[i] === '(' && regexString[i + 1] !== '?') {
            // Found a capture group (not a non-capturing group (?:...))
            count++;
            i++;
        } else {
            i++;
        }
    }
    
    return count;
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
    } catch(e) {
        return { valid: false, error: 'Regex parsing error' };
    }
    
    // Check capture groups
    const captureGroupCount = countCaptureGroups(trimmedRegex);
    if (captureGroupCount === -1) {
        return { valid: false, error: 'Regex parsing error' };
    }
    
    if (captureGroupCount === 0) {
        return { valid: false, error: 'Must have exactly 1 capture group' };
    }
    
    if (captureGroupCount > 1) {
        return { valid: false, error: `Has ${captureGroupCount} capture groups, need exactly 1` };
    }
    
    return { valid: true, error: '' };
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
            <img src="icons/trash-alt.svg" class="icon" alt="Delete">
            <input type="text" class="rule-name-input" value="${name}" placeholder="Rule name">
            <input type="text" class="rule-regex-input" value="${regex}" placeholder="Regular expression">
            <span class="rule-status"></span>
        </div>
    `);
    
    // Add delete functionality with auto-save
    ruleRow.find('.icon').on('click', function() {
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

function loadRulesToUI(result) {
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

// Initialize
chrome.storage.sync.get("regexes", loadRulesToUI);

// Initialize new tab page preference
chrome.storage.sync.get("replace_new_tab", function(result) {
    if (result.replace_new_tab === undefined) {
        // Default to true if not set
        chrome.storage.sync.set({ replace_new_tab: true });
    }
    $('#replace_new_tab').prop('checked', result.replace_new_tab !== false);
});

// Initialize theme preference
chrome.storage.sync.get("theme_mode", function(result) {
    if (result.theme_mode === undefined) {
        // Default to system if not set
        chrome.storage.sync.set({ theme_mode: "system" });
        $('#theme_mode').val("system");
    } else {
        $('#theme_mode').val(result.theme_mode);
    }
    apply_theme(result.theme_mode || "system");
});

// Event handlers
$('#replace_new_tab').on('change', function() {
    const isChecked = $(this).prop('checked');
    chrome.storage.sync.set({ replace_new_tab: isChecked });
    console.log('New tab page preference changed to:', isChecked);
});

$('#theme_mode').on('change', function() {
    const theme = $(this).val();
    chrome.storage.sync.set({ theme_mode: theme });
    apply_theme(theme);
    console.log('Theme changed to:', theme);
});

$("#add_rule").on('click', function() {
    const newRule = createRuleRow();
    $('#rules_list').append(newRule);
    newRule.find('.rule-name-input').focus();
    autoSaveRules(); // Silent operation
});

$("#save_json").on('click', function() {
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

// Collapsible section functionality
$('#json_section_header').on('click', function() {
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

$("#remove_all").on('click', function() {
    const button = $(this);
    const status = $('#remove_all_status');
    
    button.prop('disabled', true);
    status.text('Clearing...');
    
    chrome.storage.local.clear(function() {
        button.prop('disabled', false);
        status.text('Cleared!');
    });
});

$("#load_history").on('click', function() {
    const button = $(this);
    const status = $('#load_history_status');
    
    button.prop('disabled', true);
    status.text('Loading...');

    const loaded_callback = function() {
        button.prop('disabled', false);
        status.text('Loaded!');
        console.log('Loaded!');
    };
    load_from_history(loaded_callback);
})

$("#reset_defaults").on('click', function() {
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

