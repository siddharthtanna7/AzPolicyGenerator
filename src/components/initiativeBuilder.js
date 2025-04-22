/**
 * Initiative Builder Component
 * Handles the UI functionality for building Azure Policy Initiatives
 */

// Global state for initiative builder
const initiativeBuilderState = {
    selectedPolicies: [],
    initiativeParameters: [],
    selectedTemplate: null
};

/**
 * Initialize the initiative builder component
 */
function initInitiativeBuilder() {
    // Set up event listeners
    document.getElementById('add-initiative-parameter').addEventListener('click', () => addInitiativeParameter());
    document.getElementById('add-existing-policy').addEventListener('click', openPolicySearchModal);
    document.getElementById('create-new-policy').addEventListener('click', switchToPolicyCreationMode);
    document.getElementById('generate-initiative').addEventListener('click', generateInitiative);
    document.getElementById('copy-initiative').addEventListener('click', copyInitiativeToClipboard);
    document.getElementById('download-initiative').addEventListener('click', downloadInitiative);
    
    // Set up import initiative handler
    const importInitiativeInput = document.getElementById('import-initiative');
    if (importInitiativeInput) {
        importInitiativeInput.addEventListener('change', handleInitiativeImport);
    }
    
    // Set up policy search modal
    document.getElementById('search-policies').addEventListener('click', searchPolicies);
    document.getElementById('add-selected-policies').addEventListener('click', addSelectedPoliciesToInitiative);
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('policy-search-modal').classList.remove('active');
        });
    });
    
    // Load initiative templates
    loadInitiativeTemplates();
}

/**
 * Add a parameter to the initiative
 * @param {Object} paramData - Optional parameter data for pre-filling
 */
function addInitiativeParameter(paramData = null) {
    const parametersContainer = document.getElementById('initiative-parameters-container');
    const paramId = `initiative-param-${Date.now()}`;
    
    // Create parameter container
    const paramContainer = document.createElement('div');
    paramContainer.className = 'parameter-item';
    paramContainer.id = paramId;
    
    // Parameter content
    paramContainer.innerHTML = `
        <h4>Parameter</h4>
        <div class="form-group">
            <label for="${paramId}-name">Name:</label>
            <input type="text" id="${paramId}-name" class="param-name" 
                value="${paramData?.name || ''}" placeholder="Enter parameter name">
        </div>
        <div class="form-group">
            <label for="${paramId}-display-name">Display Name:</label>
            <input type="text" id="${paramId}-display-name" class="param-display-name" 
                value="${paramData?.displayName || ''}" placeholder="Enter display name">
        </div>
        <div class="form-group">
            <label for="${paramId}-description">Description:</label>
            <textarea id="${paramId}-description" class="param-description" 
                placeholder="Enter parameter description">${paramData?.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label for="${paramId}-type">Type:</label>
            <select id="${paramId}-type" class="param-type">
                <option value="String" ${paramData?.type === 'String' ? 'selected' : ''}>String</option>
                <option value="Boolean" ${paramData?.type === 'Boolean' ? 'selected' : ''}>Boolean</option>
                <option value="Integer" ${paramData?.type === 'Integer' ? 'selected' : ''}>Integer</option>
                <option value="Array" ${paramData?.type === 'Array' ? 'selected' : ''}>Array</option>
                <option value="Object" ${paramData?.type === 'Object' ? 'selected' : ''}>Object</option>
            </select>
        </div>
        <div class="form-group">
            <label for="${paramId}-default">Default Value:</label>
            <input type="text" id="${paramId}-default" class="param-default" 
                value="${paramData?.defaultValue || ''}" placeholder="Enter default value">
        </div>
        <div class="form-group">
            <label for="${paramId}-allowed-values">Allowed Values:</label>
            <input type="text" id="${paramId}-allowed-values" class="param-allowed-values" 
                value="${paramData?.allowedValues?.join(', ') || ''}" 
                placeholder="Comma-separated list of allowed values">
            <small class="help-text">Separate values with commas</small>
        </div>
        <button class="remove-parameter" onclick="removeInitiativeParameter('${paramId}')">Remove Parameter</button>
    `;
    
    parametersContainer.appendChild(paramContainer);
    
    // Add to state
    if (!paramData) {
        initiativeBuilderState.initiativeParameters.push({
            id: paramId,
            name: '',
            displayName: '',
            description: '',
            type: 'String',
            defaultValue: '',
            allowedValues: []
        });
    } else {
        initiativeBuilderState.initiativeParameters.push({
            id: paramId,
            ...paramData
        });
    }
}

