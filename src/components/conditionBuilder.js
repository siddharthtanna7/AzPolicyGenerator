/**
 * Add a new condition row to the UI
 * @param {Object} conditionData - Optional initial condition data
 * @param {HTMLElement} container - Container to add condition to (defaults to main condition builder)
 * @param {number} nestingLevel - Current nesting level (for indentation)
 * @returns {HTMLElement} - The created condition row element
 */
function addCondition(conditionData = {}, container = null, nestingLevel = 0) {
    const conditionBuilder = container || document.getElementById('condition-builder');
    if (!conditionBuilder) return null;
    
    // Create condition row
    const conditionRow = document.createElement('div');
    conditionRow.className = 'condition-row';
    
    // Add indentation based on nesting level
    if (nestingLevel > 0) {
        conditionRow.style.marginLeft = `${nestingLevel * 20}px`;
        conditionRow.style.borderLeft = '2px solid #0078d4';
        conditionRow.style.paddingLeft = '10px';
    }
    
    // Check if this is a group condition
    const isGroup = conditionData.isGroup || false;
    
    if (isGroup) {
        // Create a group condition
        createGroupCondition(conditionRow, conditionData, nestingLevel);
    } else {
        // Create a regular condition
        createRegularCondition(conditionRow, conditionData);
    }
    
    // Create actions container (for add/remove/group buttons)
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'condition-actions';
    
    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-condition';
    removeBtn.addEventListener('click', () => {
        conditionBuilder.removeChild(conditionRow);
    });
    actionsContainer.appendChild(removeBtn);
    
    // Allow unlimited nesting for maximum flexibility
    const addGroupBtn = document.createElement('button');
    addGroupBtn.textContent = 'Add Group';
    addGroupBtn.className = 'add-group';
    addGroupBtn.addEventListener('click', () => {
        // Insert a new group after this row
        const groupData = {
            isGroup: true,
            operator: 'allOf',
            conditions: []
        };
        const newRow = addCondition(groupData, conditionBuilder, nestingLevel);
        if (newRow && conditionRow.nextSibling) {
            conditionBuilder.insertBefore(newRow, conditionRow.nextSibling);
        } else if (newRow) {
            conditionBuilder.appendChild(newRow);
        }
    });
    actionsContainer.appendChild(addGroupBtn);
    
    conditionRow.appendChild(actionsContainer);
    
    // Add to container
    if (container) {
        // If we're adding to a nested container
        container.appendChild(conditionRow);
    } else {
        // If we're adding to the main builder
        conditionBuilder.appendChild(conditionRow);
    }
    
    return conditionRow;
}

/**
 * Create a regular (field-based) condition
 * @param {HTMLElement} conditionRow - Row element to add condition to
 * @param {Object} conditionData - Condition data
 */
function createRegularCondition(conditionRow, conditionData) {
    // Create resource type dropdown
    const resourceTypeSelect = document.createElement('select');
    resourceTypeSelect.className = 'condition-resource-type';
    resourceTypeSelect.innerHTML = '<option value="">Select resource type</option>';
    
    // Create field dropdown (will be populated based on resource type)
    const fieldSelect = document.createElement('select');
    fieldSelect.className = 'condition-field';
    fieldSelect.innerHTML = '<option value="">Select field</option>';
    
    // Create operator dropdown
    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'condition-operator';
    
    // Create value select/input (will be determined by field)
    const valueContainer = document.createElement('div');
    valueContainer.className = 'value-container';
    
    // Create a text input as default
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'condition-value';
    valueInput.placeholder = 'Value';
    valueInput.value = conditionData.value || '';
    
    // Add the input to the container
    valueContainer.appendChild(valueInput);
    
    // Add everything to condition row
    conditionRow.appendChild(resourceTypeSelect);
    conditionRow.appendChild(fieldSelect);
    conditionRow.appendChild(operatorSelect);
    conditionRow.appendChild(valueContainer);
    
    // Set data attribute to identify this as a regular condition
    conditionRow.dataset.conditionType = 'regular';
    
    // Load resource types and initialize dropdowns
    loadResourceTypes(resourceTypeSelect, fieldSelect, valueContainer, conditionData);
    loadOperators(operatorSelect, conditionData.operator || 'equals');
}

/**
 * Create a group condition (allOf/anyOf)
 * @param {HTMLElement} conditionRow - Row element to add group to
 * @param {Object} groupData - Group condition data
 * @param {number} nestingLevel - Current nesting level
 */
