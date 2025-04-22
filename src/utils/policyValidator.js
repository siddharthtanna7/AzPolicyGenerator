/**
 * Azure Policy Validator
 * Validates Azure Policy definitions and Initiatives for common issues
 */
const PolicyValidator = {
    /**
     * Validate a policy definition
     * @param {Object} policy - The policy object to validate
     * @returns {Object} - Validation results
     */
    validatePolicy(policy) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            info: []
        };
        
        // Check if it's an initiative
        if (policy.properties && policy.properties.policyDefinitions) {
            return this.validateInitiative(policy);
        }
        
        // Validate required fields
        this._validateRequiredFields(policy, results);
        
        // Validate parameters
        if (policy.properties && policy.properties.parameters) {
            this._validateParameters(policy.properties.parameters, results);
        }
        
        // Validate policy rule
        if (policy.properties && policy.properties.policyRule) {
            this._validatePolicyRule(policy.properties.policyRule, results);
        }
        
        // Check if there are any errors (which would make the policy invalid)
        results.isValid = results.errors.length === 0;
        
        return results;
    },
    
    /**
     * Validate an initiative definition
     * @param {Object} initiative - The initiative object to validate
     * @returns {Object} - Validation results
     */
    validateInitiative(initiative) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            info: []
        };
        
        // Validate required fields
        this._validateInitiativeRequiredFields(initiative, results);
        
        // Validate parameters
        if (initiative.properties && initiative.properties.parameters) {
            this._validateParameters(initiative.properties.parameters, results);
        }
        
        // Validate policy definitions
        if (initiative.properties && initiative.properties.policyDefinitions) {
            this._validatePolicyDefinitions(initiative.properties.policyDefinitions, results);
        }
        
        // Check if there are any errors (which would make the initiative invalid)
        results.isValid = results.errors.length === 0;
        
        return results;
    },
    
    /**
     * Validate required fields in policy
     * @param {Object} policy - The policy object
     * @param {Object} results - Validation results
     */
    _validateRequiredFields(policy, results) {
        if (!policy.properties) {
            results.errors.push({
                code: 'MISSING_PROPERTIES',
                message: 'Missing properties field in policy',
                detail: 'The policy definition must have a properties field.',
                path: 'policy'
            });
            return;
        }
        
        // Check required fields in properties
        const requiredFields = ['displayName', 'policyRule'];
        requiredFields.forEach(field => {
            if (!policy.properties[field]) {
                results.errors.push({
                    code: 'MISSING_REQUIRED_FIELD',
                    message: `Missing required field: ${field}`,
                    detail: `The policy properties must include a ${field} field.`,
                    path: `properties.${field}`
                });
            }
        });
        
        // Check policy name length
        if (policy.properties.displayName && policy.properties.displayName.length > 128) {
            results.warnings.push({
                code: 'NAME_TOO_LONG',
                message: 'Policy name is too long',
                detail: 'Policy display name should be 128 characters or less.',
                path: 'properties.displayName'
            });
        }
        
        // Check description
        if (!policy.properties.description) {
            results.warnings.push({
                code: 'MISSING_DESCRIPTION',
                message: 'Missing description',
                detail: 'It is recommended to include a description for your policy.',
                path: 'properties.description'
            });
        }
        
        // Check policy mode
        const validModes = ['Indexed', 'All'];
        if (policy.properties.mode && !validModes.includes(policy.properties.mode)) {
            results.errors.push({
                code: 'INVALID_MODE',
                message: 'Invalid policy mode',
                detail: `Policy mode must be one of: ${validModes.join(', ')}`,
                path: 'properties.mode'
            });
        }
        
        // Check metadata
        if (!policy.properties.metadata) {
            results.warnings.push({
                code: 'MISSING_METADATA',
                message: 'Missing metadata',
                detail: 'It is recommended to include metadata for your policy.',
                path: 'properties.metadata'
            });
        }
        
        // Check category in metadata
        if (policy.properties.metadata && !policy.properties.metadata.category) {
            results.warnings.push({
                code: 'MISSING_CATEGORY',
                message: 'Missing category in metadata',
                detail: 'It is recommended to include a category in metadata for your policy.',
                path: 'properties.metadata.category'
            });
        }
        
        // Check version in metadata
        if (policy.properties.metadata && !policy.properties.metadata.version) {
            results.info.push({
                code: 'MISSING_VERSION',
                message: 'Missing version in metadata',
                detail: 'Consider adding a version in metadata for your policy.',
                path: 'properties.metadata.version'
            });
        }
    },
    
    /**
     * Validate required fields in initiative
     * @param {Object} initiative - The initiative object
     * @param {Object} results - Validation results
     */
    _validateInitiativeRequiredFields(initiative, results) {
        if (!initiative.properties) {
            results.errors.push({
                code: 'MISSING_PROPERTIES',
                message: 'Missing properties field in initiative',
                detail: 'The initiative definition must have a properties field.',
                path: 'initiative'
            });
            return;
        }
        
        // Check required fields in properties
        const requiredFields = ['displayName', 'policyDefinitions'];
        requiredFields.forEach(field => {
            if (!initiative.properties[field]) {
                results.errors.push({
                    code: 'MISSING_REQUIRED_FIELD',
                    message: `Missing required field: ${field}`,
                    detail: `The initiative properties must include a ${field} field.`,
                    path: `properties.${field}`
                });
            }
        });
        
        // Check initiative name length
        if (initiative.properties.displayName && initiative.properties.displayName.length > 128) {
            results.warnings.push({
                code: 'NAME_TOO_LONG',
                message: 'Initiative name is too long',
                detail: 'Initiative display name should be 128 characters or less.',
                path: 'properties.displayName'
            });
        }
        
        // Check description
        if (!initiative.properties.description) {
            results.warnings.push({
                code: 'MISSING_DESCRIPTION',
                message: 'Missing description',
                detail: 'It is recommended to include a description for your initiative.',
                path: 'properties.description'
            });
        }
        
        // Check metadata
        if (!initiative.properties.metadata) {
            results.warnings.push({
                code: 'MISSING_METADATA',
                message: 'Missing metadata',
                detail: 'It is recommended to include metadata for your initiative.',
                path: 'properties.metadata'
            });
        }
        
        // Check category in metadata
        if (initiative.properties.metadata && !initiative.properties.metadata.category) {
            results.warnings.push({
                code: 'MISSING_CATEGORY',
                message: 'Missing category in metadata',
                detail: 'It is recommended to include a category in metadata for your initiative.',
                path: 'properties.metadata.category'
            });
        }
        
        // Check version in metadata
        if (initiative.properties.metadata && !initiative.properties.metadata.version) {
            results.info.push({
                code: 'MISSING_VERSION',
                message: 'Missing version in metadata',
                detail: 'Consider adding a version in metadata for your initiative.',
                path: 'properties.metadata.version'
            });
        }
    },
    
    /**
     * Validate parameters in policy or initiative
     * @param {Object} parameters - The parameters object
     * @param {Object} results - Validation results
     */
    _validateParameters(parameters, results) {
        // Check each parameter
        Object.entries(parameters).forEach(([paramName, param]) => {
            // Check required fields
            if (!param.type) {
                results.errors.push({
                    code: 'MISSING_PARAM_TYPE',
                    message: `Missing type for parameter: ${paramName}`,
                    detail: 'All parameters must have a type field.',
                    path: `properties.parameters.${paramName}.type`
                });
            }
            
            // Check valid types
            const validTypes = ['String', 'Array', 'Object', 'Boolean', 'Integer', 'Float'];
            if (param.type && !validTypes.includes(param.type)) {
                results.errors.push({
                    code: 'INVALID_PARAM_TYPE',
                    message: `Invalid type for parameter: ${paramName}`,
                    detail: `Parameter type must be one of: ${validTypes.join(', ')}`,
                    path: `properties.parameters.${paramName}.type`
                });
            }
            
            // Check metadata
            if (!param.metadata) {
                results.warnings.push({
                    code: 'MISSING_PARAM_METADATA',
                    message: `Missing metadata for parameter: ${paramName}`,
                    detail: 'Parameters should include metadata with displayName and description.',
                    path: `properties.parameters.${paramName}.metadata`
                });
            } else {
                // Check for display name in metadata
                if (!param.metadata.displayName) {
                    results.warnings.push({
                        code: 'MISSING_PARAM_DISPLAY_NAME',
                        message: `Missing displayName for parameter: ${paramName}`,
                        detail: 'Parameters should include a displayName in metadata.',
                        path: `properties.parameters.${paramName}.metadata.displayName`
                    });
                }
                
                // Check for description in metadata
                if (!param.metadata.description) {
                    results.info.push({
                        code: 'MISSING_PARAM_DESCRIPTION',
                        message: `Missing description for parameter: ${paramName}`,
                        detail: 'Consider adding a description in metadata for this parameter.',
                        path: `properties.parameters.${paramName}.metadata.description`
                    });
                }
            }
            
            // Check allowed values
            if (param.allowedValues && !Array.isArray(param.allowedValues)) {
                results.errors.push({
                    code: 'INVALID_ALLOWED_VALUES',
                    message: `Invalid allowedValues for parameter: ${paramName}`,
                    detail: 'The allowedValues property must be an array.',
                    path: `properties.parameters.${paramName}.allowedValues`
                });
            }
            
            // Check default value type matches parameter type
            if (param.defaultValue !== undefined && param.type) {
                const defaultValueType = this._getValueType(param.defaultValue);
                if (!this._typeMatches(defaultValueType, param.type)) {
                    results.errors.push({
                        code: 'TYPE_MISMATCH',
                        message: `Type mismatch for parameter: ${paramName}`,
                        detail: `The defaultValue type (${defaultValueType}) does not match the parameter type (${param.type}).`,
                        path: `properties.parameters.${paramName}.defaultValue`
                    });
                }
            }
        });
    },
    
    /**
     * Validate policy rule
     * @param {Object} policyRule - The policy rule object
     * @param {Object} results - Validation results
     */
    _validatePolicyRule(policyRule, results) {
        // Check required fields
        if (!policyRule.if) {
            results.errors.push({
                code: 'MISSING_IF_CONDITION',
                message: 'Missing if condition in policy rule',
                detail: 'The policy rule must have an if condition.',
                path: 'properties.policyRule.if'
            });
        }
        
        if (!policyRule.then) {
            results.errors.push({
                code: 'MISSING_THEN_EFFECT',
                message: 'Missing then effect in policy rule',
                detail: 'The policy rule must have a then effect.',
                path: 'properties.policyRule.then'
            });
        }
        
        // Check if condition
        if (policyRule.if) {
            this._validateIfCondition(policyRule.if, results);
        }
        
        // Check then effect
        if (policyRule.then) {
            this._validateThenEffect(policyRule.then, results);
        }
    },
    
    /**
     * Validate policy definitions in an initiative
     * @param {Array} policyDefinitions - The policy definitions array
     * @param {Object} results - Validation results
     */
    _validatePolicyDefinitions(policyDefinitions, results) {
        // Check if policy definitions is an array
        if (!Array.isArray(policyDefinitions)) {
            results.errors.push({
                code: 'INVALID_POLICY_DEFINITIONS',
                message: 'Invalid policy definitions',
                detail: 'The policyDefinitions property must be an array.',
                path: 'properties.policyDefinitions'
            });
            return;
        }
        
        // Check if array is empty
        if (policyDefinitions.length === 0) {
            results.errors.push({
                code: 'EMPTY_POLICY_DEFINITIONS',
                message: 'Empty policy definitions',
                detail: 'The initiative must include at least one policy definition.',
                path: 'properties.policyDefinitions'
            });
            return;
        }
        
        // Check each policy definition
        policyDefinitions.forEach((policyDef, index) => {
            // Check policy definition ID
            if (!policyDef.policyDefinitionId) {
                results.errors.push({
                    code: 'MISSING_POLICY_ID',
                    message: `Missing policy definition ID at index ${index}`,
                    detail: 'Each policy definition must have a policyDefinitionId.',
                    path: `properties.policyDefinitions[${index}].policyDefinitionId`
                });
            }
            
            // Check reference ID
            if (!policyDef.policyDefinitionReferenceId) {
                results.warnings.push({
                    code: 'MISSING_REFERENCE_ID',
                    message: `Missing policy definition reference ID at index ${index}`,
                    detail: 'Each policy definition should have a policyDefinitionReferenceId for reference.',
                    path: `properties.policyDefinitions[${index}].policyDefinitionReferenceId`
                });
            }
            
            // Check parameters
            if (policyDef.parameters) {
                this._validatePolicyDefParameters(policyDef.parameters, index, results);
            }
        });
        
        // Check for duplicate reference IDs
        const referenceIds = policyDefinitions
            .filter(def => def.policyDefinitionReferenceId)
            .map(def => def.policyDefinitionReferenceId);
        
        const duplicateIds = referenceIds.filter((id, index) => referenceIds.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
            results.errors.push({
                code: 'DUPLICATE_REFERENCE_IDS',
                message: 'Duplicate policy definition reference IDs',
                detail: `The following reference IDs are used multiple times: ${duplicateIds.join(', ')}`,
                path: 'properties.policyDefinitions'
            });
        }
    },
    
    /**
     * Validate parameters in a policy definition within an initiative
     * @param {Object} parameters - The parameters object
     * @param {number} policyIndex - The index of the policy definition
     * @param {Object} results - Validation results
     */
    _validatePolicyDefParameters(parameters, policyIndex, results) {
        Object.entries(parameters).forEach(([paramName, param]) => {
            // Check if param has value property
            if (!param.hasOwnProperty('value')) {
                results.errors.push({
                    code: 'MISSING_PARAM_VALUE',
                    message: `Missing value for parameter '${paramName}' in policy definition at index ${policyIndex}`,
                    detail: 'Each parameter in a policy definition must have a value property.',
                    path: `properties.policyDefinitions[${policyIndex}].parameters.${paramName}`
                });
            }
        });
    },
    
    /**
     * Validate if condition
     * @param {Object} ifCondition - The if condition object
     * @param {Object} results - Validation results
     */
    _validateIfCondition(ifCondition, results) {
        // Check for empty if condition
        if (Object.keys(ifCondition).length === 0) {
            results.errors.push({
                code: 'EMPTY_IF_CONDITION',
                message: 'Empty if condition',
                detail: 'The if condition cannot be empty.',
                path: 'properties.policyRule.if'
            });
            return;
        }
        
        // Check for logical operators
        const logicalOperators = ['allOf', 'anyOf', 'not'];
        const hasLogicalOperator = logicalOperators.some(op => ifCondition[op]);
        
        // If using field directly, validate it
        if (ifCondition.field) {
            this._validateFieldCondition(ifCondition, results);
        }
        // If using allOf, validate each condition
        else if (ifCondition.allOf) {
            if (!Array.isArray(ifCondition.allOf)) {
                results.errors.push({
                    code: 'INVALID_ALLOF',
                    message: 'Invalid allOf condition',
                    detail: 'The allOf property must be an array of conditions.',
                    path: 'properties.policyRule.if.allOf'
                });
            } else {
                ifCondition.allOf.forEach((condition, index) => {
                    this._validateFieldCondition(condition, results, `properties.policyRule.if.allOf[${index}]`);
                });
            }
        }
        // If using anyOf, validate each condition
        else if (ifCondition.anyOf) {
            if (!Array.isArray(ifCondition.anyOf)) {
                results.errors.push({
                    code: 'INVALID_ANYOF',
                    message: 'Invalid anyOf condition',
                    detail: 'The anyOf property must be an array of conditions.',
                    path: 'properties.policyRule.if.anyOf'
                });
            } else {
                ifCondition.anyOf.forEach((condition, index) => {
                    this._validateFieldCondition(condition, results, `properties.policyRule.if.anyOf[${index}]`);
                });
            }
        }
        // If using not, validate its condition
        else if (ifCondition.not) {
            this._validateIfCondition(ifCondition.not, results);
        }
        // No logical operator or field, invalid condition
        else {
            results.errors.push({
                code: 'INVALID_IF_CONDITION',
                message: 'Invalid if condition',
                detail: 'The if condition must use field or a logical operator (allOf, anyOf, not).',
                path: 'properties.policyRule.if'
            });
        }
    },
    
    /**
     * Validate field condition
     * @param {Object} condition - The field condition object
     * @param {Object} results - Validation results
     * @param {string} basePath - Base path for the condition
     */
    _validateFieldCondition(condition, results, basePath = 'properties.policyRule.if') {
        // Check if field is present
        if (!condition.field) {
            results.errors.push({
                code: 'MISSING_FIELD',
                message: 'Missing field in condition',
                detail: 'Each condition must have a field property.',
                path: basePath
            });
            return;
        }
        
        // Check for operator
        const operators = [
            'equals', 'notEquals', 'contains', 'notContains',
            'in', 'notIn', 'like', 'notLike', 'exists', 'notExists',
            'less', 'lessOrEquals', 'greater', 'greaterOrEquals'
        ];
        
        let hasOperator = false;
        for (const op of operators) {
            if (condition[op] !== undefined) {
                hasOperator = true;
                break;
            }
        }
        
        if (!hasOperator && !condition.exists && !condition.notExists) {
            results.errors.push({
                code: 'MISSING_OPERATOR',
                message: 'Missing operator in condition',
                detail: `Each condition must have an operator (${operators.join(', ')}).`,
                path: `${basePath}.field`
            });
        }
    },
    
    /**
     * Validate then effect
     * @param {Object} thenEffect - The then effect object
     * @param {Object} results - Validation results
     */
    _validateThenEffect(thenEffect, results) {
        // Check if effect is present
        if (!thenEffect.effect) {
            results.errors.push({
                code: 'MISSING_EFFECT',
                message: 'Missing effect in then',
                detail: 'The then property must have an effect.',
                path: 'properties.policyRule.then.effect'
            });
            return;
        }
        
        // Check if effect is valid
        const validEffects = [
            'Audit', 'AuditIfNotExists', 'Deny', 'DeployIfNotExists',
            'Disabled', 'Modify', 'Append'
        ];
        
        // Check if it's a parameter reference
        const isParameterRef = typeof thenEffect.effect === 'string' && 
                             thenEffect.effect.startsWith('[parameters(');
        
        if (!isParameterRef && !validEffects.includes(thenEffect.effect)) {
            results.errors.push({
                code: 'INVALID_EFFECT',
                message: 'Invalid effect',
                detail: `The effect must be one of: ${validEffects.join(', ')} or a parameter reference.`,
                path: 'properties.policyRule.then.effect'
            });
        }
        
        // Check details for complex effects
        const effectsWithDetails = ['AuditIfNotExists', 'DeployIfNotExists'];
        if (effectsWithDetails.includes(thenEffect.effect) && !thenEffect.details) {
            results.errors.push({
                code: 'MISSING_EFFECT_DETAILS',
                message: `Missing details for ${thenEffect.effect} effect`,
                detail: `The ${thenEffect.effect} effect requires a details property.`,
                path: 'properties.policyRule.then.details'
            });
        }
    },
    
    /**
     * Get the type of a value
     * @param {any} value - The value to check
     * @returns {string} - The type of the value
     */
    _getValueType(value) {
        if (Array.isArray(value)) {
            return 'Array';
        }
        if (value === null) {
            return 'null';
        }
        if (typeof value === 'object') {
            return 'Object';
        }
        if (typeof value === 'boolean') {
            return 'Boolean';
        }
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'Integer' : 'Float';
        }
        return 'String';
    },
    
    /**
     * Check if a value type matches a parameter type
     * @param {string} valueType - The type of the value
     * @param {string} paramType - The parameter type
     * @returns {boolean} - Whether the types match
     */
    _typeMatches(valueType, paramType) {
        // Exact match
        if (valueType === paramType) {
            return true;
        }
        
        // Integer or Float can be used for Float or Integer parameters
        if ((valueType === 'Integer' || valueType === 'Float') && 
            (paramType === 'Integer' || paramType === 'Float')) {
            return true;
        }
        
        // String can be anything because we'll convert it
        if (paramType === 'String') {
            return true;
        }
        
        return false;
    }
};

// Export for Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolicyValidator;
}