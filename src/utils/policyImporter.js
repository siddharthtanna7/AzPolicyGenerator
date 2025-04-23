/**
 * Azure Policy Importer
 * Utility for importing existing Azure Policy definitions
 */
const PolicyImporter = {
    /**
     * Import a policy JSON into the UI
     * @param {Object|string} policyJson - The policy JSON to import
     */
    importPolicy(policyJson) {
        try {
            // Parse and normalize the policy
            const normalizedPolicy = this.normalizePolicy(policyJson);
            
            // Extract policy properties
            const properties = normalizedPolicy.properties || normalizedPolicy;
            
            // Set basic information
            this._setBasicInfo(properties);
            
            // Set parameters
            this._setParameters(properties.parameters);
            
            // Set conditions and effect
            this._setConditionsAndEffect(properties.policyRule);
            
            // Return success
            return true;
        } catch (error) {
            console.error('Error importing policy:', error);
            throw new Error('Invalid policy JSON format. Please check the file and try again.');
        }
    },
    
    /**
     * Ensures the policy JSON is properly formatted regardless of source
     * @param {string|object} policyJson - The policy JSON string or object
     * @returns {object} - The normalized policy object
     */
    normalizePolicy(policyJson) {
        let policyObj;
        
        // If it's a string, parse it
        if (typeof policyJson === 'string') {
            try {
                policyObj = JSON.parse(policyJson);
            } catch (e) {
                throw new Error(`Invalid JSON: ${e.message}`);
            }
        } else {
            // If it's already an object, use it directly
            policyObj = policyJson;
        }
        
        // Handle various policy formats
        
        // Handle ARM template format
        if (policyObj.resources && Array.isArray(policyObj.resources) && policyObj.resources.length > 0) {
            const policyResources = policyObj.resources.filter(r => 
                r.type === 'Microsoft.Authorization/policyDefinitions' || 
                r.type === 'Microsoft.Authorization/policySetDefinitions');
                
            if (policyResources.length > 0) {
                // Use the first policy resource
                policyObj = policyResources[0];
            }
        }
        
        // Handling nested policy in various formats
        if (policyObj.policy && typeof policyObj.policy === 'object') {
            policyObj = policyObj.policy;
        } else if (policyObj.policies && Array.isArray(policyObj.policies) && policyObj.policies.length > 0) {
            policyObj = policyObj.policies[0];
        }
        
        // Handle direct policy rule format
        if (policyObj.if && policyObj.then && !policyObj.properties) {
            policyObj = {
                properties: {
                    displayName: 'Imported Policy',
                    description: 'Imported from JSON',
                    policyRule: policyObj
                }
            };
        }
        
        return policyObj;
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
        
        // Set metadata category if available
        if (properties.metadata && properties.metadata.category) {
            const categorySelect = document.getElementById('metadata-category');
            if (categorySelect) {
                const option = Array.from(categorySelect.options).find(opt => 
                    opt.value === properties.metadata.category);
                if (option) {
                    option.selected = true;
                }
            }
        }
        
        // Set version if available
        if (properties.metadata && properties.metadata.version) {
            const versionInput = document.getElementById('policy-version');
            if (versionInput) {
                versionInput.value = properties.metadata.version;
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
                allowedValues = param.allowedValues.map(v => this._formatParamValueAsString(v));
            }
            
            // Create parameter data
            const paramData = {
                name: name,
                displayName: param.metadata?.displayName || name,
                description: param.metadata?.description || '',
                type: param.type || 'String',
                defaultValue: param.defaultValue !== undefined 
                    ? this._formatParamValueAsString(param.defaultValue) 
                    : '',
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
     * Format parameter value to string representation
     * @param {any} value - Parameter value
     * @returns {string} - String representation
     */
    _formatParamValueAsString(value) {
        if (value === null) return 'null';
        if (value === undefined) return '';
        
        switch (typeof value) {
            case 'object':
                return JSON.stringify(value);
            case 'boolean':
            case 'number':
                return String(value);
            default:
                return value;
        }
    },
    
    /**
     * Set conditions and effect from policy rule
     * @param {Object} policyRule - Policy rule object with if/then structure
     */
    _setConditionsAndEffect(policyRule) {
        if (!policyRule) return;
        
        // Clear existing conditions
        const conditionBuilder = document.getElementById('condition-builder');
        if (conditionBuilder) {
            conditionBuilder.innerHTML = '';
        }
        
        // Process if condition
        if (policyRule.if) {
            // Convert policy condition to UI condition structure
            const conditionStructure = this._convertPolicyConditionToUI(policyRule.if);
            
            // Use the condition builder's loadConditionStructure function
            if (typeof loadConditionStructure === 'function') {
                loadConditionStructure(conditionStructure);
            }
            
            // Activate the conditions tab
            this._activateTab('conditions');
        }
        
        // Process effect (then part)
        if (policyRule.then && policyRule.then.effect) {
            this._setEffect(policyRule.then.effect);
        }
    },
    
    /**
     * Convert policy condition to UI condition structure
     * Handles complex nested conditions with allOf/anyOf
     * @param {Object} condition - Policy condition
     * @returns {Object} - UI condition structure
     */
    _convertPolicyConditionToUI(condition) {
        // Handle not operator special case
        if (condition.not) {
            const innerCondition = this._convertPolicyConditionToUI(condition.not);
            
            // If it's a simple field condition, negate the operator
            if (innerCondition.field) {
                const negatedOperator = this._negateOperator(innerCondition.operator);
                return {
                    field: innerCondition.field,
                    operator: negatedOperator,
                    value: innerCondition.value
                };
            }
            
            // If it's a complex condition, we can't directly negate
            // So wrap it in a negated structure
            return { not: innerCondition };
        }
        
        // Handle simple field condition
        if (condition.field) {
            // Find the operator (key that isn't 'field')
            const operator = Object.keys(condition).find(key => key !== 'field');
            if (operator) {
                return {
                    field: condition.field,
                    operator: operator,
                    value: condition[operator]
                };
            }
            return null;
        }
        
        // Handle allOf conditions
        if (condition.allOf && Array.isArray(condition.allOf)) {
            return {
                operator: 'allOf',
                allOf: condition.allOf.map(c => this._convertPolicyConditionToUI(c))
                                      .filter(Boolean)
            };
        }
        
        // Handle anyOf conditions
        if (condition.anyOf && Array.isArray(condition.anyOf)) {
            return {
                operator: 'anyOf',
                anyOf: condition.anyOf.map(c => this._convertPolicyConditionToUI(c))
                                      .filter(Boolean)
            };
        }
        
        // Return null for unrecognized structures
        return null;
    },
    
    /**
     * Negate an operator
     * @param {string} operator - Original operator
     * @returns {string} - Negated operator
     */
    _negateOperator(operator) {
        const negationMap = {
            'equals': 'notEquals',
            'like': 'notLike',
            'match': 'notMatch',
            'contains': 'notContains',
            'in': 'notIn',
            'containsKey': 'notContainsKey',
            'exists': 'notExists',
            'notEquals': 'equals',
            'notLike': 'like',
            'notMatch': 'match',
            'notContains': 'contains',
            'notIn': 'in',
            'notContainsKey': 'containsKey',
            'notExists': 'exists'
        };
        
        return negationMap[operator] || operator;
    },
    
    /**
     * Set effect from policy
     * @param {string|Object} effect - Policy effect value or object
     */
    _setEffect(effect) {
        const effectSelect = document.getElementById('policy-effect');
        if (!effectSelect) return;
        
        let effectValue = effect;
        
        // Check if effect is a parameter reference
        if (typeof effect === 'string' && effect.startsWith('[parameters(') && effect.endsWith(')]')) {
            // Extract parameter name
            const paramMatch = effect.match(/\[parameters\('([^']+)'\)\]/);
            if (paramMatch && paramMatch[1]) {
                const paramName = paramMatch[1];
                
                // Set the effect parameter checkbox
                const effectParamCheckbox = document.getElementById('effect-is-parameter');
                if (effectParamCheckbox) {
                    effectParamCheckbox.checked = true;
                }
                
                // Set the effect parameter name
                const effectParamNameInput = document.getElementById('effect-parameter-name');
                if (effectParamNameInput) {
                    effectParamNameInput.value = paramName;
                }
                
                // For the select, use either the parameter's default value or the first option
                const paramSelect = document.querySelector(`#parameters-container [data-param-name="${paramName}"]`);
                if (paramSelect) {
                    const defaultValue = paramSelect.getAttribute('data-default-value');
                    if (defaultValue) {
                        effectValue = defaultValue;
                    }
                }
            }
        }
        
        // Set the effect dropdown
        if (typeof effectValue === 'string') {
            // Find the option with the matching value
            const option = Array.from(effectSelect.options).find(opt => opt.value === effectValue);
            if (option) {
                option.selected = true;
                
                // Trigger the change event to update any dependent UI
                const event = new Event('change');
                effectSelect.dispatchEvent(event);
            }
        }
    }
};

// For testing in Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolicyImporter;
}