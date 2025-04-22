/**
 * Azure Policy Generator
 * Utility for generating Azure Policy definitions
 */
const PolicyGenerator = {
    /**
     * Generate a complete Azure Policy definition
     * @param {Object} options - Policy configuration options
     * @returns {Object} - Complete policy JSON
     */
    generatePolicy(options) {
        // Validate required fields
        if (!options.name) {
            throw new Error('Policy name is required');
        }
        
        // Build policy structure
        const policy = {
            "properties": {
                "displayName": options.name,
                "description": options.description || '',
                "mode": options.mode || 'Indexed',
                "parameters": this._generateParameters(options.parameters || []),
                "policyRule": this._generatePolicyRule(options)
            }
        };
        
        // Add metadata if provided
        if (options.metadata && options.metadata.category) {
            policy.properties.metadata = {
                "category": options.metadata.category,
                "version": options.metadata.version || "1.0.0"
            };
        }
        
        return policy;
    },
    
    /**
     * Generate policy parameters section
     * @param {Array} parameters - Array of parameter objects
     * @returns {Object} - Parameters object for policy
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
     * Generate policy rule section
     * @param {Object} options - Policy options
     * @returns {Object} - Policy rule object
     */
    _generatePolicyRule(options) {
        const effect = options.effect || 'Audit';
        
        // Build the if (condition) part
        let ifCondition;
        
        // Handle both the old conditions array and the new nested structure
        if (options.conditionStructure) {
            // Use the new format from conditionBuilder
            ifCondition = this._processNestedConditions(options.conditionStructure);
        } else {
            // Use the old array format for backward compatibility
            const conditions = options.conditions || [];
            ifCondition = this._buildConditions(conditions);
        }
        
        // If no conditions are specified, use a simple condition
        if (!ifCondition || Object.keys(ifCondition).length === 0) {
            ifCondition = {
                "field": "type",
                "equals": "Microsoft.Resources/subscriptions/resourceGroups"
            };
        }
        
        // Build the then (effect) part
        const thenEffect = this._buildEffect(effect, options);
        
        return {
            "if": ifCondition,
            "then": thenEffect
        };
    },
    
    /**
     * Process nested conditions structure into Azure Policy format
     * @param {Object} conditionStructure - Nested condition structure
     * @returns {Object} - Azure Policy condition object
     */
    _processNestedConditions(conditionStructure) {
        // If it's a simple condition with a field
        if (conditionStructure.field) {
            return {
                "field": conditionStructure.field,
                [conditionStructure.operator]: conditionStructure.value
            };
        }
        
        // Process logical operators (allOf/anyOf)
        if (conditionStructure.allOf || conditionStructure.anyOf) {
            const operator = conditionStructure.allOf ? 'allOf' : 'anyOf';
            const conditions = conditionStructure[operator];
            
            return {
                [operator]: conditions.map(condition => this._processNestedConditions(condition))
            };
        }
        
        // Fallback for unexpected structure
        return {
            "field": "type",
            "equals": "Microsoft.Resources/subscriptions/resourceGroups"
        };
    },
    
    /**
     * Build policy conditions from UI inputs (legacy format)
     * @param {Array} conditions - Array of condition objects
     * @returns {Object} - Policy condition object
     */
    _buildConditions(conditions) {
        if (!conditions || conditions.length === 0) {
            return {};
        }
        
        // For single condition
        if (conditions.length === 1) {
            const condition = conditions[0];
            return {
                "field": condition.field,
                [condition.operator]: condition.value
            };
        }
        
        // For multiple conditions (AND logic)
        return {
            "allOf": conditions.map(condition => ({
                "field": condition.field,
                [condition.operator]: condition.value
            }))
        };
    },
    
    /**
     * Build the effect part of the policy
     * @param {string} effect - The policy effect
     * @param {Object} options - Additional options for complex effects
     * @returns {Object} - Effect object
     */
    _buildEffect(effect, options) {
        // For simple effects
        if (['Audit', 'Deny', 'Disabled'].includes(effect)) {
            return { "effect": effect };
        }
        
        // For parameterized effect
        if (options.effectIsParameter) {
            return { "effect": `[parameters('${options.effectParameterName || 'effect'}')]` };
        }
        
        // For complex effects like AuditIfNotExists or DeployIfNotExists
        if (['AuditIfNotExists', 'DeployIfNotExists', 'Modify'].includes(effect)) {
            const effectDetails = {
                "effect": effect,
                "details": {}
            };
            
            if (['AuditIfNotExists', 'DeployIfNotExists'].includes(effect)) {
                effectDetails.details = {
                    "type": options.existenceScope || "Microsoft.Resources/resourceGroups",
                    "existenceCondition": options.existenceCondition || {
                        "field": "tags.environment",
                        "equals": "[parameters('requiredTag')]"
                    }
                };
                
                // Add deployment details for DeployIfNotExists
                if (effect === 'DeployIfNotExists' && options.deploymentTemplate) {
                    effectDetails.details.roleDefinitionIds = [
                        "/providers/microsoft.authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"  // Contributor role by default
                    ];
                    effectDetails.details.deployment = {
                        "properties": {
                            "mode": "incremental",
                            "template": options.deploymentTemplate || {
                                "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
                                "contentVersion": "1.0.0.0",
                                "parameters": {},
                                "resources": []
                            }
                        }
                    };
                }
            } else if (effect === 'Modify') {
                effectDetails.details = {
                    "operations": options.modifyOperations || [
                        {
                            "operation": "addOrReplace",
                            "field": "tags.environment",
                            "value": "[parameters('tagValue')]"
                        }
                    ]
                };
            }
            
            return effectDetails;
        }
        
        // Default fallback
        return { "effect": effect };
    }
};

// Export for Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolicyGenerator;
}