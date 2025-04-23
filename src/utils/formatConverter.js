/**
 * Format Converter for Azure Policies
 * Converts policy JSON to various formats including Bicep, Terraform, and Azure CLI
 */
const FormatConverter = {
    /**
     * Convert policy JSON to Bicep format
     * @param {Object} policy - The policy JSON object
     * @returns {string} - Bicep template
     */
    toBicep(policy) {
        try {
            // Validate input
            if (!policy || !policy.properties) {
                throw new Error('Invalid policy object');
            }
            
            const properties = policy.properties;
            
            // Start with header
            let bicep = '// Azure Policy Definition in Bicep format\n\n';
            
            // Safely extract displayName and description
            const displayName = properties.displayName || 'Azure Policy';
            const description = properties.description || 'Generated policy';
            
            // Add parameters with proper string escaping
            bicep += `param policyName string = '${this._escapeBicepString(displayName)}'\n`;
            bicep += `param policyDescription string = '${this._escapeBicepString(description)}'\n\n`;
            
            // Add resource definition
            bicep += 'resource policyDefinition \'Microsoft.Authorization/policyDefinitions@2021-06-01\' = {\n';
            bicep += '  name: policyName\n';
            bicep += '  properties: {\n';
            bicep += `    displayName: policyName\n`;
            bicep += `    description: policyDescription\n`;
            bicep += `    mode: '${properties.mode || 'Indexed'}'\n\n`;
            
            // Add metadata safely
            if (properties.metadata && typeof properties.metadata === 'object') {
                bicep += '    metadata: {\n';
                try {
                    Object.entries(properties.metadata).forEach(([key, value]) => {
                        // Handle different value types (string, number, boolean)
                        if (typeof value === 'string') {
                            bicep += `      ${key}: '${this._escapeBicepString(value)}'\n`;
                        } else if (typeof value === 'number' || typeof value === 'boolean') {
                            bicep += `      ${key}: ${value}\n`;
                        } else if (value === null) {
                            bicep += `      ${key}: null\n`;
                        } else if (typeof value === 'object') {
                            // For complex objects, use JSON string
                            bicep += `      ${key}: ${JSON.stringify(value)}\n`;
                        }
                    });
                } catch (e) {
                    console.warn('Error processing metadata:', e);
                    bicep += '      category: \'General\'\n';
                }
                bicep += '    }\n\n';
            }
            
            // Add parameters with careful error handling
            if (properties.parameters && Object.keys(properties.parameters).length > 0) {
                bicep += '    parameters: {\n';
                try {
                    Object.entries(properties.parameters).forEach(([paramName, param]) => {
                        if (!param) return; // Skip null/undefined parameters
                        
                        bicep += `      ${paramName}: {\n`;
                        bicep += `        type: '${param.type || 'String'}'\n`;
                        
                        // Add metadata if present
                        if (param.metadata && typeof param.metadata === 'object') {
                            bicep += '        metadata: {\n';
                            if (param.metadata.displayName) {
                                bicep += `          displayName: '${this._escapeBicepString(param.metadata.displayName)}'\n`;
                            }
                            if (param.metadata.description) {
                                bicep += `          description: '${this._escapeBicepString(param.metadata.description)}'\n`;
                            }
                            bicep += '        }\n';
                        }
                        
                        // Add defaultValue if present
                        if (param.defaultValue !== undefined) {
                            try {
                                const formattedValue = this._formatBicepValue(param.defaultValue, param.type);
                                bicep += `        defaultValue: ${formattedValue}\n`;
                            } catch (e) {
                                console.warn(`Error formatting defaultValue for parameter ${paramName}:`, e);
                                // Add a safe default value based on type
                                if (param.type === 'String') {
                                    bicep += `        defaultValue: ''\n`;
                                } else if (param.type === 'Array') {
                                    bicep += `        defaultValue: []\n`;
                                } else if (param.type === 'Object') {
                                    bicep += `        defaultValue: {}\n`;
                                } else if (param.type === 'Boolean') {
                                    bicep += `        defaultValue: false\n`;
                                } else if (param.type === 'Integer') {
                                    bicep += `        defaultValue: 0\n`;
                                }
                            }
                        }
                        
                        // Add allowedValues if present, with error handling
                        if (param.allowedValues && Array.isArray(param.allowedValues) && param.allowedValues.length > 0) {
                            bicep += '        allowedValues: [\n';
                            try {
                                param.allowedValues.forEach((value, index) => {
                                    const formattedValue = this._formatBicepValue(value, param.type);
                                    bicep += `          ${formattedValue}${index < param.allowedValues.length - 1 ? ',' : ''}\n`;
                                });
                            } catch (e) {
                                console.warn(`Error formatting allowedValues for parameter ${paramName}:`, e);
                                bicep += `          // Error formatting allowed values\n`;
                            }
                            bicep += '        ]\n';
                        }
                        
                        bicep += '      }\n';
                    });
                } catch (e) {
                    console.warn('Error processing parameters:', e);
                    bicep += '      // Error processing parameters\n';
                }
                bicep += '    }\n\n';
            }
            
            // Add policy rule with defensive programming
            bicep += '    policyRule: {\n';
            
            // Make sure we have valid conditions
            if (properties.policyRule && properties.policyRule.if) {
                // Add if condition
                bicep += '      if: ';
                try {
                    bicep += this._formatBicepCondition(properties.policyRule.if);
                } catch (e) {
                    console.warn('Error formatting policy condition:', e);
                    bicep += '{ field: \'type\', equals: \'Microsoft.Resources/resourceGroups\' }';
                }
                bicep += '\n';
                
                // Add then effect
                bicep += '      then: ';
                try {
                    if (properties.policyRule.then) {
                        bicep += this._formatBicepEffect(properties.policyRule.then);
                    } else {
                        bicep += '{ effect: \'Audit\' }';
                    }
                } catch (e) {
                    console.warn('Error formatting policy effect:', e);
                    bicep += '{ effect: \'Audit\' }';
                }
                bicep += '\n';
            } else {
                // Default policy rule if none exists
                bicep += '      if: { field: \'type\', equals: \'Microsoft.Resources/resourceGroups\' }\n';
                bicep += '      then: { effect: \'Audit\' }\n';
            }
            
            // Close policy rule
            bicep += '    }\n';
            
            // Close resource
            bicep += '  }\n';
            bicep += '}\n\n';
            
            // Add output
            bicep += '// Policy Definition ID\n';
            bicep += 'output policyDefinitionId string = policyDefinition.id\n';
            
            return bicep;
        } catch (e) {
            console.error('Error generating Bicep:', e);
            // Return a basic error template instead of throwing
            return `// Error generating Bicep: ${e.message}
// Basic Azure Policy Definition template:

param policyName string = 'ErrorPolicy'
param policyDescription string = 'Error occurred during conversion'

resource policyDefinition 'Microsoft.Authorization/policyDefinitions@2021-06-01' = {
  name: policyName
  properties: {
    displayName: policyName
    description: policyDescription
    mode: 'Indexed'
    policyRule: {
      if: {
        field: 'type'
        equals: 'Microsoft.Resources/resourceGroups'
      }
      then: {
        effect: 'audit'
      }
    }
  }
}

output policyDefinitionId string = policyDefinition.id`;
        }
    },
    
    /**
     * Escape string for Bicep
     * @param {string} str - The string to escape
     * @returns {string} - Escaped string
     */
    _escapeBicepString(str) {
        if (!str) return '';
        return str
            .replace(/'/g, '\\\'')     // Escape single quotes
            .replace(/\r?\n/g, ' ');   // Replace newlines with spaces
    },
    
    /**
     * Convert policy JSON to Terraform HCL format
     * @param {Object} policy - The policy JSON object
     * @returns {string} - Terraform configuration
     */
    toTerraform(policy) {
        // Validate input
        if (!policy || !policy.properties) {
            throw new Error('Invalid policy object');
        }
        
        try {
            // Get policy properties
            const properties = policy.properties;
            
            // Generate a safe name for Terraform resources
            const safeName = properties.displayName
                ? properties.displayName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                : 'azure_policy';
                
            // Ensure we have a valid name
            const resourceName = safeName || 'azure_policy';
            
            // Prepare policy_rule and parameters as JSON string - handle null or undefined cases
            let policyRule = '{}';
            if (properties.policyRule) {
                try {
                    // If it's already a string, use it, otherwise stringify the object
                    if (typeof properties.policyRule === 'string') {
                        policyRule = properties.policyRule;
                    } else {
                        policyRule = JSON.stringify(properties.policyRule, null, 2);
                    }
                } catch (e) {
                    console.warn('Error stringifying policy rule:', e);
                    policyRule = '{}';
                }
            }
            
            // Handle parameters similarly
            let parameters = null;
            if (properties.parameters && Object.keys(properties.parameters).length > 0) {
                try {
                    if (typeof properties.parameters === 'string') {
                        parameters = properties.parameters;
                    } else {
                        parameters = JSON.stringify(properties.parameters, null, 2);
                    }
                } catch (e) {
                    console.warn('Error stringifying parameters:', e);
                    parameters = null;
                }
            }
                
            // Start building Terraform configuration
            let terraform = '# Terraform Azure Policy Definition\n\n';
            
            // Add provider block
            terraform += 'terraform {\n';
            terraform += '  required_providers {\n';
            terraform += '    azurerm = {\n';
            terraform += '      source  = "hashicorp/azurerm"\n';
            terraform += '      version = ">=3.0.0"\n';
            terraform += '    }\n';
            terraform += '  }\n';
            terraform += '}\n\n';
            
            terraform += 'provider "azurerm" {\n';
            terraform += '  features {}\n';
            terraform += '}\n\n';
            
            // Add variables
            terraform += 'variable "management_group_id" {\n';
            terraform += '  type        = string\n';
            terraform += '  description = "The management group ID where the policy will be defined (optional)"\n';
            terraform += '  default     = null\n';
            terraform += '}\n\n';
            
            // Add policy definition resource
            terraform += `resource "azurerm_policy_definition" "${resourceName}" {\n`;
            terraform += `  name         = "${resourceName}"\n`;
            terraform += `  policy_type  = "Custom"\n`;
            terraform += `  mode         = "${properties.mode || 'Indexed'}"\n`;
            
            // Safely add display name with proper escaping
            const displayName = properties.displayName || resourceName;
            terraform += `  display_name = "${this._escapeString(displayName)}"\n`;
            
            // Add description if available
            if (properties.description) {
                terraform += `  description  = "${this._escapeString(properties.description)}"\n`;
            }
            
            // Add metadata if available
            if (properties.metadata) {
                // Ensure metadata is properly formatted
                let metadataStr;
                try {
                    metadataStr = typeof properties.metadata === 'string' 
                        ? properties.metadata 
                        : JSON.stringify(properties.metadata, null, 2);
                    
                    terraform += `  metadata     = <<METADATA\n`;
                    terraform += metadataStr;
                    terraform += `\nMETADATA\n`;
                } catch (e) {
                    console.warn('Error formatting metadata, skipping:', e);
                }
            }
            
            // Add policy rule
            terraform += `  policy_rule  = <<POLICY_RULE\n`;
            terraform += policyRule;
            terraform += `\nPOLICY_RULE\n`;
            
            // Add parameters if available
            if (parameters) {
                terraform += `  parameters   = <<PARAMETERS\n`;
                terraform += parameters;
                terraform += `\nPARAMETERS\n`;
            }
            
            // Add optional management group scope
            terraform += '  management_group_id = var.management_group_id\n';
            
            terraform += '}\n\n';
            
            // Add output
            terraform += '# Output the Policy Definition ID\n';
            terraform += `output "${resourceName}_policy_id" {\n`;
            terraform += `  value = azurerm_policy_definition.${resourceName}.id\n`;
            terraform += '}\n\n';
            
            // Example policy assignment (commented out)
            terraform += '# Example Policy Assignment (uncomment to use)\n';
            terraform += '# resource "azurerm_management_group_policy_assignment" "example" {\n';
            terraform += `#   name                 = "${resourceName}_assignment"\n`;
            terraform += '#   management_group_id  = var.management_group_id\n';
            terraform += `#   policy_definition_id = azurerm_policy_definition.${resourceName}.id\n`;
            terraform += '# }\n';
            
            return terraform;
        } catch (e) {
            console.error('Error generating Terraform:', e);
            // Return a basic error template instead of throwing
            return `# Error generating Terraform
# ${e.message}

# Basic policy template:
resource "azurerm_policy_definition" "error_policy" {
  name         = "error_policy"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Error occurred during conversion"
  
  policy_rule  = <<POLICY_RULE
{
  "if": {
    "field": "type",
    "equals": "Microsoft.Resources/subscriptions/resourceGroups"
  },
  "then": {
    "effect": "audit"
  }
}
POLICY_RULE
}`;
        }
    },

    /**
     * Escape special characters in a string for Terraform
     * @param {string} str - The string to escape
     * @returns {string} - Escaped string
     */
    _escapeString(str) {
        if (!str) return '';
        if (typeof str !== 'string') {
            // Convert to string if it's not already one
            try {
                str = String(str);
            } catch (e) {
                console.warn('Failed to convert value to string:', e);
                return '';
            }
        }
        
        return str
            .replace(/\\/g, '\\\\')   // Escape backslashes
            .replace(/"/g, '\\"')     // Escape double quotes
            .replace(/\$/g, '\\$')    // Escape dollar signs for Terraform
            .replace(/\r?\n/g, ' ')   // Replace newlines with spaces
            .replace(/\t/g, ' ');     // Replace tabs with spaces
    },
    
    /**
     * Convert policy JSON to Azure CLI commands
     * @param {Object} policy - The policy JSON object
     * @returns {string} - Azure CLI commands
     */
    toAzureCLI(policy) {
        try {
            // Validate input
            if (!policy || !policy.properties) {
                throw new Error('Invalid policy object');
            }
            
            const properties = policy.properties;
            
            // Save policy to file
            let cli = '#!/bin/bash\n\n';
            cli += '# Create a policy definition using Azure CLI\n\n';
            
            // Create variable for policy name (safe for shell)
            const displayName = properties.displayName || 'AzurePolicy';
            const safePolicyName = displayName.replace(/[^a-zA-Z0-9]/g, '-');
            
            // Create escape function for shell
            const escapeForShell = (str) => {
                if (!str) return '';
                if (typeof str !== 'string') {
                    try {
                        str = String(str);
                    } catch (e) {
                        console.warn('Failed to convert value to string for shell:', e);
                        return '';
                    }
                }
                return str
                    .replace(/"/g, '\\"')       // Escape double quotes
                    .replace(/\$/g, '\\$')      // Escape dollar signs
                    .replace(/`/g, '\\`')       // Escape backticks
                    .replace(/\r?\n/g, ' ');    // Replace newlines with spaces
            };
            
            cli += `# Set variables\n`;
            cli += `POLICY_NAME="${safePolicyName}"\n`;
            cli += `POLICY_DISPLAY_NAME="${escapeForShell(displayName)}"\n`;
            cli += `POLICY_DESCRIPTION="${escapeForShell(properties.description || '')}"\n`;
            cli += `POLICY_MODE="${properties.mode || 'Indexed'}"\n\n`;
            
            // Save policy rule to file with enhanced error handling
            cli += `# Save policy to file\n`;
            cli += `cat > policy.json << 'EOF'\n`; // Using single quotes to avoid variable expansion
            try {
                // For CLI, we need to extract just the policyRule part
                const policyRuleObj = properties.policyRule || {
                    if: { field: 'type', equals: 'Microsoft.Resources/resourceGroups' },
                    then: { effect: 'audit' }
                };
                
                cli += JSON.stringify(policyRuleObj, null, 2);
            } catch (e) {
                console.error('Error stringifying policy rule for CLI:', e);
                // Create a minimal valid policy rule
                cli += JSON.stringify({
                    if: { field: 'type', equals: 'Microsoft.Resources/resourceGroups' },
                    then: { effect: 'audit' }
                }, null, 2);
            }
            cli += `\nEOF\n\n`;
            
            // Save parameters to file if they exist
            if (properties.parameters && Object.keys(properties.parameters).length > 0) {
                cli += `# Save parameters to file\n`;
                cli += `cat > parameters.json << 'EOF'\n`;
                try {
                    cli += JSON.stringify(properties.parameters, null, 2);
                } catch (e) {
                    console.error('Error stringifying parameters for CLI:', e);
                    cli += JSON.stringify({}, null, 2);
                }
                cli += `\nEOF\n\n`;
            }
            
            // Create policy definition
            cli += `# Create policy definition\n`;
            cli += `az policy definition create \\\n`;
            cli += `  --name "$POLICY_NAME" \\\n`;
            cli += `  --display-name "$POLICY_DISPLAY_NAME" \\\n`;
            cli += `  --description "$POLICY_DESCRIPTION" \\\n`;
            cli += `  --mode "$POLICY_MODE" \\\n`;
            
            // If we have metadata, safely extract category
            if (properties.metadata) {
                try {
                    let category = '';
                    if (typeof properties.metadata === 'string') {
                        // Try to parse if it's a string
                        const metadataObj = JSON.parse(properties.metadata);
                        if (metadataObj && metadataObj.category) {
                            category = metadataObj.category;
                        }
                    } else if (properties.metadata && properties.metadata.category) {
                        category = properties.metadata.category;
                    }
                    
                    if (category) {
                        cli += `  --metadata "category=${escapeForShell(category)}" \\\n`;
                    }
                } catch (e) {
                    console.warn('Error processing metadata for CLI:', e);
                }
            }
            
            // Add parameters if they exist
            if (properties.parameters && Object.keys(properties.parameters).length > 0) {
                cli += `  --params parameters.json \\\n`;
            }
            
            cli += `  --rules policy.json\n\n`;
            
            // Add assignment examples
            if (properties.parameters && Object.keys(properties.parameters).length > 0) {
                cli += `# Example: Assign policy with parameters\n`;
                cli += `# az policy assignment create \\\n`;
                cli += `#   --name "$POLICY_NAME-assignment" \\\n`;
                cli += `#   --display-name "$POLICY_DISPLAY_NAME Assignment" \\\n`;
                cli += `#   --policy "$POLICY_NAME" \\\n`;
                
                // Add some example parameters
                let paramExample = '';
                try {
                    const paramNames = Object.keys(properties.parameters);
                    if (paramNames.length > 0) {
                        paramExample = `#   --params "{\\"${paramNames[0]}\\":\\"YourValueHere\\"`;
                        if (paramNames.length > 1) {
                            paramExample += `, \\"${paramNames[1]}\\":\\"AnotherValue\\"`;
                        }
                        paramExample += `}" \\\n`;
                        cli += paramExample;
                    }
                } catch (e) {
                    console.warn('Error creating parameter examples:', e);
                }
                
                cli += `#   --scope "/subscriptions/{subscriptionId}"\n\n`;
            } else {
                // Basic assignment example
                cli += `# Example: Assign policy (no parameters)\n`;
                cli += `# SCOPE=$(az account show --query id --output tsv)\n`;
                cli += `# az policy assignment create \\\n`;
                cli += `#   --name "$POLICY_NAME-assignment" \\\n`;
                cli += `#   --display-name "$POLICY_DISPLAY_NAME Assignment" \\\n`;
                cli += `#   --scope "$SCOPE" \\\n`;
                cli += `#   --policy "$POLICY_NAME"\n\n`;
            }
            
            // Add cleanup commands as comments
            cli += `# Optional: Delete resources after testing\n`;
            cli += `# az policy assignment delete --name "$POLICY_NAME-assignment"\n`;
            cli += `# az policy definition delete --name "$POLICY_NAME"\n`;
            
            return cli;
        } catch (e) {
            console.error('Error generating Azure CLI script:', e);
            // Return a basic error template instead of throwing
            return `#!/bin/bash
# Error generating Azure CLI script: ${e.message}
# Here's a simple template you can modify:

# Set variables
POLICY_NAME="error-policy"
POLICY_DISPLAY_NAME="Error occurred during conversion"
POLICY_DESCRIPTION="Basic policy template"
POLICY_MODE="Indexed"

# Create a basic policy file
cat > basic-policy.json << EOF
{
  "if": {
    "field": "type",
    "equals": "Microsoft.Resources/subscriptions/resourceGroups"
  },
  "then": {
    "effect": "audit"
  }
}
EOF

# Create policy definition
az policy definition create \\
  --name "$POLICY_NAME" \\
  --display-name "$POLICY_DISPLAY_NAME" \\
  --description "$POLICY_DESCRIPTION" \\
  --mode "$POLICY_MODE" \\
  --rules basic-policy.json
`;
        }
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
                return `'${this._escapeBicepString(value)}'`;
            case 'Array':
                if (typeof value === 'string') {
                    try {
                        // Try to parse as JSON
                        const parsed = JSON.parse(value);
                        return this._formatBicepArray(parsed);
                    } catch (e) {
                        // Return as single item array if it's not valid JSON
                        return `['${this._escapeBicepString(value)}']`;
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
                return `'${this._escapeBicepString(value)}'`;
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
                result += `    '${this._escapeBicepString(item)}'`;
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
                result += `'${this._escapeBicepString(value)}'`;
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

// Export for Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormatConverter;
}