function createGroupCondition(conditionRow, groupData, nestingLevel) {
    console.log('Creating group condition with nesting level:', nestingLevel);
    console.log('Group data:', groupData);
    
    // Set class and type
    conditionRow.classList.add('condition-group');
    conditionRow.dataset.conditionType = 'group';
    
    // Create heading for the group
    const groupHeading = document.createElement('div');
    groupHeading.className = 'group-heading';
    
    const headingText = document.createElement('strong');
    headingText.textContent = 'Condition Group';
    groupHeading.appendChild(headingText);
    
    // Create operator selector as segmented control
    const operatorContainer = document.createElement('div');
    operatorContainer.className = 'group-operator-container';
    
    const operatorLabel = document.createElement('div');
    operatorLabel.className = 'group-operator-label';
    operatorLabel.textContent = 'Match Rule:';
    operatorContainer.appendChild(operatorLabel);
    
    // Create toggle container
    const operatorToggle = document.createElement('div');
    operatorToggle.className = 'group-operator-toggle';
    
    // Add AND option
    const allOfOption = document.createElement('div');
    allOfOption.className = 'operator-option';
    allOfOption.textContent = 'ALL (AND)';
    allOfOption.setAttribute('data-value', 'allOf');
    if (groupData.operator !== 'anyOf') {
        allOfOption.classList.add('selected');
    }
    operatorToggle.appendChild(allOfOption);
    
    // Add OR option
    const anyOfOption = document.createElement('div');
    anyOfOption.className = 'operator-option';
    anyOfOption.textContent = 'ANY (OR)';
    anyOfOption.setAttribute('data-value', 'anyOf');
    if (groupData.operator === 'anyOf') {
        anyOfOption.classList.add('selected');
    }
    operatorToggle.appendChild(anyOfOption);
    
    // Add slider for toggle effect
    const slider = document.createElement('div');
    slider.className = 'slider';
    operatorToggle.appendChild(slider);
    
    // Hidden select for form submission
    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'group-operator';
    operatorSelect.style.display = 'none';
    
    const selectAllOfOption = document.createElement('option');
    selectAllOfOption.value = 'allOf';
    selectAllOfOption.textContent = 'All of (AND)';
    
    const selectAnyOfOption = document.createElement('option');
    selectAnyOfOption.value = 'anyOf';
    selectAnyOfOption.textContent = 'Any of (OR)';
    
    operatorSelect.appendChild(selectAllOfOption);
    operatorSelect.appendChild(selectAnyOfOption);
    
    if (groupData.operator === 'anyOf') {
        selectAnyOfOption.selected = true;
    }
    
    operatorContainer.appendChild(operatorToggle);
    operatorContainer.appendChild(operatorSelect);
    
    // Add click handlers for toggle options
    allOfOption.addEventListener('click', () => {
        allOfOption.classList.add('selected');
        anyOfOption.classList.remove('selected');
        operatorSelect.value = 'allOf';
    });
    
    anyOfOption.addEventListener('click', () => {
        anyOfOption.classList.add('selected');
        allOfOption.classList.remove('selected');
        operatorSelect.value = 'anyOf';
    });
    
    // Content container
    const groupContent = document.createElement('div');
    groupContent.className = 'group-content';
    
    // Create container for nested conditions
    const nestedContainer = document.createElement('div');
    nestedContainer.className = 'nested-conditions';
    groupContent.appendChild(nestedContainer);
    
    // Add "Add Condition" button for this group
    const addButton = document.createElement('button');
    addButton.className = 'add-nested-condition button-with-icon';
    addButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Condition to Group</span>
    `;
    addButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        console.log('Adding nested condition to group with level:', nestingLevel + 1);
        
        // Create a regular condition with default parameters
        const conditionData = {
            field: '',
            operator: 'equals',
            value: ''
        };
        
        // Add the condition to the nested container
        const newCondition = addCondition(conditionData, nestedContainer, nestingLevel + 1);
        console.log('New condition created:', newCondition);
        
        // Make sure it's added to the container
        if (newCondition && !nestedContainer.contains(newCondition)) {
            console.log('Appending condition to nested container');
            nestedContainer.appendChild(newCondition);
        }
        
        // Verify condition was added
        console.log('Nested container now has', nestedContainer.children.length, 'children');
        
        // Remove empty state if present
        const emptyState = groupContent.querySelector('.nested-conditions-empty');
        if (emptyState) {
            console.log('Removing empty state');
            emptyState.remove();
        }
    });
    
    // Create a button container with multiple actions
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'group-buttons';
    
    // Add condition button
    buttonContainer.appendChild(addButton);
    
    // Add nested group button for complex nested conditions
    const addNestedGroupButton = document.createElement('button');
    addNestedGroupButton.className = 'add-nested-group button-with-icon';
    addNestedGroupButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
        <span>Add Nested Group</span>
    `;
    addNestedGroupButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Adding nested group inside existing group');
        
        // Get the current group's operator
        let parentOperator;
        try {
            parentOperator = operatorSelect.value || 'allOf';
        } catch (error) {
            console.warn('Could not determine parent operator, defaulting to allOf');
            parentOperator = 'allOf';
        }
        
        // Create a new nested group with the opposite logic for flexibility
        const nestedGroupData = {
            isGroup: true,
            operator: parentOperator === 'allOf' ? 'anyOf' : 'allOf',
            conditions: []
        };
        
        console.log('Creating nested group with data:', nestedGroupData);
        
        // Create and add the nested group
        const nestedGroup = addCondition(nestedGroupData, nestedContainer, nestingLevel + 1);
        console.log('Nested group created:', nestedGroup);
        
        // Ensure it's added to the container
        if (nestedGroup && !nestedContainer.contains(nestedGroup)) {
            console.log('Appending nested group to container');
            nestedContainer.appendChild(nestedGroup);
        }
        
        // Remove empty state if present
        const emptyState = groupContent.querySelector('.nested-conditions-empty');
        if (emptyState) {
            console.log('Removing empty state');
            emptyState.remove();
        }
    });
    buttonContainer.appendChild(addNestedGroupButton);
    
    // Add duplicate button for copying group structure
    const duplicateButton = document.createElement('button');
    duplicateButton.className = 'duplicate-group button-with-icon';
    duplicateButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>Duplicate</span>
    `;
    duplicateButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Duplicating group condition');
        
        try {
            // Extract current group's data structure
            const groupStructure = extractConditionData(conditionRow);
            console.log('Group structure extracted:', groupStructure);
            
            // Find the parent container
            const parentContainer = conditionRow.parentElement;
            if (!parentContainer) {
                console.error('Could not find parent container for duplication');
                return;
            }
            
            // Make a deep copy of the group data to avoid reference issues
            const groupData = JSON.parse(JSON.stringify(groupStructure));
            
            // Create a duplicate group right after this one
            console.log('Creating duplicate with data:', groupData);
            const duplicateGroup = addCondition(groupData, null, nestingLevel);
            
            console.log('Duplicate created:', duplicateGroup);
            const nextSibling = conditionRow.nextSibling;
            
            if (nextSibling) {
                console.log('Inserting before sibling');
                parentContainer.insertBefore(duplicateGroup, nextSibling);
            } else {
                console.log('Appending to parent');
                parentContainer.appendChild(duplicateGroup);
            }
        } catch (error) {
            console.error('Error in duplicate button handler:', error);
        }
    });
    buttonContainer.appendChild(duplicateButton);
    
    groupContent.appendChild(buttonContainer);
    
    // Create elements in the correct order
    conditionRow.appendChild(groupHeading);
    conditionRow.appendChild(operatorContainer);
    
    // First, create empty state if needed before appending content
    if (!groupData.conditions || !Array.isArray(groupData.conditions) || groupData.conditions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'nested-conditions-empty';
        emptyState.textContent = 'No conditions added yet. Add a condition to define this group.';
        nestedContainer.appendChild(emptyState);
    }
    
    // Append content (with or without empty state)
    conditionRow.appendChild(groupContent);
    
    // Add existing nested conditions if provided (after the container is in the DOM)
    if (groupData.conditions && Array.isArray(groupData.conditions) && groupData.conditions.length > 0) {
        groupData.conditions.forEach(condition => {
            const nestedCondition = addCondition(condition, nestedContainer, nestingLevel + 1);
            if (nestedCondition && !nestedContainer.contains(nestedCondition)) {
                nestedContainer.appendChild(nestedCondition);
            }
        });
    }
}

/**
 * Load resource types from JSON data
 * @param {HTMLElement} resourceTypeSelect - Resource type select element
 * @param {HTMLElement} fieldSelect - Field select element
 * @param {HTMLElement} valueContainer - Value container element
 * @param {Object} conditionData - Optional initial condition data
 */
function loadResourceTypes(resourceTypeSelect, fieldSelect, valueContainer, conditionData = {}) {
    fetch('../data/resourceTypes.json')
        .then(response => response.json())
        .then(data => {
            // Add global properties option
            const globalOption = document.createElement('option');
            globalOption.value = 'global';
            globalOption.textContent = 'Global Properties';
            resourceTypeSelect.appendChild(globalOption);
            
            // Add resource type options
            data.resourceTypes.forEach(resourceType => {
                const option = document.createElement('option');
                option.value = resourceType.name;
                option.textContent = resourceType.description;
                resourceTypeSelect.appendChild(option);
            });
            
            // Set up change event to populate field select
            resourceTypeSelect.addEventListener('change', () => {
                populateFieldSelect(resourceTypeSelect.value, fieldSelect, data);
                // Clear value container when resource type changes
                clearValueContainer(valueContainer);
            });
            
            // Set up field select change event
            fieldSelect.addEventListener('change', () => {
                updateValueInput(fieldSelect.value, valueContainer, data);
            });
            
            // Set initial values if provided
            if (conditionData.field) {
                // Try to determine resource type from field
                const field = conditionData.field;
                let resourceType = '';
                
                // Check if it's a global property
                const isGlobal = data.globalProperties.some(prop => prop.field === field);
                
                if (isGlobal) {
                    resourceType = 'global';
                } else {
                    // Find matching resource type
                    for (const rt of data.resourceTypes) {
                        const matchingProp = rt.properties.find(prop => prop.field === field);
                        if (matchingProp) {
                            resourceType = rt.name;
                            break;
                        }
                    }
                }
                
                // Set resource type if found
                if (resourceType) {
                    resourceTypeSelect.value = resourceType;
                    populateFieldSelect(resourceType, fieldSelect, data);
                    fieldSelect.value = field;
                    
                    // Set the value input
                    updateValueInput(field, valueContainer, data, conditionData.value);
                }
            }
        })
        .catch(error => {
            console.error('Error loading resource types:', error);
            // Fallback to basic fields
            const basicFields = [
                { value: 'type', label: 'Resource Type' },
                { value: 'location', label: 'Location' },
                { value: 'tags', label: 'Tags' }
            ];
            
            basicFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field.value;
                option.textContent = field.label;
                fieldSelect.appendChild(option);
            });
        });
}

/**
 * Populate field select based on resource type
 * @param {string} resourceType - Selected resource type
 * @param {HTMLElement} fieldSelect - Field select element
 * @param {Object} data - Resource type data
 */
function populateFieldSelect(resourceType, fieldSelect, data) {
    // Clear existing options
    fieldSelect.innerHTML = '<option value="">Select field</option>';
    
    // If no resource type selected, return
    if (!resourceType) return;
    
    let properties = [];
    
    // Get properties based on resource type
    if (resourceType === 'global') {
        properties = data.globalProperties;
    } else {
        const resourceTypeData = data.resourceTypes.find(rt => rt.name === resourceType);
        if (resourceTypeData) {
            properties = resourceTypeData.properties;
        }
    }
    
    // Add property options
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.field;
        option.textContent = property.displayName;
        fieldSelect.appendChild(option);
    });
}

/**
 * Load operators from JSON data
 * @param {HTMLElement} operatorSelect - Operator select element
 * @param {string} selectedOperator - Selected operator
 */
function loadOperators(operatorSelect, selectedOperator) {
    fetch('../data/resourceTypes.json')
        .then(response => response.json())
        .then(data => {
            // Add operator options
            data.operators.forEach(op => {
                const option = document.createElement('option');
                option.value = op.value;
                option.textContent = op.label;
                if (op.value === selectedOperator) {
                    option.selected = true;
                }
                operatorSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading operators:', error);
            // Fallback to basic operators
            const basicOperators = [
                { value: 'equals', label: 'equals' },
                { value: 'notEquals', label: 'not equals' },
                { value: 'contains', label: 'contains' }
            ];
            
            basicOperators.forEach(op => {
                const option = document.createElement('option');
                option.value = op.value;
                option.textContent = op.label;
                if (op.value === selectedOperator) {
                    option.selected = true;
                }
                operatorSelect.appendChild(option);
            });
        });
}

/**
 * Clear the value container and create a new text input
 * @param {HTMLElement} valueContainer - Value container element
 */
function clearValueContainer(valueContainer) {
    valueContainer.innerHTML = '';
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'condition-value';
    valueInput.placeholder = 'Value';
    valueContainer.appendChild(valueInput);
}

/**
 * Update value input based on selected field
 * @param {string} fieldValue - Selected field value
 * @param {HTMLElement} valueContainer - Value container element
 * @param {Object} data - Resource type data
 * @param {string} initialValue - Initial value
 */
function updateValueInput(fieldValue, valueContainer, data, initialValue = '') {
    // Clear existing content
    valueContainer.innerHTML = '';
    
    // If no field selected, create a basic text input
    if (!fieldValue) {
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'condition-value';
        valueInput.placeholder = 'Value';
        valueInput.value = initialValue;
        valueContainer.appendChild(valueInput);
        return;
    }
    
    // Find the property in data
    let property = null;
    
    // Check in global properties
    const globalProperty = data.globalProperties.find(prop => prop.field === fieldValue);
    if (globalProperty) {
        property = globalProperty;
    } else {
        // Check in resource type properties
        for (const resourceType of data.resourceTypes) {
            const prop = resourceType.properties.find(p => p.field === fieldValue);
            if (prop) {
                property = prop;
                break;
            }
        }
    }
    
    // If property has predefined values, create a select
    if (property && property.values && property.values.length > 0) {
        const valueSelect = document.createElement('select');
        valueSelect.className = 'condition-value';
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Select a value';
        valueSelect.appendChild(emptyOption);
        
        // Add value options
        property.values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            if (value === initialValue) {
                option.selected = true;
            }
            valueSelect.appendChild(option);
        });
        
        valueContainer.appendChild(valueSelect);
    } 
    // For location field, load regions from regions.json
    else if (fieldValue === 'location') {
        loadRegions(valueContainer, initialValue);
    } 
    // For other fields, create a text input with appropriate placeholder
    else {
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'condition-value';
        valueInput.value = initialValue;
        
        // Set placeholder based on field
        switch (fieldValue) {
            case 'type':
                valueInput.placeholder = 'e.g. Microsoft.Compute/virtualMachines';
                break;
            case 'tags':
            case 'tags.environment':
            case 'tags.costCenter':
                valueInput.placeholder = 'e.g. Production, Development';
                break;
            default:
                valueInput.placeholder = 'Value';
        }
        
        valueContainer.appendChild(valueInput);
    }
}

/**
 * Load regions from JSON data
 * @param {HTMLElement} valueContainer - Value container element
 * @param {string} initialValue - Initial selected value
 */
function loadRegions(valueContainer, initialValue = '') {
    fetch('../data/regions.json')
        .then(response => response.json())
        .then(data => {
            const valueSelect = document.createElement('select');
            valueSelect.className = 'condition-value';
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select a region';
            valueSelect.appendChild(emptyOption);
            
            // Add region options
            data.regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.name;
                option.textContent = region.displayName;
                if (region.name === initialValue) {
                    option.selected = true;
                }
                valueSelect.appendChild(option);
            });
            
            valueContainer.appendChild(valueSelect);
        })
        .catch(error => {
            console.error('Error loading regions:', error);
            // Fallback to text input
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.className = 'condition-value';
            valueInput.placeholder = 'e.g. eastus, westus';
            valueInput.value = initialValue;
            valueContainer.appendChild(valueInput);
        });
}

/**
 * Initialize the Condition Builder component
 */
function initConditionBuilder() {
    const addConditionBtn = document.getElementById('add-condition');
    const addGroupBtn = document.getElementById('add-condition-group');
    const conditionBuilder = document.getElementById('condition-builder');
    
    // Clear existing conditions
    if (conditionBuilder) {
        conditionBuilder.innerHTML = '';
    }
    
    // Set up event listener for adding regular conditions
    if (addConditionBtn) {
        addConditionBtn.addEventListener('click', () => {
            addCondition();
        });
    }
    
    // Set up event listener for adding condition groups
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
            addCondition({
                isGroup: true,
                operator: 'allOf',
                conditions: []
            });
        });
    }
    
    // Add an initial condition
    addCondition();
}

/**
 * Get all conditions from the UI (including nested groups)
 * @returns {Object} - Structured condition object with logical operators
 */
function getConditions() {
    const mainLogicOperator = document.querySelector('input[name="logic-operator"]:checked').value;
    const topLevelConditions = Array.from(document.getElementById('condition-builder').children);
    
    // Process top-level conditions
    const conditions = topLevelConditions.map(row => extractConditionData(row)).filter(Boolean);
    
    // If we have only one condition without nesting, return it directly
    if (conditions.length === 1 && !conditions[0].isGroup) {
        return conditions[0];
    }
    
    // Otherwise, return with the appropriate logical operator
    return {
        [mainLogicOperator]: conditions
    };
}

/**
 * Extract condition data from a condition row element
 * @param {HTMLElement} conditionRow - The condition row element
 * @returns {Object|null} - Extracted condition data or null if invalid
 */
function extractConditionData(conditionRow) {
    // Skip non-condition elements
    if (!conditionRow || !conditionRow.classList || !conditionRow.classList.contains('condition-row')) {
        console.warn('Invalid condition row element:', conditionRow);
        return null;
    }
    
    // Check if this is a group or regular condition
    const conditionType = conditionRow.dataset.conditionType;
    
    if (conditionType === 'group') {
        try {
            // Extract group data
            const operator = conditionRow.querySelector('.group-operator')?.value || 'allOf';
            const nestedContainer = conditionRow.querySelector('.nested-conditions');
            
            if (!nestedContainer) {
                console.warn('Nested container not found in group condition');
                return {
                    isGroup: true,
                    operator,
                    [operator]: []
                };
            }
            
            // Get all nested conditions
            const nestedRows = Array.from(nestedContainer.children)
                .filter(child => child.classList && child.classList.contains('condition-row'));
                
            const nestedConditions = nestedRows
                .map(row => extractConditionData(row))
                .filter(Boolean);
            
            // Always return a valid group, even if empty
            return {
                isGroup: true,
                operator,
                [operator]: nestedConditions
            };
        } catch (error) {
            console.error('Error extracting condition group data:', error);
            // Return a valid empty group in case of error
            return {
                isGroup: true,
                operator: 'allOf',
                allOf: []
            };
        }
    } else {
        try {
            // Extract regular condition data
            const field = conditionRow.querySelector('.condition-field')?.value;
            const operator = conditionRow.querySelector('.condition-operator')?.value;
            
            // Get value from either select or input
            const valueElement = conditionRow.querySelector('.condition-value');
            let value = '';
            
            if (valueElement) {
                if (valueElement.tagName === 'SELECT') {
                    value = valueElement.value;
                } else {
                    value = valueElement.value;
                }
            }
            
            // Always return a condition object, even if incomplete
            return {
                field: field || '',
                operator: operator || 'equals',
                value: value || ''
            };
        } catch (error) {
            console.error('Error extracting regular condition data:', error);
            // Return a minimal valid condition in case of error
            return {
                field: 'type',
                operator: 'equals',
                value: ''
            };
        }
    }
}

/**
 * Flatten nested condition structure for policy generation
 * @param {Object} conditionStructure - Nested condition structure from getConditions()
 * @returns {Array} - Flattened array of conditions for policy generator
 */
/**
 * Recursive function to convert condition data to Azure Policy format
 * Supports unlimited nesting of allOf/anyOf conditions
 */
function convertConditionToAzureFormat(condition) {
    if (!condition) return null;
    
    // Simple condition
    if (condition.field) {
        return {
            field: condition.field,
            [condition.operator || 'equals']: condition.value || ''
        };
    }
    
    // Group condition
    if (condition.allOf || condition.anyOf) {
        const operator = condition.allOf ? 'allOf' : 'anyOf';
        const conditions = condition[operator] || [];
        
        if (!Array.isArray(conditions)) {
            return { [operator]: [] };
        }
        
        return {
            [operator]: conditions
                .map(c => convertConditionToAzureFormat(c))
                .filter(Boolean)
        };
    }
    
    return null;
}

function flattenConditions(conditionStructure) {
    if (!conditionStructure) {
        console.warn('Invalid condition structure provided to flattenConditions');
        return [];
    }
    
    try {
        // Simple condition
        if (conditionStructure.field) {
            return [{
                field: conditionStructure.field,
                operator: conditionStructure.operator || 'equals',
                value: conditionStructure.value || ''
            }];
        }
        
        // Root-level group
        if (conditionStructure.allOf || conditionStructure.anyOf) {
            const operator = conditionStructure.allOf ? 'allOf' : 'anyOf';
            const conditions = conditionStructure[operator] || [];
            
            if (!Array.isArray(conditions)) {
                console.warn('Invalid conditions array in flattenConditions:', conditions);
                return { [operator]: [] };
            }
            
            // Use recursive conversion for unlimited nesting levels
            return {
                [operator]: conditions
                    .map(condition => convertConditionToAzureFormat(condition))
                    .filter(Boolean)
            };
        }
        
        // Fallback for unexpected structure
        console.warn('Unrecognized condition structure:', conditionStructure);
        return [];
    } catch (error) {
        console.error('Error in flattenConditions:', error);
        return [];
    }
}

/**
 * Load condition structure into the UI
 * @param {Object} conditionStructure - Policy rule condition structure
 */
function loadConditionStructure(conditionStructure) {
    const conditionBuilder = document.getElementById('condition-builder');
    if (!conditionBuilder) return;
    
    // Clear existing conditions
    conditionBuilder.innerHTML = '';
    
    // Set the main logic operator
    if (conditionStructure.allOf) {
        document.querySelector('input[name="logic-operator"][value="allOf"]').checked = true;
        loadConditionGroup(conditionStructure.allOf, conditionBuilder, 'allOf', 0);
    } else if (conditionStructure.anyOf) {
        document.querySelector('input[name="logic-operator"][value="anyOf"]').checked = true;
        loadConditionGroup(conditionStructure.anyOf, conditionBuilder, 'anyOf', 0);
    } else if (conditionStructure.field) {
        // It's a single condition
        addCondition({
            field: conditionStructure.field,
            operator: Object.keys(conditionStructure).find(key => key !== 'field'),
            value: conditionStructure[Object.keys(conditionStructure).find(key => key !== 'field')]
        });
    } else {
        // Add a default empty condition
        addCondition();
    }
}

/**
 * Load a group of conditions into the UI
 * @param {Array} conditions - Array of condition objects
 * @param {HTMLElement} container - Container to add conditions to
 * @param {string} operator - Logical operator (allOf/anyOf)
 * @param {number} nestingLevel - Current nesting level
 */
function loadConditionGroup(conditions, container, operator, nestingLevel) {
    conditions.forEach(condition => {
        if (condition.allOf || condition.anyOf) {
            // It's a nested group
            const groupOperator = condition.allOf ? 'allOf' : 'anyOf';
            
            // Create group condition
            const groupData = {
                isGroup: true,
                operator: groupOperator,
                conditions: []
            };
            
            const groupRow = addCondition(groupData, container, nestingLevel);
            const nestedContainer = groupRow.querySelector('.nested-conditions');
            
            // Load nested conditions
            loadConditionGroup(condition[groupOperator], nestedContainer, groupOperator, nestingLevel + 1);
        } else {
            // It's a regular condition
            const field = condition.field;
            const operator = Object.keys(condition).find(key => key !== 'field');
            const value = condition[operator];
            
            addCondition({
                field,
                operator,
                value
            }, container, nestingLevel);
        }
    });
}

/**
 * Initialize condition visualizer component
 * Renders a visual representation of the condition structure
 */
function initConditionVisualizer() {
    const visualizerContainer = document.getElementById('condition-visualizer');
    if (!visualizerContainer) return;
    
    const visualizeBtn = document.getElementById('visualize-conditions');
    if (!visualizeBtn) return;
    
    visualizeBtn.addEventListener('click', () => {
        const conditions = getConditions();
        renderConditionVisualizer(conditions, visualizerContainer);
    });
}

/**
 * Render a visual representation of the condition structure
 * @param {Object} conditionStructure - Condition structure to visualize
 * @param {HTMLElement} container - Container to render visualization in
 */
function renderConditionVisualizer(conditionStructure, container) {
    // Clear container
    container.innerHTML = '';
    
    // Create visualization nodes
    const rootNode = document.createElement('div');
    rootNode.className = 'visualizer-root';
    
    if (conditionStructure.field) {
        // It's a single condition
        createLeafNode(conditionStructure, rootNode);
    } else if (conditionStructure.allOf || conditionStructure.anyOf) {
        // It's a condition group
        const operator = conditionStructure.allOf ? 'allOf' : 'anyOf';
        createGroupNode(conditionStructure[operator], operator, rootNode);
    } else {
        container.innerHTML = '<div class="empty-state">No conditions defined</div>';
        return;
    }
    
    container.appendChild(rootNode);
    
    // Add export options
    const exportOptions = document.createElement('div');
    exportOptions.className = 'export-visualization';
    
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Visualization';
    exportButton.className = 'secondary-button';
    exportButton.addEventListener('click', () => {
        exportConditionVisualization(container);
    });
    
    exportOptions.appendChild(exportButton);
    container.appendChild(exportOptions);
}

/**
 * Create a leaf node (single condition) in the visualizer
 * @param {Object} condition - Condition object
 * @param {HTMLElement} parent - Parent element to append to
 */
function createLeafNode(condition, parent) {
    const node = document.createElement('div');
    node.className = 'visualizer-node condition-leaf';
    
    const fieldName = document.createElement('span');
    fieldName.className = 'condition-field-name';
    fieldName.textContent = condition.field;
    
    const operator = document.createElement('span');
    operator.className = 'condition-operator-name';
    operator.textContent = condition.operator;
    
    const value = document.createElement('span');
    value.className = 'condition-value-name';
    value.textContent = condition.value || '(empty)';
    
    node.appendChild(fieldName);
    node.appendChild(operator);
    node.appendChild(value);
    
    parent.appendChild(node);
}

/**
 * Create a group node in the visualizer
 * @param {Array} conditions - Array of condition objects
 * @param {string} operator - Logical operator (allOf/anyOf)
 * @param {HTMLElement} parent - Parent element to append to
 * @param {number} depth - Current nesting depth for styling
 */
function createGroupNode(conditions, operator, parent, depth = 0) {
    const node = document.createElement('div');
    node.className = 'visualizer-node condition-group';
    node.dataset.depth = depth;
    
    // Customize based on depth to make it visually distinguishable
    const colors = ['primary', 'warning', 'accent', 'info', 'success'];
    const colorClass = colors[depth % colors.length];
    node.style.borderColor = `var(--${colorClass}-color)`;
    
    const header = document.createElement('div');
    header.className = 'group-header';
    header.style.backgroundColor = `var(--${colorClass}-color-light)`;
    header.style.color = `var(--${colorClass}-color-dark)`;
    
    // Create an expressive title
    const opText = operator === 'allOf' ? 'ALL of these (AND)' : 'ANY of these (OR)';
    header.textContent = depth === 0 ? `Match ${opText}` : `Then match ${opText}`;
    
    // Add operator badge
    const badge = document.createElement('span');
    badge.className = `operator-badge ${operator}`;
    badge.style.backgroundColor = `var(--${colorClass}-color)`;
    badge.textContent = operator === 'allOf' ? 'AND' : 'OR';
    header.appendChild(badge);
    
    node.appendChild(header);
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'group-children';
    
    // Check if we have conditions
    if (!conditions || conditions.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-nested-visualizer';
        emptyMessage.textContent = 'No conditions in this group';
        childrenContainer.appendChild(emptyMessage);
    } else {
        // Process each condition
        conditions.forEach(condition => {
            if (condition.field) {
                // It's a leaf condition
                createLeafNode(condition, childrenContainer);
            } else if (condition.allOf || condition.anyOf) {
                // It's a nested group
                const nestedOperator = condition.allOf ? 'allOf' : 'anyOf';
                createGroupNode(
                    condition[nestedOperator], 
                    nestedOperator, 
                    childrenContainer, 
                    depth + 1
                );
            }
        });
    }
    
    node.appendChild(childrenContainer);
    parent.appendChild(node);
}

/**
 * Export the condition visualization as a PNG
 * @param {HTMLElement} container - Container with visualization
 */
function exportConditionVisualization(container) {
    // Create a message to inform user this feature is not fully implemented
    alert('Visualization export functionality coming soon. For now, you can use browser screenshots.');
    
    // Future implementation would use a library like html2canvas to export the visualization
    // html2canvas(container).then(canvas => {
    //    const link = document.createElement('a');
    //    link.download = 'policy-condition-visualization.png';
    //    link.href = canvas.toDataURL('image/png');
    //    link.click();
    // });
}