/**
 * Remove a parameter from the initiative
 * @param {string} paramId - The ID of the parameter to remove
 */
function removeInitiativeParameter(paramId) {
    const paramElement = document.getElementById(paramId);
    if (paramElement) {
        paramElement.remove();
    }
    
    // Remove from state
    const index = initiativeBuilderState.initiativeParameters.findIndex(p => p.id === paramId);
    if (index !== -1) {
        initiativeBuilderState.initiativeParameters.splice(index, 1);
    }
}

/**
 * Open the policy search modal
 */
function openPolicySearchModal() {
    // Clear previous search results
    document.getElementById('policy-search-results').innerHTML = '';
    document.getElementById('policy-search').value = '';
    
    // Show modal
    document.getElementById('policy-search-modal').classList.add('active');
}

/**
 * Search for policies
 */
function searchPolicies() {
    const searchInput = document.getElementById('policy-search').value.toLowerCase();
    const resultsContainer = document.getElementById('policy-search-results');
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Fetch policies
    fetch('../data/policyTemplates.json')
        .then(response => response.json())
        .then(data => {
            // Filter policies based on search term
            const filteredPolicies = data.policies.filter(policy => 
                policy.name.toLowerCase().includes(searchInput) || 
                policy.description.toLowerCase().includes(searchInput) ||
                (policy.category && policy.category.toLowerCase().includes(searchInput))
            );
            
            if (filteredPolicies.length === 0) {
                resultsContainer.innerHTML = '<div class="empty-state">No policies found. Try a different search term.</div>';
                return;
            }
            
            // Add policies to results
            filteredPolicies.forEach(policy => {
                const policyElement = document.createElement('div');
                policyElement.className = 'policy-search-item';
                policyElement.setAttribute('data-policy-id', policy.id || policy.name);
                
                policyElement.innerHTML = `
                    <input type="checkbox" class="policy-checkbox" id="policy-${policy.id || policy.name}">
                    <div class="policy-info">
                        <h4>${policy.name}</h4>
                        <p>${policy.description || 'No description'}</p>
                    </div>
                `;
                
                // Select policy when clicked
                policyElement.addEventListener('click', function(e) {
                    if (e.target.type !== 'checkbox') {
                        const checkbox = this.querySelector('.policy-checkbox');
                        checkbox.checked = !checkbox.checked;
                    }
                    this.classList.toggle('selected');
                });
                
                resultsContainer.appendChild(policyElement);
            });
        })
        .catch(error => {
            console.error('Error fetching policies:', error);
            resultsContainer.innerHTML = '<div class="empty-state">Error fetching policies. Please try again.</div>';
        });
}

/**
 * Add selected policies to the initiative
 */
