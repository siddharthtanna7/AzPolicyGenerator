/**
 * Add a new parameter to the UI
 * @param {Object} paramData - Optional initial parameter data
 */
function addParameter(paramData = {}) {
    const parametersContainer = document.getElementById('parameters-container');
    if (!parametersContainer) return;
    
    // Create parameter container
    const paramItem = document.createElement('div');
    paramItem.className = 'parameter-item';
    
    // Create parameter header
    const paramHeader = document.createElement('div');
    paramHeader.className = 'parameter-header';
    
    const paramName = document.createElement('h4');
    paramName.textContent = paramData.name || 'New Parameter';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'remove-condition';
    deleteBtn.addEventListener('click', () => {
        parametersContainer.removeChild(paramItem);
    });
    
    paramHeader.appendChild(paramName);
    paramHeader.appendChild(deleteBtn);
    
    // Create parameter form
    const paramForm = document.createElement('div');
    paramForm.className = 'parameter-form';
    
    // Name field
    const nameGroup = createFormGroup(
        'param-name',
        'Parameter Name:',
        'text',
        paramData.name || '',
        'Enter parameter name (e.g. allowedLocations)',
        'Parameter name is required and should be camelCase', 
        true  // required
    );
    paramForm.appendChild(nameGroup);
    
    // Update header when name changes
    const nameInput = nameGroup.querySelector('input');
    nameInput.addEventListener('input', () => {
        paramName.textContent = nameInput.value || 'New Parameter';
        
        // Validate parameter name
        if (nameInput.value.trim()) {
            if (/^[a-z][a-zA-Z0-9]*$/.test(nameInput.value)) {
                nameInput.classList.add('is-valid');
                nameInput.classList.remove('is-invalid');
            } else {
                nameInput.classList.add('is-invalid');
                nameInput.classList.remove('is-valid');
            }
        } else {
            nameInput.classList.add('is-invalid');
            nameInput.classList.remove('is-valid');
        }
    });
    
    // Display name field
    const displayNameGroup = createFormGroup(
        'param-display-name',
        'Display Name:',
        'text',
        paramData.displayName || '',
        'Enter display name (e.g. Allowed Locations)',
        'Display name improves readability of your policy',
        false
    );
    paramForm.appendChild(displayNameGroup);
    
    // Add validation for display name
    const displayNameInput = displayNameGroup.querySelector('input');
    displayNameInput.addEventListener('input', () => {
        if (displayNameInput.value.trim()) {
            displayNameInput.classList.add('is-valid');
            displayNameInput.classList.remove('is-invalid');
        }
    });
    
    // Description field
    const descGroup = createFormGroup(
        'param-description',
        'Description:',
        'textarea',
        paramData.description || '',
        'Enter parameter description',
        'Description helps others understand the purpose of this parameter',
        false
    );
    paramForm.appendChild(descGroup);
    
    // Add validation for description
    const descInput = descGroup.querySelector('textarea');
    descInput.addEventListener('input', () => {
        if (descInput.value.trim()) {
            descInput.classList.add('is-valid');
            descInput.classList.remove('is-invalid');
        }
    });
    
    // Type field
    const typeGroup = document.createElement('div');
    typeGroup.className = 'form-group';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type:';
    
    const typeSelect = document.createElement('select');
    typeSelect.className = 'param-type';
    
    const types = ['String', 'Array', 'Boolean', 'Integer', 'Object'];
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (type === (paramData.type || 'String')) {
            option.selected = true;
        }
        typeSelect.appendChild(option);
    });
    
    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(typeSelect);
    paramForm.appendChild(typeGroup);
    
    // Default value field
    const defaultValueGroup = createFormGroup(
        'param-default-value',
        'Default Value:',
        'text',
        paramData.defaultValue || '',
        'Enter default value'
    );
    paramForm.appendChild(defaultValueGroup);
    
    // Allowed values field
    const allowedValuesGroup = createFormGroup(
        'param-allowed-values',
        'Allowed Values: (comma-separated)',
        'text',
        paramData.allowedValues ? paramData.allowedValues.join(', ') : '',
        'e.g. eastus, westus, centralus'
    );
    paramForm.appendChild(allowedValuesGroup);
    
    // Add everything to parameter item
    paramItem.appendChild(paramHeader);
    paramItem.appendChild(paramForm);
    
    // Add to container
    parametersContainer.appendChild(paramItem);
}

/**
 * Create a form group with label and input
 * @param {string} className - Class for the input
 * @param {string} labelText - Text for the label
 * @param {string} type - Input type (text, textarea, etc)
 * @param {string} value - Initial value
 * @param {string} placeholder - Placeholder text
 * @param {string} validationMessage - Message to show when validation fails
 * @param {boolean} required - Whether the field is required
 * @returns {HTMLElement} - Form group element
 */
function createFormGroup(className, labelText, type, value, placeholder, validationMessage = '', required = false) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    
    // Add required indicator if needed
    if (required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'required-indicator';
        requiredSpan.textContent = ' *';
        requiredSpan.style.color = 'var(--danger-color)';
        
        label.textContent = labelText;
        label.appendChild(requiredSpan);
    } else {
        label.textContent = labelText;
    }
    
    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.textContent = value || '';
    } else {
        input = document.createElement('input');
        input.type = type;
        input.value = value || '';
    }
    
    input.className = className;
    input.placeholder = placeholder || '';
    
    // Add required attribute if needed
    if (required) {
        input.setAttribute('required', 'required');
    }
    
    // Add validation feedback element
    if (validationMessage) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'invalid-feedback';
        feedbackDiv.textContent = validationMessage;
        
        group.appendChild(label);
        group.appendChild(input);
        group.appendChild(feedbackDiv);
    } else {
        group.appendChild(label);
        group.appendChild(input);
    }
    
    return group;
}

/**
 * Initialize the Parameter Builder component
 */
function initParameterBuilder() {
    const addParameterBtn = document.getElementById('add-parameter');
    
    // Set up event listener for adding parameters
    if (addParameterBtn) {
        addParameterBtn.addEventListener('click', () => {
            addParameter();
        });
    }
}

/**
 * Get all parameters from the UI
 * @returns {Array} - Array of parameter objects
 */
function getParameters() {
    const parameterItems = document.querySelectorAll('.parameter-item');
    const parameters = [];
    
    parameterItems.forEach(item => {
        const name = item.querySelector('.param-name').value;
        const displayName = item.querySelector('.param-display-name').value || name;
        const description = item.querySelector('.param-description').value || '';
        const type = item.querySelector('.param-type').value;
        const defaultValue = item.querySelector('.param-default-value').value;
        
        // Parse allowed values (comma-separated)
        const allowedValuesInput = item.querySelector('.param-allowed-values').value;
        let allowedValues = [];
        if (allowedValuesInput) {
            allowedValues = allowedValuesInput.split(',').map(v => v.trim()).filter(v => v);
        }
        
        // Only add if parameter has a name
        if (name) {
            parameters.push({
                name,
                displayName,
                description,
                type,
                defaultValue,
                allowedValues
            });
        }
    });
    
    return parameters;
}