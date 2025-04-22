/**
 * Azure Policy Importer
 * Utility for importing existing Azure Policy definitions
 */
const PolicyImporter = {
    /**
     * Import a policy JSON into the UI
     * @param {Object} policyJson - The policy JSON to import
     */
    importPolicy(policyJson) {
        try {
            // Parse the policy if it's a string
            const policy = typeof policyJson === 'string' ? JSON.parse(policyJson) : policyJson;
            
            // Extract policy properties
            const properties = policy.properties || policy;
            
            // Set basic information
            this._setBasicInfo(properties);
            
            // Set parameters
            this._setParameters(properties.parameters);
            
            // Set conditions
            this._setConditions(properties.policyRule);
            
            // Set effect
            this._setEffect(properties.policyRule);
            
            return true;
        } catch (error) {
            console.error('Error importing policy:', error);
            throw new Error('Invalid policy JSON format. Please check the file and try again.');
        }
    },
    
    /**
     * Set basic information from policy
     * @param {Object} properties - Policy properties
     */
    _setBasicInfo(properties) {
        // Set policy name
        const nameInput = document.getElementById('policy-name');
        if (nameInput && properties.displayName) {
            nameInput.value = properties.displayName;
        }
        
        // Set policy description
        const descInput = document.getElementById('policy-description');
        if (descInput && properties.description) {
            descInput.value = properties.description;
        }
        
        // Set policy mode
        const modeSelect = document.getElementById('policy-mode');
        if (modeSelect && properties.mode) {
            // Find the option with the matching value
            const option = Array.from(modeSelect.options).find(opt => opt.value === properties.mode);
            if (option) {
                option.selected = true;
            }
        }
        
        // Activate the basic info tab
        this._activateTab('basic-info');
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
    },
    
    /**
     * Set parameters from policy
     * @param {Object} parameters - Policy parameters
     */
    _setParameters(parameters) {
        // Clear existing parameters
        const parametersContainer = document.getElementById('parameters-container');
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
            if (typeof addParameter === 'function') {
                addParameter(paramData);
            }
        });
        
        // If parameters were added, activate the parameters tab
        if (parameters && Object.keys(parameters).length > 0) {
            this._activateTab('parameters');
        }
    },
    
    /**
     * Set conditions from policy rule
     * @param {Object} policyRule - Policy rule object
     */
    _setConditions(policyRule) {
        // Clear existing conditions
        const conditionBuilder = document.getElementById('condition-builder');
        if (conditionBuilder) {
            conditionBuilder.innerHTML = '';
        }
        
        // If no policy rule, return
        if (!policyRule || !policyRule.if) {
            return;
        }
        
        // Extract conditions
        let ifCondition = policyRule.if;
        const conditions = [];
        
        // Handle not operator
        if (ifCondition.not) {
            // Inside not, find the actual condition
            const notCondition = ifCondition.not;
            
            // Check if it's a field condition
            if (notCondition.field) {
                // Find the operator
                const operator = Object.keys(notCondition).find(key => key !== 'field');
                if (operator) {
                    // Convert 'not' + operator to a negated operator if possible
                    let negatedOperator = `not${operator.charAt(0).toUpperCase() + operator.slice(1)}`;
                    
                    // Check if we have a valid negated operator, otherwise use original with 'not'
                    conditions.push({
                        field: notCondition.field,
                        operator: negatedOperator,
                        value: notCondition[operator]
                    });
                }
            }
        }
        // Handle single condition
        else if (ifCondition.field && Object.keys(ifCondition).length > 1) {
            const operator = Object.keys(ifCondition).find(key => key !== 'field');
            if (operator) {
                conditions.push({
                    field: ifCondition.field,
                    operator: operator,
                    value: ifCondition[operator]
                });
            }
        }
        // Handle allOf conditions
        else if (ifCondition.allOf && Array.isArray(ifCondition.allOf)) {
            ifCondition.allOf.forEach(condition => {
                const operator = Object.keys(condition).find(key => key !== 'field');
                if (condition.field && operator) {
                    conditions.push({
                        field: condition.field,
                        operator: operator,
                        value: condition[operator]
                    });
                }
            });
        }
        
        // Add conditions to UI
        conditions.forEach(condition => {
            if (typeof addCondition === 'function') {
                // Convert array or object values to string if needed
                if (typeof condition.value === 'object') {
                    condition.value = JSON.stringify(condition.value);
                }
                
                addCondition(condition);
            }
        });
        
        // If conditions were added, activate the conditions tab
        if (conditions.length > 0) {
            this._activateTab('conditions');
        }
    },
    
    /**
     * Set effect from policy rule
     * @param {Object} policyRule - Policy rule object
     */
    _setEffect(policyRule) {
        if (!policyRule || !policyRule.then || !policyRule.then.effect) {
            return;
        }
        
        // Set effect
        const effectSelect = document.getElementById('policy-effect');
        if (effectSelect) {
            const effect = policyRule.then.effect;
            
            // Find the option with the matching value
            const option = Array.from(effectSelect.options).find(opt => opt.value === effect);
            if (option) {
                option.selected = true;
            }
        }
    }
};