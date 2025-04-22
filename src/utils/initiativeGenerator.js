/**
 * Azure Policy Initiative Generator
 * Utility for generating Azure Policy Initiative (Policy Set) definitions
 */
const InitiativeGenerator = {
    /**
     * Generate a complete Azure Policy Initiative definition
     * @param {Object} options - Initiative configuration options
     * @returns {Object} - Complete initiative JSON
     */
    generateInitiative(options) {
        // Validate required fields
        if (!options.name) {
            throw new Error('Initiative name is required');
        }
        
        if (!options.policies || !Array.isArray(options.policies) || options.policies.length === 0) {
            throw new Error('At least one policy must be included in the initiative');
        }
        
        // Build initiative structure
        const initiative = {
            "properties": {
                "displayName": options.name,
                "description": options.description || '',
                "metadata": {
                    "version": options.version || '1.0.0',
                    "category": options.category || ''
                },
                "parameters": this._generateParameters(options.parameters || []),
                "policyDefinitions": this._generatePolicyDefinitions(options.policies)
            }
        };
        
        return initiative;
    },
    
    /**
     * Generate initiative parameters section
     * @param {Array} parameters - Array of parameter objects
     * @returns {Object} - Parameters object for initiative
     */
    _generateParameters(parameters) {
        const result = {};
        
        parameters.forEach(param => {
            if (!param.name) return;
            
            result[param.name] = {
                "type": param.type || 'String',
                "metadata": {
                    "displayName": param.displayName || param.name,
                    "description": param.description || ''
                }
            };
            
            // Add default value if provided
            if (param.defaultValue !== undefined && param.defaultValue !== '') {
                result[param.name].defaultValue = this._formatParamValue(param.defaultValue, param.type);
            }
            
            // Add allowed values if provided
            if (param.allowedValues && param.allowedValues.length > 0) {
                result[param.name].allowedValues = param.allowedValues.map(v => 
                    this._formatParamValue(v, param.type));
            }
        });
        
        return result;
    },
    
    /**
     * Format parameter value based on type
     * @param {any} value - The parameter value
     * @param {string} type - Parameter type
     * @returns {any} - Formatted value
     */
    _formatParamValue(value, type) {
        switch (type) {
            case 'Integer':
                return parseInt(value, 10);
            case 'Boolean':
                return value === 'true' || value === true;
            case 'Array':
                try {
                    return typeof value === 'string' ? JSON.parse(value) : value;
                } catch (e) {
                    return [value];
                }
            case 'Object':
                try {
                    return typeof value === 'string' ? JSON.parse(value) : value;
                } catch (e) {
                    return {};
                }
            default:
                return value;
        }
    },
    
    /**
     * Generate policy definitions section
     * @param {Array} policies - Array of policy objects
     * @returns {Array} - Policy definitions array for initiative
     */
    _generatePolicyDefinitions(policies) {
        return policies.map((policy, index) => {
            const policyDefinition = {
                "policyDefinitionId": policy.id || `[resourceId('Microsoft.Authorization/policyDefinitions', '${policy.name}')]`,
                "policyDefinitionReferenceId": policy.referenceId || `policy${index + 1}`
            };
            
            // Add parameter values if provided
            if (policy.parameters && Object.keys(policy.parameters).length > 0) {
                policyDefinition.parameters = {};
                
                Object.entries(policy.parameters).forEach(([paramName, paramValue]) => {
                    // Check if the value is a reference to an initiative parameter
                    if (typeof paramValue === 'string' && paramValue.startsWith('[parameters(')) {
                        policyDefinition.parameters[paramName] = { "value": paramValue };
                    } else {
                        policyDefinition.parameters[paramName] = { "value": paramValue };
                    }
                });
            }
            
            return policyDefinition;
        });
    }
};