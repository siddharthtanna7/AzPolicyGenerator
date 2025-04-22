/**
 * Azure Policy Initiative Importer
 * Utility for importing existing Azure Policy Initiative (Policy Set) definitions
 */
const InitiativeImporter = {
    /**
     * Import an initiative JSON into the UI
     * @param {Object} initiativeJson - The initiative JSON to import
     */
    importInitiative(initiativeJson) {
        try {
            // Parse the initiative if it's a string
            const initiative = typeof initiativeJson === 'string' ? JSON.parse(initiativeJson) : initiativeJson;
            
            // Extract initiative properties
            const properties = initiative.properties || initiative;
            
            // Set basic information
            this._setBasicInfo(properties);
            
            // Set parameters
            this._setParameters(properties.parameters);
            
            // Set policies
            this._setPolicies(properties.policyDefinitions);
            
            return true;
        } catch (error) {
            console.error('Error importing initiative:', error);
            throw new Error('Invalid initiative JSON format. Please check the file and try again.');
        }
    },
    
    /**
     * Set basic information from initiative
     * @param {Object} properties - Initiative properties
     */
    _setBasicInfo(properties) {
        // Set initiative name
        const nameInput = document.getElementById('initiative-name');
        if (nameInput && properties.displayName) {
            nameInput.value = properties.displayName;
        }
        
        // Set initiative description
        const descInput = document.getElementById('initiative-description');
        if (descInput && properties.description) {
            descInput.value = properties.description;
        }
        
        // Set initiative category
        const categoryInput = document.getElementById('initiative-category');
        if (categoryInput && properties.metadata && properties.metadata.category) {
            categoryInput.value = properties.metadata.category;
        }
        
        // Set initiative version
        const versionInput = document.getElementById('initiative-version');
        if (versionInput && properties.metadata && properties.metadata.version) {
            versionInput.value = properties.metadata.version;
        }
        
        // Activate the basic info tab
        this._activateTab('initiative-info');
    },
    
    /**
     * Set parameters from initiative
     * @param {Object} parameters - Initiative parameters
     */
    _setParameters(parameters) {
        // Clear existing parameters
        const parametersContainer = document.getElementById('initiative-parameters-container');
        if (parametersContainer) {
            parametersContainer.innerHTML = '';
        }
        
        // If no parameters, return
        if (!parameters || Object.keys(parameters).length === 0) {
            return;
        }
        
        // Add each parameter
        Object.entries(parameters).forEach(([name, param]) => {
            // Convert allowed values to string if needed
            let allowedValues = [];
            if (param.allowedValues && Array.isArray(param.allowedValues)) {
                allowedValues = param.allowedValues.map(v => String(v));
            }
            
            // Create parameter data
            const paramData = {
                name: name,
                displayName: param.metadata?.displayName || name,
                description: param.metadata?.description || '',
                type: param.type || 'String',
                defaultValue: param.defaultValue !== undefined ? String(param.defaultValue) : '',
                allowedValues: allowedValues
            };
            
            // Add parameter to UI
            if (typeof addInitiativeParameter === 'function') {
                addInitiativeParameter(paramData);
            }
        });
        
        // If parameters were added, activate the parameters tab
        if (parameters && Object.keys(parameters).length > 0) {
            this._activateTab('initiative-parameters');
        }
    },
    
    /**
     * Set policies from initiative
     * @param {Array} policyDefinitions - Initiative policy definitions
     */
    _setPolicies(policyDefinitions) {
        // Clear existing policies
        const policiesContainer = document.getElementById('policies-container');
        if (policiesContainer) {
            // Clear everything except the empty state
            const emptyState = policiesContainer.querySelector('.empty-state');
            policiesContainer.innerHTML = '';
            
            if (emptyState) {
                policiesContainer.appendChild(emptyState);
            }
        }
        
        // If no policies, return
        if (!policyDefinitions || !Array.isArray(policyDefinitions) || policyDefinitions.length === 0) {
            return;
        }
        
        // Hide the empty state if it exists
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Add each policy
        policyDefinitions.forEach(policyDef => {
            const policyId = policyDef.policyDefinitionId;
            const referenceId = policyDef.policyDefinitionReferenceId;
            const parameters = policyDef.parameters || {};
            
            // Create a policy object
            const policy = {
                id: policyId,
                referenceId: referenceId,
                name: this._extractPolicyName(policyId),
                parameters: {}
            };
            
            // Convert parameters
            Object.entries(parameters).forEach(([paramName, paramObj]) => {
                policy.parameters[paramName] = paramObj.value;
            });
            
            // Add policy to UI
            if (typeof addPolicyToInitiative === 'function') {
                addPolicyToInitiative(policy);
            }
        });
        
        // If policies were added, activate the policies tab
        if (policyDefinitions.length > 0) {
            this._activateTab('initiative-policies');
        }
    },
    
    /**
     * Extract policy name from policy ID
     * @param {string} policyId - The policy definition ID
     * @returns {string} - Policy name
     */
    _extractPolicyName(policyId) {
        if (!policyId) return 'Unknown Policy';
        
        // For resource IDs
        if (policyId.includes('/')) {
            // Extract the last segment
            const parts = policyId.split('/');
            return parts[parts.length - 1];
        }
        
        // For resourceId() function calls
        if (policyId.includes('resourceId(') && policyId.includes(')')) {
            // Extract the name from the resourceId function
            const matches = policyId.match(/'([^']+)'/g);
            if (matches && matches.length > 0) {
                // Return the last parameter in the resourceId function
                return matches[matches.length - 1].replace(/'/g, '');
            }
        }
        
        return policyId;
    },
    
    /**
     * Activate a specific tab
     * @param {string} tabId - The ID of the tab to activate
     */
    _activateTab(tabId) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Deactivate all tabs
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Activate the specified tab
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }
        
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
    }
};