function addSelectedPoliciesToInitiative() {
    const selectedItems = document.querySelectorAll('.policy-search-item.selected');
    
    // If no policies selected
    if (selectedItems.length === 0) {
        alert('Please select at least one policy to add');
        return;
    }
    
    // Fetch policy templates
    fetch('../data/policyTemplates.json')
        .then(response => response.json())
        .then(data => {
            // Hide empty state if it exists
            const emptyState = document.querySelector('#policies-container .empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            // Add each selected policy
            selectedItems.forEach(item => {
                const policyId = item.getAttribute('data-policy-id');
                const policyData = data.policies.find(p => (p.id || p.name) === policyId);
                
                if (policyData) {
                    addPolicyToInitiative({
                        id: policyData.id || `[resourceId('Microsoft.Authorization/policyDefinitions', '${policyData.name}')]`,
                        name: policyData.name,
                        description: policyData.description,
                        parameters: {}
                    });
                }
            });
            
            // Close modal
            document.getElementById('policy-search-modal').classList.remove('active');
        })
        .catch(error => {
            console.error('Error adding policies:', error);
            alert('Error adding policies. Please try again.');
        });
}

/**
 * Add a policy to the initiative
 * @param {Object} policy - The policy to add
 */
function addPolicyToInitiative(policy) {
    const policiesContainer = document.getElementById('policies-container');
    const policyId = `initiative-policy-${Date.now()}`;
    
    // Create policy card
    const policyCard = document.createElement('div');
    policyCard.className = 'policy-card';
    policyCard.id = policyId;
    
    // Policy card content
    policyCard.innerHTML = `
        <div class="policy-card-header">
            <div class="policy-card-title">
                <h4>${policy.name}</h4>
                <p>${policy.description || 'No description'}</p>
            </div>
            <div class="policy-card-actions">
                <button class="edit-policy-params" onclick="editPolicyParameters('${policyId}')">
                    <i class="fa fa-cog"></i> Parameters
                </button>
                <button class="remove-policy" onclick="removePolicyFromInitiative('${policyId}')">
                    <i class="fa fa-trash"></i> Remove
                </button>
            </div>
        </div>
        <div class="policy-card-body">
            <div class="policy-id">
                <small>ID: ${policy.id}</small>
            </div>
            <div class="policy-parameters">
                <small>${Object.keys(policy.parameters || {}).length} parameters</small>
            </div>
        </div>
    `;
    
    policiesContainer.appendChild(policyCard);
    
    // Add to state
    initiativeBuilderState.selectedPolicies.push({
        id: policyId,
        policyId: policy.id,
        name: policy.name,
        description: policy.description,
        parameters: policy.parameters || {},
        referenceId: policy.referenceId || `policy-${Date.now()}`
    });
}

/**
 * Remove a policy from the initiative
 * @param {string} policyId - The ID of the policy card to remove
 */
function removePolicyFromInitiative(policyId) {
    const policyElement = document.getElementById(policyId);
    if (policyElement) {
        policyElement.remove();
    }
    
    // Remove from state
    const index = initiativeBuilderState.selectedPolicies.findIndex(p => p.id === policyId);
    if (index !== -1) {
        initiativeBuilderState.selectedPolicies.splice(index, 1);
    }
    
    // Show empty state if no policies left
    if (initiativeBuilderState.selectedPolicies.length === 0) {
        const emptyState = document.querySelector('#policies-container .empty-state');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }
}

/**
 * Edit policy parameters
 * @param {string} policyId - The ID of the policy card
 */
function editPolicyParameters(policyId) {
    // Find policy in state
    const policy = initiativeBuilderState.selectedPolicies.find(p => p.id === policyId);
    if (!policy) return;
    
    // Create a modal for parameter editing
    const modalId = `param-modal-${Date.now()}`;
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal active';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Parameters for ${policy.name}</h3>
                <span class="close-modal" onclick="document.getElementById('${modalId}').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div id="${modalId}-params-container">
                    <p>Loading parameters...</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="primary-button" onclick="savePolicyParameters('${policyId}', '${modalId}')">Save</button>
                <button class="secondary-button" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load policy parameters
    loadPolicyParameters(policy, modalId);
}

/**
 * Load policy parameters into the modal
 * @param {Object} policy - The policy object
 * @param {string} modalId - The ID of the parameter modal
 */
function loadPolicyParameters(policy, modalId) {
    const paramsContainer = document.getElementById(`${modalId}-params-container`);
    
    // Create temporary container
    const tempContainer = document.createElement('div');
    
    // Add reference ID field
    const referenceIdField = document.createElement('div');
    referenceIdField.className = 'form-group';
    referenceIdField.innerHTML = `
        <label for="${modalId}-reference-id">Reference ID:</label>
        <input type="text" id="${modalId}-reference-id" value="${policy.referenceId}" 
            placeholder="Enter a unique reference ID for this policy">
        <small class="help-text">This ID is used to reference this policy within the initiative</small>
    `;
    tempContainer.appendChild(referenceIdField);
    
    // Add initiative parameter mapping
    const initiativeParams = initiativeBuilderState.initiativeParameters;
    if (initiativeParams.length > 0) {
        const initiativeParamsSection = document.createElement('div');
        initiativeParamsSection.className = 'parameters-section';
        initiativeParamsSection.innerHTML = `
            <h4>Map to Initiative Parameters</h4>
            <p>You can map policy parameters to initiative parameters to enable reuse.</p>
        `;
        tempContainer.appendChild(initiativeParamsSection);
    }
    
    // Add policy parameters
    const paramsSection = document.createElement('div');
    paramsSection.className = 'parameters-section';
    paramsSection.innerHTML = `
        <h4>Policy Parameters</h4>
        <p>Set values for the policy parameters.</p>
    `;
    tempContainer.appendChild(paramsSection);
    
    // Feature to detect parameters from policy
    const paramsMap = policy.parameters || {};
    const paramKeys = Object.keys(paramsMap);
    
    if (paramKeys.length === 0) {
        const noParamsMessage = document.createElement('div');
        noParamsMessage.className = 'info-box';
        noParamsMessage.innerHTML = `
            <p>This policy has no parameters or parameters couldn't be detected.</p>
        `;
        tempContainer.appendChild(noParamsMessage);
    } else {
        // Create fields for each parameter
        paramKeys.forEach(paramName => {
            const paramValue = paramsMap[paramName];
            const paramField = document.createElement('div');
            paramField.className = 'form-group';
            
            // Create dropdown for initiative parameters mapping
            let initiativeParamsOptions = '';
            if (initiativeParams.length > 0) {
                initiativeParamsOptions = `
                    <option value="">-- Select Initiative Parameter --</option>
                    ${initiativeParams.map(p => 
                        `<option value="[parameters('${p.name}')]">${p.name}</option>`
                    ).join('')}
                `;
            }
            
            paramField.innerHTML = `
                <label for="${modalId}-param-${paramName}">${paramName}:</label>
                <div class="param-mapping">
                    <input type="text" id="${modalId}-param-${paramName}" 
                        value="${paramValue || ''}" placeholder="Enter parameter value">
                    ${initiativeParams.length > 0 ? `
                        <select class="initiative-param-map" data-param-name="${paramName}">
                            ${initiativeParamsOptions}
                        </select>
                    ` : ''}
                </div>
            `;
            
            tempContainer.appendChild(paramField);
        });
    }
    
    // Replace the container contents
    paramsContainer.innerHTML = '';
    paramsContainer.appendChild(tempContainer);
    
    // Add event listeners for initiative parameter mapping
    if (initiativeParams.length > 0) {
        document.querySelectorAll('.initiative-param-map').forEach(select => {
            select.addEventListener('change', function() {
                const paramName = this.getAttribute('data-param-name');
                const paramInput = document.getElementById(`${modalId}-param-${paramName}`);
                
                if (this.value) {
                    paramInput.value = this.value;
                    paramInput.disabled = true;
                } else {
                    paramInput.disabled = false;
                }
            });
        });
    }
}

/**
 * Save policy parameters from the modal
 * @param {string} policyId - The ID of the policy card
 * @param {string} modalId - The ID of the parameter modal
 */
function savePolicyParameters(policyId, modalId) {
    // Find policy in state
    const policyIndex = initiativeBuilderState.selectedPolicies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) return;
    
    const policy = initiativeBuilderState.selectedPolicies[policyIndex];
    
    // Update reference ID
    const referenceIdInput = document.getElementById(`${modalId}-reference-id`);
    if (referenceIdInput) {
        policy.referenceId = referenceIdInput.value;
    }
    
    // Update parameters
    const paramsMap = policy.parameters || {};
    const paramKeys = Object.keys(paramsMap);
    
    paramKeys.forEach(paramName => {
        const paramInput = document.getElementById(`${modalId}-param-${paramName}`);
        if (paramInput) {
            paramsMap[paramName] = paramInput.value;
        }
    });
    
    // Update policy in state
    initiativeBuilderState.selectedPolicies[policyIndex] = {
        ...policy,
        parameters: paramsMap
    };
    
    // Close modal
    document.getElementById(modalId).remove();
}

