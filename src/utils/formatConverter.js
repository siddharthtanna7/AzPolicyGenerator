/**
 * Format Converter for Azure Policies
 * Converts policy JSON to various formats
 */
const FormatConverter = {
    /**
     * Convert policy JSON to Bicep format
     * @param {Object} policy - The policy JSON object
     * @returns {string} - Bicep template
     */
    toBicep(policy) {
        // Start with header
        let bicep = '// Azure Policy Definition in Bicep format\n\n';
        
        // Add parameters
        bicep += 'param policyName string = \'${policy.properties.displayName}\'\n';
        bicep += 'param policyDescription string = \'${policy.properties.description}\'\n\n';
        
        // Add resource definition
        bicep += 'resource policyDefinition \'Microsoft.Authorization/policyDefinitions@2021-06-01\' = {\n';
        bicep += '  name: policyName\n';
        bicep += '  properties: {\n';
        bicep += `    displayName: policyName\n`;
        bicep += `    description: policyDescription\n`;
        bicep += `    mode: '${policy.properties.mode || 'Indexed'}'\n\n`;
        
        // Add metadata
        if (policy.properties.metadata) {
            bicep += '    metadata: {\n';
            Object.entries(policy.properties.metadata).forEach(([key, value]) => {
                bicep += `      ${key}: '${value}'\n`;
            });
            bicep += '    }\n\n';
        }
        
        // Add parameters
        if (policy.properties.parameters && Object.keys(policy.properties.parameters).length > 0) {
            bicep += '    parameters: {\n';
            Object.entries(policy.properties.parameters).forEach(([paramName, param]) => {
                bicep += `      ${paramName}: {\n`;
                bicep += `        type: '${param.type}'\n`;
                
                // Add metadata if present
                if (param.metadata) {
                    bicep += '        metadata: {\n';
                    if (param.metadata.displayName) {
                        bicep += `          displayName: '${param.metadata.displayName}'\n`;
                    }
                    if (param.metadata.description) {
                        bicep += `          description: '${param.metadata.description}'\n`;
                    }
                    bicep += '        }\n';
                }
                
                // Add defaultValue if present
                if (param.defaultValue !== undefined) {
                    const formattedValue = this._formatBicepValue(param.defaultValue, param.type);
                    bicep += `        defaultValue: ${formattedValue}\n`;
                }
                
                // Add allowedValues if present
                if (param.allowedValues && param.allowedValues.length > 0) {
                    bicep += '        allowedValues: [\n';
                    param.allowedValues.forEach((value, index) => {
                        const formattedValue = this._formatBicepValue(value, param.type);
                        bicep += `          ${formattedValue}${index < param.allowedValues.length - 1 ? ',' : ''}\n`;
                    });
                    bicep += '        ]\n';
                }
                
                bicep += '      }\n';
            });
            bicep += '    }\n\n';
        }
        
        // Add policy rule
        bicep += '    policyRule: {\n';
        
        // Add if condition
        bicep += '      if: ';
        bicep += this._formatBicepCondition(policy.properties.policyRule.if);
        bicep += '\n';
        
        // Add then effect
        bicep += '      then: ';
        bicep += this._formatBicepEffect(policy.properties.policyRule.then);
        bicep += '\n';
        
        // Close policy rule
        bicep += '    }\n';
        
        // Close resource
        bicep += '  }\n';
        bicep += '}\n\n';
        
        // Add output
        bicep += '// Policy Definition ID\n';
        bicep += 'output policyDefinitionId string = policyDefinition.id\n';
        
        return bicep;
    },
    
    /**
     * Convert policy JSON to Azure CLI commands
     * @param {Object} policy - The policy JSON object
     * @returns {string} - Azure CLI commands
     */
    toAzureCLI(policy) {
        // Save policy to file
        let cli = '#!/bin/bash\n\n';
        cli += '# Create a policy definition using Azure CLI\n\n';
        
        // Create variable for policy name (safe for shell)
        const safePolicyName = policy.properties.displayName.replace(/[^a-zA-Z0-9]/g, '-');
        
        cli += `# Set variables\n`;
        cli += `POLICY_NAME="${safePolicyName}"\n`;
        cli += `POLICY_DISPLAY_NAME="${policy.properties.displayName}"\n`;
        cli += `POLICY_DESCRIPTION="${policy.properties.description || ''}"\n`;
        cli += `POLICY_MODE="${policy.properties.mode || 'Indexed'}"\n\n`;
        
        // Save policy JSON to file
        cli += `# Save policy to file\n`;
        cli += `cat > policy.json << EOF\n`;
        cli += JSON.stringify(policy, null, 2);
        cli += `\nEOF\n\n`;
        
        // Create policy definition
        cli += `# Create policy definition\n`;
        cli += `az policy definition create \\\n`;
        cli += `  --name "$POLICY_NAME" \\\n`;
        cli += `  --display-name "$POLICY_DISPLAY_NAME" \\\n`;
        cli += `  --description "$POLICY_DESCRIPTION" \\\n`;
        cli += `  --mode "$POLICY_MODE" \\\n`;
        
        // If we have metadata, extract category
        if (policy.properties.metadata && policy.properties.metadata.category) {
            cli += `  --metadata "category=${policy.properties.metadata.category}" \\\n`;
        }
        
        cli += `  --rules policy.json\n\n`;
        
        // Optional: add assignment example
        cli += `# Optional: Assign policy (example)\n`;
        cli += `# Scope: specify subscription, resource group, etc.\n`;
        cli += `# SCOPE=$(az account show --query id --output tsv)\n`;
        cli += `# az policy assignment create \\\n`;
        cli += `#   --name "$POLICY_NAME-assignment" \\\n`;
        cli += `#   --display-name "$POLICY_DISPLAY_NAME Assignment" \\\n`;
        cli += `#   --scope "$SCOPE" \\\n`;
        cli += `#   --policy "$POLICY_NAME"\n`;
        
        return cli;
    },
    
    /**
     * Format a value for Bicep based on its type
     * @param {any} value - The value to format
     * @param {string} type - The parameter type
     * @returns {string} - Formatted Bicep value
     */
    _formatBicepValue(value, type) {
        if (value === undefined || value === null) {
            return 'null';
        }
        
        switch (type) {
            case 'String':
                return `'${value}'`;
            case 'Array':
                if (typeof value === 'string') {
                    try {
                        // Try to parse as JSON
                        const parsed = JSON.parse(value);
                        return this._formatBicepArray(parsed);
                    } catch (e) {
                        // Return as single item array if it's not valid JSON
                        return `['${value}']`;
                    }
                }
                return this._formatBicepArray(value);
            case 'Object':
                if (typeof value === 'string') {
                    try {
                        // Try to parse as JSON
                        const parsed = JSON.parse(value);
                        return this._formatBicepObject(parsed);
                    } catch (e) {
                        // Return empty object if it's not valid JSON
                        return '{}';
                    }
                }
                return this._formatBicepObject(value);
            case 'Boolean':
                return value === 'true' || value === true ? 'true' : 'false';
            case 'Integer':
            case 'Float':
                return String(value);
            default:
                return `'${value}'`;
        }
    },
    
    /**
     * Format an array for Bicep
     * @param {Array} array - The array to format
     * @returns {string} - Formatted Bicep array
     */
    _formatBicepArray(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return '[]';
        }
        
        let result = '[\n';
        
        array.forEach((item, index) => {
            if (typeof item === 'string') {
                result += `    '${item}'`;
            } else if (typeof item === 'number') {
                result += `    ${item}`;
            } else if (typeof item === 'boolean') {
                result += `    ${item}`;
            } else if (item === null) {
                result += '    null';
            } else if (Array.isArray(item)) {
                result += `    ${this._formatBicepArray(item)}`;
            } else if (typeof item === 'object') {
                result += `    ${this._formatBicepObject(item)}`;
            }
            
            if (index < array.length - 1) {
                result += ',';
            }
            
            result += '\n';
        });
        
        result += '  ]';
        return result;
    },
    
    /**
     * Format an object for Bicep
     * @param {Object} obj - The object to format
     * @returns {string} - Formatted Bicep object
     */
    _formatBicepObject(obj) {
        if (typeof obj !== 'object' || obj === null || Object.keys(obj).length === 0) {
            return '{}';
        }
        
        let result = '{\n';
        
        Object.entries(obj).forEach(([key, value], index) => {
            result += `    ${key}: `;
            
            if (typeof value === 'string') {
                result += `'${value}'`;
            } else if (typeof value === 'number') {
                result += value;
            } else if (typeof value === 'boolean') {
                result += value;
            } else if (value === null) {
                result += 'null';
            } else if (Array.isArray(value)) {
                result += this._formatBicepArray(value);
            } else if (typeof value === 'object') {
                result += this._formatBicepObject(value);
            }
            
            if (index < Object.keys(obj).length - 1) {
                result += ',';
            }
            
            result += '\n';
        });
        
        result += '  }';
        return result;
    },
    
    /**
     * Format a condition for Bicep
     * @param {Object} condition - The condition object
     * @returns {string} - Formatted Bicep condition
     */
    _formatBicepCondition(condition) {
        if (!condition || Object.keys(condition).length === 0) {
            return '{}';
        }
        
        if (condition.field) {
            return this._formatBicepObject(condition);
        }
        
        // Handle logical operators
        if (condition.allOf || condition.anyOf || condition.not) {
            return this._formatBicepObject(condition);
        }
        
        return '{}';
    },
    
    /**
     * Format an effect for Bicep
     * @param {Object} effect - The effect object
     * @returns {string} - Formatted Bicep effect
     */
    _formatBicepEffect(effect) {
        if (!effect || Object.keys(effect).length === 0) {
            return '{}';
        }
        
        return this._formatBicepObject(effect);
    }
};