/**
 * Switch to policy creation mode
 */
function switchToPolicyCreationMode() {
    // Hide initiative mode container
    document.getElementById('initiative-mode-container').classList.add('hidden');
    
    // Show policy mode container
    document.getElementById('policy-mode-container').classList.remove('hidden');
    
    // Update active mode button
    document.getElementById('policy-mode-btn').classList.add('active');
    document.getElementById('initiative-mode-btn').classList.remove('active');
}

/**
 * Generate initiative JSON
 */
function generateInitiative() {
    // Get form values
    const name = document.getElementById('initiative-name').value;
    const description = document.getElementById('initiative-description').value;
    const category = document.getElementById('initiative-category').value;
    const version = document.getElementById('initiative-version').value;
    
    // Collect parameters
    const parameters = [];
    initiativeBuilderState.initiativeParameters.forEach(param => {
        const paramElement = document.getElementById(param.id);
        if (!paramElement) return;
        
        const nameInput = document.getElementById(`${param.id}-name`);
        const displayNameInput = document.getElementById(`${param.id}-display-name`);
        const descriptionInput = document.getElementById(`${param.id}-description`);
        const typeInput = document.getElementById(`${param.id}-type`);
        const defaultInput = document.getElementById(`${param.id}-default`);
        const allowedValuesInput = document.getElementById(`${param.id}-allowed-values`);
        
        if (nameInput && nameInput.value) {
            parameters.push({
                name: nameInput.value,
                displayName: displayNameInput?.value || nameInput.value,
                description: descriptionInput?.value || '',
                type: typeInput?.value || 'String',
                defaultValue: defaultInput?.value || '',
                allowedValues: allowedValuesInput?.value ? 
                    allowedValuesInput.value.split(',').map(v => v.trim()) : []
            });
        }
    });
    
    // Collect policies
    const policies = [];
    initiativeBuilderState.selectedPolicies.forEach(policy => {
        policies.push({
            id: policy.policyId,
            name: policy.name,
            referenceId: policy.referenceId,
            parameters: policy.parameters
        });
    });
    
    // Validate initiative
    if (!name) {
        alert('Initiative name is required');
        return;
    }
    
    if (policies.length === 0) {
        alert('At least one policy must be included in the initiative');
        return;
    }
    
    // Generate initiative JSON
    const initiativeOptions = {
        name,
        description,
        category,
        version,
        parameters,
        policies
    };
    
    try {
        const initiativeJson = InitiativeGenerator.generateInitiative(initiativeOptions);
        
        // Display in preview
        document.getElementById('initiative-json').textContent = JSON.stringify(initiativeJson, null, 4);
        
        // Generate other formats
        if (FormatConverter) {
            document.getElementById('initiative-bicep').textContent = 
                FormatConverter.convertToBicep(initiativeJson, 'initiative');
            document.getElementById('initiative-cli').textContent = 
                FormatConverter.convertToAzureCLI(initiativeJson, 'initiative');
        }
    } catch (error) {
        console.error('Error generating initiative:', error);
        alert(`Error generating initiative: ${error.message}`);
    }
}

/**
 * Copy initiative to clipboard
 */
function copyInitiativeToClipboard() {
    const initiativeJson = document.getElementById('initiative-json').textContent;
    
    if (!initiativeJson || initiativeJson.includes('Initiative JSON will appear here')) {
        alert('Please generate an initiative first');
        return;
    }
    
    navigator.clipboard.writeText(initiativeJson)
        .then(() => {
            alert('Initiative copied to clipboard');
        })
        .catch(err => {
            console.error('Error copying to clipboard:', err);
            alert('Error copying to clipboard');
        });
}

/**
 * Download initiative
 */
function downloadInitiative() {
    const initiativeJson = document.getElementById('initiative-json').textContent;
    
    if (!initiativeJson || initiativeJson.includes('Initiative JSON will appear here')) {
        alert('Please generate an initiative first');
        return;
    }
    
    const name = document.getElementById('initiative-name').value || 'initiative';
    const blob = new Blob([initiativeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Handle initiative import
 * @param {Event} event - The file input change event
 */
function handleInitiativeImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const initiativeJson = JSON.parse(e.target.result);
            InitiativeImporter.importInitiative(initiativeJson);
        } catch (error) {
            console.error('Error importing initiative:', error);
            alert('Error importing initiative. Please check the file format and try again.');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

/**
 * Load initiative templates
 */
function loadInitiativeTemplates() {
    const templatesContainer = document.getElementById('initiative-templates-container');
    
    fetch('../data/policyInitiatives.json')
        .then(response => response.json())
        .then(data => {
            // Group templates by type
            const templatesByType = {};
            data.initiativeTypes.forEach(type => {
                templatesByType[type.name] = {
                    description: type.description,
                    templates: []
                };
            });
            
            // Add initiatives to their types
            data.initiatives.forEach(initiative => {
                // Determine type based on name or categories
                let type = 'Custom';
                
                if (initiative.name.includes('Compliance') || 
                    (initiative.categories && initiative.categories.includes('Compliance'))) {
                    type = 'Regulatory Compliance';
                } else if (initiative.name.includes('Benchmark') || 
                    initiative.name.includes('security baseline')) {
                    type = 'Security Baseline';
                } else if (initiative.name.includes('Configure') || 
                    initiative.name.includes('Deploy')) {
                    type = 'Resource Configuration';
                } else if (initiative.categories && 
                    (initiative.categories.includes('Healthcare') || 
                     initiative.categories.includes('Industry'))) {
                    type = 'Industry Standard';
                }
                
                if (templatesByType[type]) {
                    templatesByType[type].templates.push(initiative);
                } else {
                    templatesByType['Custom'].templates.push(initiative);
                }
            });
            
            // Clear templates container
            templatesContainer.innerHTML = '';
            
            // Add template groups
            Object.entries(templatesByType).forEach(([typeName, typeData]) => {
                if (typeData.templates.length === 0) return;
                
                const typeSection = document.createElement('div');
                typeSection.className = 'template-section';
                
                typeSection.innerHTML = `
                    <h4>${typeName}</h4>
                    <p>${typeData.description || ''}</p>
                    <div class="template-cards">
                        ${typeData.templates.map(template => `
                            <div class="template-card" data-template-name="${template.name}">
                                <h5>${template.name}</h5>
                                <p>${template.description || 'No description'}</p>
                                <div class="template-meta">
                                    <span class="template-category">${template.categories ? template.categories.join(', ') : 'N/A'}</span>
                                </div>
                                <button class="apply-template" data-template-name="${template.name}">Use Template</button>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                templatesContainer.appendChild(typeSection);
            });
            
            // Add event listeners to template buttons
            document.querySelectorAll('.apply-template').forEach(button => {
                button.addEventListener('click', function() {
                    const templateName = this.getAttribute('data-template-name');
                    const template = data.initiatives.find(t => t.name === templateName);
                    if (template) {
                        applyInitiativeTemplate(template);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading initiative templates:', error);
            templatesContainer.innerHTML = '<div class="error-message">Error loading templates. Please try again.</div>';
        });
}

/**
 * Apply an initiative template
 * @param {Object} template - The template to apply
 */
function applyInitiativeTemplate(template) {
    // Set basic info
    document.getElementById('initiative-name').value = template.name;
    document.getElementById('initiative-description').value = template.description || '';
    document.getElementById('initiative-category').value = template.categories ? template.categories[0] : '';
    
    // Activate info tab
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const infoTabButton = document.querySelector('.tab-button[data-tab="initiative-info"]');
    if (infoTabButton) infoTabButton.classList.add('active');
    
    const infoTabContent = document.getElementById('initiative-info-tab');
    if (infoTabContent) infoTabContent.classList.add('active');
    
    // Store selected template
    initiativeBuilderState.selectedTemplate = template;
    
    // Alert user about next steps
    alert(`Template "${template.name}" applied. Now you need to add policies to this initiative.`);
}