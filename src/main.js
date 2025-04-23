document.addEventListener('DOMContentLoaded', () => {
    
    // Set up toast notification container
    initToastContainer();
    
    // Initialize scroll shadow
    initScrollShadow();
    
    // Load policy effects
    loadPolicyEffects();
    
    // Initialize components
    initParameterBuilder();
    initConditionBuilder();
    initTemplateSelector();
    
    // Set up tab navigation
    setupTabs();
    
    // Initialize condition visualizer
    initConditionVisualizer();
    
    // Set up event listeners
    document.getElementById('generate-policy').addEventListener('click', generatePolicy);
    document.getElementById('copy-policy').addEventListener('click', copyToClipboard);
    document.getElementById('download-policy').addEventListener('click', downloadPolicy);
    document.getElementById('load-sample').addEventListener('click', loadSamplePolicy);
    document.getElementById('load-complex-sample')?.addEventListener('click', loadSamplePolicy);
    
    // Add format and fullscreen buttons for JSON display
    document.getElementById('format-json')?.addEventListener('click', formatJsonDisplay);
    document.getElementById('fullscreen-preview')?.addEventListener('click', toggleFullscreenPreview);
    
    // Add export format buttons
    document.getElementById('export-bicep')?.addEventListener('click', exportAsBicep);
    document.getElementById('export-terraform')?.addEventListener('click', exportAsTerraform);
    document.getElementById('export-cli')?.addEventListener('click', exportAsAzureCLI);
    
    // Setup code tabs
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const format = tab.dataset.format;
            switchCodeTab(format);
        });
    });
    
    // Add paste event listener to the policy JSON preview
    const policyJsonElement = document.getElementById('policy-json');
    if (policyJsonElement) {
        policyJsonElement.addEventListener('paste', handlePolicyPaste);
        policyJsonElement.setAttribute('contentEditable', 'true');
        policyJsonElement.setAttribute('spellcheck', 'false');
    }
    
    // Add Enter key event to policy name field
    document.getElementById('policy-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generatePolicy();
        }
    });
    
    // Show welcome toast
    showToast('Welcome to Azure Policy Generator', 'Ready to create Azure Policy definitions', 'info');
    
    // Set up event listener for condition visualization
    const visualizeBtn = document.getElementById('visualize-conditions');
    if (visualizeBtn) {
        visualizeBtn.addEventListener('click', toggleConditionVisualizer);
    }
    
    // Set up effect description
    const effectSelect = document.getElementById('policy-effect');
    if (effectSelect) {
        effectSelect.addEventListener('change', updateEffectDescription);
    }
    
    // Add tab state indicators
    updateTabStates();
    
    /**
     * Set up tab navigation
     */
    function setupTabs() {
        // Setup tabs
        setupTabsForContainer('policy-mode-container');
    }
    
    /**
     * Set up tabs for a specific container
     * @param {string} containerId - The ID of the container
     */
    function setupTabsForContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const tabButtons = container.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Get the tab ID
                const tabId = button.getAttribute('data-tab');
                
                // Deactivate all tabs within this container
                container.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                container.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Activate selected tab
                button.classList.add('active');
                container.querySelector(`#${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    // Function to generate policy
    function generatePolicy() {
        try {
            // Show loading indicator
            const policyPreview = document.querySelector('.policy-preview');
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Generating policy...</div>
            `;
            policyPreview.style.position = 'relative';
            policyPreview.appendChild(loadingOverlay);
            
            // Get basic policy information
            const policyNameInput = document.getElementById('policy-name');
            const policyName = policyNameInput.value;
            
            // Basic validation
            if (!policyName.trim()) {
                policyNameInput.classList.add('is-invalid');
                showToast('Validation Error', 'Policy name is required', 'error');
                policyPreview.removeChild(loadingOverlay);
                return;
            } else {
                policyNameInput.classList.remove('is-invalid');
                policyNameInput.classList.add('is-valid');
            }
            
            const policyDescription = document.getElementById('policy-description').value;
            const policyMode = document.getElementById('policy-mode').value;
            const policyEffect = document.getElementById('policy-effect').value;
            const metadataCategory = document.getElementById('metadata-category').value;
            const policyVersion = document.getElementById('policy-version').value;
            
            // Get parameters
            const parameters = getParameters();
            
            // Get condition structure (nested conditions)
            const conditionStructure = getConditions();
            
            // Also get legacy flat conditions for backward compatibility
            const flatConditions = flattenConditions(conditionStructure);
            
            // Generate policy JSON
            const policy = PolicyGenerator.generatePolicy({
                name: policyName,
                description: policyDescription,
                mode: policyMode,
                effect: policyEffect,
                metadata: {
                    category: metadataCategory,
                    version: policyVersion
                },
                parameters: parameters,
                conditions: flatConditions,
                conditionStructure: conditionStructure
            });
            
            // Display generated policy
            displayPolicy(policy);
            
            // Update condition visualizer if it's visible
            const visualizerContainer = document.getElementById('condition-visualizer');
            if (visualizerContainer && !visualizerContainer.classList.contains('hidden')) {
                renderConditionVisualizer(conditionStructure, visualizerContainer);
            }
            
            // Show success message and remove loading overlay
            showToast('Policy Generated', 'Your Azure Policy has been successfully generated', 'success');
            
            setTimeout(() => {
                if (loadingOverlay.parentNode === policyPreview) {
                    policyPreview.removeChild(loadingOverlay);
                }
            }, 500);
            
        } catch (error) {
            showToast('Error', 'Error generating policy: ' + error.message, 'error');
            console.error(error);
            
            // Remove loading overlay if exists
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }
    }
    
    // Function to validate policy
    function validatePolicy() {
        try {
            // Show loading overlay
            const validationTab = document.getElementById('validation-tab');
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Validating policy...</div>
            `;
            validationTab.style.position = 'relative';
            validationTab.appendChild(loadingOverlay);
            
            // Switch to validation tab first
            document.querySelector('.tab-button[data-tab="validation"]').click();
            
            // Get the policy JSON
            const policyJson = document.getElementById('policy-json').textContent;
            if (!policyJson || policyJson.includes('Policy JSON will appear here')) {
                showToast('Validation Error', 'Please generate a policy first', 'error');
                if (loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                }
                return;
            }
            
            const policy = JSON.parse(policyJson);
            
            // Validate the policy
            const validationResults = PolicyValidator.validatePolicy(policy);
            
            // Display validation results
            displayValidationResults(validationResults, 'policy');
            
            // Remove loading overlay
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
            
            // Show toast based on validation results
            if (validationResults.errors.length === 0 && validationResults.warnings.length === 0) {
                showToast('Validation Success', 'Policy validation passed with no issues', 'success');
            } else if (validationResults.errors.length === 0 && validationResults.warnings.length > 0) {
                showToast('Validation Warning', `Policy validation passed with ${validationResults.warnings.length} warnings`, 'warning');
            } else {
                showToast('Validation Failed', `Policy validation failed with ${validationResults.errors.length} errors`, 'error');
            }
            
        } catch (error) {
            showToast('Error', 'Error validating policy: ' + error.message, 'error');
            console.error(error);
            
            // Remove loading overlay if exists
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }
    }
    
    /**
     * Validate an initiative
     */
    function validateInitiative() {
        try {
            // First generate the initiative if needed
            if (!document.getElementById('initiative-json').textContent || 
                document.getElementById('initiative-json').textContent.includes('Initiative JSON will appear here')) {
                generateInitiative();
            }
            
            // Get the initiative JSON
            const initiativeJson = document.getElementById('initiative-json').textContent;
            if (!initiativeJson || initiativeJson.includes('Initiative JSON will appear here')) {
                throw new Error('Please generate an initiative first');
            }
            
            const initiative = JSON.parse(initiativeJson);
            
            // Validate the initiative
            const validationResults = PolicyValidator.validateInitiative(initiative);
            
            // Display validation results
            displayValidationResults(validationResults, 'initiative');
        } catch (error) {
            alert('Error validating initiative: ' + error.message);
            console.error(error);
        }
    }
    
    // Function to display validation results
    function displayValidationResults(results, type = 'policy') {
        const container = type === 'policy' ? 
            document.getElementById('policy-mode-container') : 
            document.getElementById('initiative-mode-container');
            
        const validationContainer = container.querySelector('.validation-results');
        const validationSummary = container.querySelector('.validation-summary');
        const validationDetails = container.querySelector('.validation-details');
        
        if (!validationContainer || !validationSummary || !validationDetails) {
            console.error('Validation result elements not found');
            return;
        }
        
        // Show the validation results
        validationContainer.classList.remove('hidden');
        
        // Clear previous results
        validationSummary.innerHTML = '';
        validationDetails.innerHTML = '';
        
        // Add summary
        const summary = document.createElement('div');
        summary.className = results.errors.length === 0 ? 'validation-item success' : 'validation-item error';
        summary.innerHTML = `
            <h5>${results.errors.length === 0 ? 'Validation Passed' : 'Validation Failed'}</h5>
            <p>Errors: ${results.errors.length}, Warnings: ${results.warnings.length}</p>
        `;
        validationSummary.appendChild(summary);
        
        // Add errors
        if (results.errors.length > 0) {
            const errorsTitle = document.createElement('h5');
            errorsTitle.textContent = 'Errors';
            validationDetails.appendChild(errorsTitle);
            
            results.errors.forEach(error => {
                const errorItem = document.createElement('div');
                errorItem.className = 'validation-item error';
                errorItem.innerHTML = `
                    <p><strong>${error.code}:</strong> ${error.message}</p>
                    ${error.path ? `<p>Path: ${error.path}</p>` : ''}
                `;
                validationDetails.appendChild(errorItem);
            });
        }
        
        // Add warnings
        if (results.warnings.length > 0) {
            const warningsTitle = document.createElement('h5');
            warningsTitle.textContent = 'Warnings';
            validationDetails.appendChild(warningsTitle);
            
            results.warnings.forEach(warning => {
                const warningItem = document.createElement('div');
                warningItem.className = 'validation-item warning';
                warningItem.innerHTML = `
                    <p><strong>${warning.code}:</strong> ${warning.message}</p>
                    ${warning.path ? `<p>Path: ${warning.path}</p>` : ''}
                `;
                validationDetails.appendChild(warningItem);
            });
        }
        
        // If no errors or warnings
        if (results.errors.length === 0 && results.warnings.length === 0) {
            const successItem = document.createElement('div');
            successItem.className = 'validation-item success';
            successItem.innerHTML = `
                <p>The ${type} definition has passed all validation checks.</p>
            `;
            validationDetails.appendChild(successItem);
        }
        
        // Switch to validation tab
        const validationTab = container.querySelector('.tab-button[data-tab="validation"]');
        if (validationTab) {
            validationTab.click();
        }
    }
    
    // Function to copy policy to clipboard
    function copyToClipboard() {
        const contentElement = document.getElementById('policy-json');
        
        if (!contentElement) return;
        
        // Create a temporary textarea element to copy from
        const textarea = document.createElement('textarea');
        textarea.value = contentElement.textContent;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            // Execute copy command
            document.execCommand('copy');
            showToast('Success', 'Policy JSON copied to clipboard', 'success');
        } catch (err) {
            console.error('Unable to copy to clipboard', err);
            showToast('Error', 'Failed to copy to clipboard', 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    }
    
    // Function to download policy as JSON file
    function downloadPolicy() {
        const contentElement = document.getElementById('policy-json');
        const nameElement = document.getElementById('policy-name');
        
        if (!contentElement || !nameElement) {
            showToast('Error', 'Could not download policy. Please generate a policy first.', 'error');
            return;
        }
        
        const content = contentElement.textContent;
        if (!content || content.includes('Policy JSON will appear here')) {
            showToast('Error', 'There is no policy to download. Please generate a policy first.', 'error');
            return;
        }
        
        const name = nameElement.value || 'azure-policy';
        const fileName = `${name.toLowerCase().replace(/\\s+/g, '-')}.json`;
        
        // Create a blob from the content
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a download link and trigger click
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        showToast('Success', `Policy downloaded as ${fileName}`, 'success');
    }
    
    // Function to display policy in the preview area
    function displayPolicy(policy) {
        // Update JSON preview
        const policyJson = document.getElementById('policy-json');
        policyJson.textContent = JSON.stringify(policy, null, 4);
        
        // Update Bicep preview
        try {
            const bicepPreview = document.getElementById('policy-bicep');
            if (bicepPreview) {
                bicepPreview.textContent = FormatConverter.toBicep(policy);
            }
        } catch (e) {
            console.error('Error generating Bicep preview:', e);
        }
        
        // Update Terraform preview
        try {
            const terraformPreview = document.getElementById('policy-terraform');
            if (terraformPreview) {
                terraformPreview.textContent = FormatConverter.toTerraform(policy);
            }
        } catch (e) {
            console.error('Error generating Terraform preview:', e);
        }
        
        // Update CLI preview
        try {
            const cliPreview = document.getElementById('policy-cli');
            if (cliPreview) {
                cliPreview.textContent = FormatConverter.toAzureCLI(policy);
            }
        } catch (e) {
            console.error('Error generating CLI preview:', e);
        }
    }
    
    // Function to switch between code preview tabs
    function switchCodeTab(format) {
        // Deactivate all tabs and previews
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.code-preview').forEach(preview => {
            preview.classList.remove('active');
        });
        
        // Activate the selected tab and preview
        document.querySelector(`.code-tab[data-format="${format}"]`)?.classList.add('active');
        document.getElementById(`policy-${format}`)?.classList.add('active');
        
        // If we're showing JSON, make it editable
        const policyJsonEl = document.getElementById('policy-json');
        if (policyJsonEl) {
            if (format === 'json') {
                policyJsonEl.setAttribute('contentEditable', 'true');
            } else {
                policyJsonEl.setAttribute('contentEditable', 'false');
            }
        }
    }
    
    // Function to handle policy import
    function handleImport(event) {
        const fileInput = event.target;
        const file = fileInput.files[0];
        
        if (!file) {
            return;
        }
        
        // Check if file is JSON
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert('Please select a valid JSON file.');
            fileInput.value = ''; // Clear the file input
            return;
        }
        
        // Read the file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const policyJson = e.target.result;
                
                // Import the policy
                PolicyImporter.importPolicy(policyJson);
                
                // Generate policy preview
                generatePolicy();
                
                // Clear the file input to allow reimporting the same file
                fileInput.value = '';
            } catch (error) {
                alert('Error importing policy: ' + error.message);
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Check if an object has common policy fields at any level
     * @param {Object} obj - The object to check
     * @returns {boolean} - True if policy fields are found
     */
    function checkForPolicyFields(obj) {
        // Common policy fields to look for
        const policyFields = [
            'policyType', 'displayName', 'policyRule', 
            'parameters', 'metadata', 'mode', 'description'
        ];
        
        // Check if the object directly has several policy fields
        let matchCount = 0;
        for (const field of policyFields) {
            if (obj[field] !== undefined) {
                matchCount++;
            }
        }
        
        // If we have multiple policy fields, it's likely a policy
        if (matchCount >= 2) {
            return true;
        }
        
        // Check for if/then structure which is the core of policy rules
        if (obj.if && obj.then) {
            return true;
        }
        
        // Recursively check nested objects
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                if (checkForPolicyFields(obj[key])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Export the current policy as Bicep
     * @param {Event} event - The click event
     */
    function exportAsBicep(event) {
        event.preventDefault();
        
        try {
            // Get the current policy
            const policyJson = document.getElementById('policy-json').textContent;
            if (!policyJson || policyJson.trim() === '') {
                showToast('No Policy', 'Generate a policy first', 'warning');
                return;
            }
            
            // Parse the policy JSON
            let policy;
            try {
                policy = JSON.parse(policyJson);
            } catch (e) {
                showToast('Invalid JSON', 'Cannot export invalid JSON', 'error');
                return;
            }
            
            // Convert to Bicep
            const bicep = FormatConverter.toBicep(policy);
            
            // Create and download the file
            const blob = new Blob([bicep], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${policy.properties.displayName.replace(/[^a-zA-Z0-9]/g, '_')}.bicep`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Export Successful', 'Policy exported as Bicep', 'success');
        } catch (error) {
            console.error('Error exporting to Bicep:', error);
            showToast('Export Failed', error.message, 'error');
        }
    }
    
    /**
     * Export the current policy as Terraform
     * @param {Event} event - The click event
     */
    function exportAsTerraform(event) {
        event.preventDefault();
        
        try {
            // Get the current policy
            const policyJson = document.getElementById('policy-json').textContent;
            if (!policyJson || policyJson.trim() === '') {
                showToast('No Policy', 'Generate a policy first', 'warning');
                return;
            }
            
            // Parse the policy JSON
            let policy;
            try {
                policy = JSON.parse(policyJson);
            } catch (e) {
                showToast('Invalid JSON', 'Cannot export invalid JSON', 'error');
                return;
            }
            
            // Convert to Terraform
            const terraform = FormatConverter.toTerraform(policy);
            
            // Create and download the file
            const blob = new Blob([terraform], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${policy.properties.displayName.replace(/[^a-zA-Z0-9]/g, '_')}.tf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Export Successful', 'Policy exported as Terraform', 'success');
        } catch (error) {
            console.error('Error exporting to Terraform:', error);
            showToast('Export Failed', error.message, 'error');
        }
    }
    
    /**
     * Export the current policy as Azure CLI script
     * @param {Event} event - The click event
     */
    function exportAsAzureCLI(event) {
        event.preventDefault();
        
        try {
            // Get the current policy
            const policyJson = document.getElementById('policy-json').textContent;
            if (!policyJson || policyJson.trim() === '') {
                showToast('No Policy', 'Generate a policy first', 'warning');
                return;
            }
            
            // Parse the policy JSON
            let policy;
            try {
                policy = JSON.parse(policyJson);
            } catch (e) {
                showToast('Invalid JSON', 'Cannot export invalid JSON', 'error');
                return;
            }
            
            // Convert to Azure CLI
            const cli = FormatConverter.toAzureCLI(policy);
            
            // Create and download the file
            const blob = new Blob([cli], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${policy.properties.displayName.replace(/[^a-zA-Z0-9]/g, '_')}.sh`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Export Successful', 'Policy exported as Azure CLI script', 'success');
        } catch (error) {
            console.error('Error exporting to Azure CLI:', error);
            showToast('Export Failed', error.message, 'error');
        }
    }
    
    /**
     * Extract fields from policy JSON and populate UI fields directly
     * Used as a fallback when the standard import fails
     * @param {Object} policyObject - The policy object
     */
    function extractAndPopulateFields(policyObject) {
        // Try to populate basic info first
        try {
            // Handle different policy structures
            let properties = policyObject.properties || policyObject;
            
            // Set policy name if available
            if (properties.displayName) {
                const nameInput = document.getElementById('policy-name');
                if (nameInput) {
                    nameInput.value = properties.displayName;
                }
            }
            
            // Set policy description if available
            if (properties.description) {
                const descInput = document.getElementById('policy-description');
                if (descInput) {
                    descInput.value = properties.description;
                }
            }
            
            // Set policy mode if available
            if (properties.mode) {
                const modeSelect = document.getElementById('policy-mode');
                if (modeSelect) {
                    // Try to find the option
                    const option = Array.from(modeSelect.options).find(opt => 
                        opt.value.toLowerCase() === properties.mode.toLowerCase());
                    if (option) {
                        option.selected = true;
                    }
                }
            }
            
            // Set effect if available
            let effect = null;
            
            // Try to find the effect from various possible locations
            if (properties.policyRule && properties.policyRule.then && properties.policyRule.then.effect) {
                effect = properties.policyRule.then.effect;
            } else if (policyObject.then && policyObject.then.effect) {
                effect = policyObject.then.effect;
            }
            
            if (effect) {
                const effectSelect = document.getElementById('policy-effect');
                if (effectSelect) {
                    // Handle parameter references in effect
                    if (typeof effect === 'string' && effect.includes('parameters(')) {
                        const effectParamCheckbox = document.getElementById('effect-is-parameter');
                        if (effectParamCheckbox) {
                            effectParamCheckbox.checked = true;
                        }
                        
                        // Try to extract the parameter name
                        const paramMatch = effect.match(/parameters\(['"](.*?)['"]\)/);
                        if (paramMatch && paramMatch[1]) {
                            const effectParamNameInput = document.getElementById('effect-parameter-name');
                            if (effectParamNameInput) {
                                effectParamNameInput.value = paramMatch[1];
                            }
                        }
                    } else {
                        // Try to find the matching effect
                        const option = Array.from(effectSelect.options).find(opt => 
                            opt.value === effect);
                        if (option) {
                            option.selected = true;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error extracting basic policy info:', e);
        }
    }
    
    /**
     * Handle paste events in the policy JSON preview area
     * Automatically imports the pasted policy JSON into the UI
     * @param {Event} event - The paste event
     */
    function handlePolicyPaste(event) {
        // Get pasted content
        let pastedContent;
        
        // Modern browsers
        if (event.clipboardData && event.clipboardData.getData) {
            pastedContent = event.clipboardData.getData('text/plain');
            event.preventDefault(); // Prevent default paste behavior
        } 
        // IE
        else if (window.clipboardData && window.clipboardData.getData) {
            pastedContent = window.clipboardData.getData('Text');
            event.preventDefault();
        }
        
        if (!pastedContent) {
            return;
        }
        
        try {
            // Clean the pasted content to handle common issues
            let cleanedContent = pastedContent.trim();
            
            // Check if the content starts/ends with quotes (common when copying from some sources)
            if ((cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) || 
                (cleanedContent.startsWith("'") && cleanedContent.endsWith("'"))) {
                try {
                    // Try to parse as a JSON string that's been quoted
                    cleanedContent = JSON.parse(cleanedContent);
                } catch (e) {
                    // If that fails, just remove the outer quotes manually
                    cleanedContent = cleanedContent.substring(1, cleanedContent.length - 1);
                }
            }
            
            // Handle potential escaped JSON
            if (typeof cleanedContent === 'string' && cleanedContent.includes('\\\"')) {
                cleanedContent = cleanedContent.replace(/\\"/g, '"');
            }
            
            // Try to parse as JSON
            let policyObject;
            try {
                policyObject = JSON.parse(cleanedContent);
            } catch (parseError) {
                console.log('First JSON parse attempt failed, trying with more preprocessing');
                
                // Last-ditch effort - try to handle common issues with manual fixes
                // Replace single quotes with double quotes for JSON compliance
                cleanedContent = cleanedContent.replace(/'/g, '"');
                // Try again
                policyObject = JSON.parse(cleanedContent);
            }
            
            // Try to handle both wrapped and unwrapped policy formats
            let isPolicyLike = false;
            
            // Direct policy check - if/then structure
            if (policyObject.if && policyObject.then) {
                isPolicyLike = true;
                // Wrap it in a standard structure for the importer
                policyObject = {
                    properties: {
                        policyRule: policyObject,
                        displayName: 'Imported Policy',
                        description: 'Imported from JSON'
                    }
                };
            }
            // Standard policy check - properties structure
            else if (policyObject.properties) {
                isPolicyLike = true;
            }
            // Basic policy with name and rule
            else if (policyObject.policyRule && policyObject.name) {
                isPolicyLike = true;
            }
            // Check for nested policy inside a wrapper object (common from Azure exports)
            else if (policyObject.policy && typeof policyObject.policy === 'object') {
                policyObject = policyObject.policy;
                isPolicyLike = true;
            }
            // Check if it's a policy array and take the first one
            else if (Array.isArray(policyObject) && policyObject.length > 0 && 
                    (policyObject[0].properties || policyObject[0].policyRule)) {
                policyObject = policyObject[0];
                isPolicyLike = true;
                showToast('Note', 'Imported first policy from an array of policies', 'info');
            }
            
            // Final check - look for common policy fields at any level
            if (!isPolicyLike) {
                const hasCommonPolicyFields = checkForPolicyFields(policyObject);
                if (hasCommonPolicyFields) {
                    isPolicyLike = true;
                }
            }
            
            if (isPolicyLike) {
                // Show loading indicator
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Importing policy...</div>
                `;
                
                const policyPreview = document.querySelector('.policy-preview');
                if (policyPreview) {
                    policyPreview.style.position = 'relative';
                    policyPreview.appendChild(loadingOverlay);
                }
                
                // Let the paste complete and then import the policy
                setTimeout(() => {
                    try {
                        // Import the policy
                        const importResult = PolicyImporter.importPolicy(policyObject);
                        
                        // Update the preview with properly formatted JSON
                        const formattedJson = JSON.stringify(policyObject, null, 4);
                        const policyJsonEl = document.getElementById('policy-json');
                        if (policyJsonEl) {
                            policyJsonEl.textContent = formattedJson;
                        }
                        
                        // Remove loading overlay
                        if (loadingOverlay.parentNode) {
                            loadingOverlay.parentNode.removeChild(loadingOverlay);
                        }
                        
                        // Show success message
                        showToast('Policy Imported', 'Policy has been successfully imported to the UI', 'success');
                    } catch (importError) {
                        console.error('Error importing policy:', importError);
                        
                        // Try a less strict approach - extract what we can
                        try {
                            extractAndPopulateFields(policyObject);
                            
                            // Update the preview with formatted JSON anyway
                            const formattedJson = JSON.stringify(policyObject, null, 4);
                            const policyJsonEl = document.getElementById('policy-json');
                            if (policyJsonEl) {
                                policyJsonEl.textContent = formattedJson;
                            }
                            
                            // Remove loading overlay
                            if (loadingOverlay.parentNode) {
                                loadingOverlay.parentNode.removeChild(loadingOverlay);
                            }
                            
                            // Show partial success message
                            showToast('Policy Partially Imported', 'Some fields were imported but there were issues with the policy format', 'warning');
                        } catch (fallbackError) {
                            // Remove loading overlay
                            if (loadingOverlay.parentNode) {
                                loadingOverlay.parentNode.removeChild(loadingOverlay);
                            }
                            
                            // Show error message
                            showToast('Import Error', 'Could not import policy: ' + importError.message, 'error');
                        }
                    }
                }, 100);
            } else {
                // If it's valid JSON but not a policy
                // Still update the JSON preview but don't try to import
                const policyJsonEl = document.getElementById('policy-json');
                if (policyJsonEl) {
                    const formattedJson = JSON.stringify(policyObject, null, 4);
                    policyJsonEl.textContent = formattedJson;
                }
                
                showToast('Warning', 'The JSON appears valid but doesn\'t match Azure Policy format', 'warning');
            }
        } catch (error) {
            // Try to display the raw content anyway for manual editing
            console.log('JSON parsing error:', error);
            
            // Just update the text area with the raw pasted content
            const policyJsonEl = document.getElementById('policy-json');
            if (policyJsonEl) {
                policyJsonEl.textContent = pastedContent;
            }
            
            showToast('Invalid JSON', 'The pasted content is not valid JSON. Please check the format.', 'error');
        }
    }
    
    // Function to load sample policy
    function loadSamplePolicy(event) {
        event.preventDefault();
        
        // Fetch the sample policy
        fetch(event.target.href)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load sample policy');
                }
                return response.json();
            })
            .then(policy => {
                // Import the policy
                PolicyImporter.importPolicy(policy);
                
                // Generate policy preview
                generatePolicy();
            })
            .catch(error => {
                alert('Error loading sample policy: ' + error.message);
                console.error(error);
            });
    }
    
    /**
     * Load policy effects from JSON data
     */
    function loadPolicyEffects() {
        const effectSelect = document.getElementById('policy-effect');
        if (!effectSelect) return;
        
        fetch('../data/policyEffects.json')
            .then(response => response.json())
            .then(data => {
                // Clear existing options
                effectSelect.innerHTML = '';
                
                // Add effect options
                data.effects.forEach(effect => {
                    const option = document.createElement('option');
                    option.value = effect.name;
                    option.textContent = effect.name;
                    option.setAttribute('data-description', effect.description);
                    option.setAttribute('data-details', effect.details);
                    effectSelect.appendChild(option);
                });
                
                // Set the initial description
                updateEffectDescription();
            })
            .catch(error => {
                console.error('Error loading policy effects:', error);
                // Fallback to basic effects
                const basicEffects = [
                    { name: 'Audit', description: 'Creates an audit event in the activity log' },
                    { name: 'Deny', description: 'Prevents resource creation or update' },
                    { name: 'Disabled', description: 'Policy effect is turned off' }
                ];
                
                basicEffects.forEach(effect => {
                    const option = document.createElement('option');
                    option.value = effect.name;
                    option.textContent = effect.name;
                    option.setAttribute('data-description', effect.description);
                    effectSelect.appendChild(option);
                });
            });
    }
    
    /**
     * Update the effect description based on selected effect
     */
    function updateEffectDescription() {
        const effectSelect = document.getElementById('policy-effect');
        const descriptionElement = document.getElementById('effect-description');
        
        if (!effectSelect || !descriptionElement) return;
        
        const selectedOption = effectSelect.options[effectSelect.selectedIndex];
        if (selectedOption && selectedOption.getAttribute('data-description')) {
            descriptionElement.textContent = selectedOption.getAttribute('data-description');
        } else {
            descriptionElement.textContent = '';
        }
    }
    
    /**
     * Toggle the condition visualizer visibility and update visualization
     */
    function toggleConditionVisualizer() {
        const visualizerContainer = document.getElementById('condition-visualizer');
        if (!visualizerContainer) return;
        
        // Toggle visibility
        visualizerContainer.classList.toggle('hidden');
        
        const visualizeBtn = document.getElementById('visualize-conditions');
        
        if (!visualizerContainer.classList.contains('hidden')) {
            // Update the button text
            visualizeBtn.textContent = 'Hide Visualization';
            
            // Get the current conditions and display them
            const conditionStructure = getConditions();
            renderConditionVisualizer(conditionStructure, visualizerContainer);
        } else {
            // Update the button text back
            visualizeBtn.textContent = 'Visualize Conditions';
        }
    }
    
    
    /**
     * Initialize toast container
     */
    function initToastContainer() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }
    
    /**
     * Show a toast notification
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds (default: 5000)
     */
    /**
     * Initialize scroll shadow that appears when scrolling down
     */
    function initScrollShadow() {
        const scrollShadow = document.querySelector('.scroll-shadow');
        if (!scrollShadow) return;
        
        // Function to handle scroll events
        const handleScroll = () => {
            if (window.scrollY > 10) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        };
        
        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);
        
        // Call immediately to set initial state
        handleScroll();
        
        // Handle mobile tab overflow scrolling
        const tabContainers = document.querySelectorAll('.tabs');
        tabContainers.forEach(container => {
            // Function to handle tab scrolling
            const handleTabScroll = () => {
                // Show visual indicator when tabs can be scrolled
                const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
                if (hasHorizontalScroll) {
                    const reachedEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
                    const atStart = container.scrollLeft <= 10;
                    
                    if (reachedEnd) {
                        container.classList.add('scroll-end');
                        container.classList.remove('scroll-start', 'scroll-middle');
                    } else if (atStart) {
                        container.classList.add('scroll-start');
                        container.classList.remove('scroll-end', 'scroll-middle');
                    } else {
                        container.classList.add('scroll-middle');
                        container.classList.remove('scroll-start', 'scroll-end');
                    }
                }
            };
            
            // Add scroll event listener to tab container
            container.addEventListener('scroll', handleTabScroll);
            
            // Also check on window resize
            window.addEventListener('resize', handleTabScroll);
            
            // Trigger scroll event on load to set initial state
            handleTabScroll();
        });
    }
    
    /**
     * Updates tab states with validation indicators
     */
    function updateTabStates() {
        // Add validation state to validation tab
        const validationTab = document.getElementById('validation-tab-button');
        if (validationTab) {
            validationTab.classList.add('with-status');
            
            // Check if we've validated and update status
            const validationResults = document.getElementById('validation-results');
            if (validationResults && !validationResults.classList.contains('hidden')) {
                const hasErrors = validationResults.querySelector('.validation-item.error');
                const hasWarnings = validationResults.querySelector('.validation-item.warning');
                
                if (hasErrors) {
                    validationTab.classList.add('status-invalid');
                    validationTab.classList.remove('status-warning', 'status-valid');
                } else if (hasWarnings) {
                    validationTab.classList.add('status-warning');
                    validationTab.classList.remove('status-invalid', 'status-valid');
                } else {
                    validationTab.classList.add('status-valid');
                    validationTab.classList.remove('status-invalid', 'status-warning');
                }
            }
        }
    }
    
    /**
     * Format JSON display with proper indentation and syntax highlighting
     */
    function formatJsonDisplay() {
        const jsonElement = document.getElementById('policy-json');
        if (!jsonElement) return;
        
        try {
            // Parse and reformat JSON
            const jsonContent = jsonElement.textContent;
            const parsedJson = JSON.parse(jsonContent);
            const formattedJson = JSON.stringify(parsedJson, null, 2);
            
            // Update the display
            jsonElement.textContent = formattedJson;
            
            // Show success toast
            showToast('Success', 'JSON formatted successfully', 'success', 2000);
        } catch(e) {
            showToast('Error', 'Failed to format JSON: ' + e.message, 'error');
        }
    }
    
    /**
     * Toggle fullscreen mode for the code preview
     */
    function toggleFullscreenPreview() {
        const previewContainer = document.querySelector('.policy-preview');
        const codePreview = document.getElementById('policy-json');
        
        if (!previewContainer || !codePreview) return;
        
        if (!document.fullscreenElement) {
            // Enter fullscreen mode
            previewContainer.requestFullscreen()
                .then(() => {
                    previewContainer.classList.add('fullscreen');
                    codePreview.style.maxHeight = '80vh';
                })
                .catch(err => {
                    showToast('Error', 'Failed to enter fullscreen mode: ' + err.message, 'error');
                });
        } else {
            // Exit fullscreen mode
            document.exitFullscreen()
                .then(() => {
                    previewContainer.classList.remove('fullscreen');
                    codePreview.style.maxHeight = '';
                })
                .catch(err => {
                    showToast('Error', 'Failed to exit fullscreen mode: ' + err.message, 'error');
                });
        }
    }
    
    function showToast(title, message, type = 'success', duration = 5000) {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Get icon based on type
        let iconSvg = '';
        switch(type) {
            case 'success':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
                break;
            case 'error':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
                break;
            case 'warning':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warning-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
                break;
            case 'info':
            default:
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        // Toast content
        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-dismiss" aria-label="Dismiss">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // Add to container with animation delay to ensure they stack properly
        setTimeout(() => {
            toastContainer.appendChild(toast);
            
            // Set up dismiss button
            const dismissBtn = toast.querySelector('.toast-dismiss');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(10px)';
                    setTimeout(() => toast.remove(), 300);
                });
            }
            
            // Auto-remove after duration
            const autoRemoveTimeout = setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        if (toast.parentNode === toastContainer) {
                            toastContainer.removeChild(toast);
                        }
                    }, 300);
                }
            }, duration);
            
            // Clear timeout if toast is manually dismissed
            toast.addEventListener('click', () => {
                clearTimeout(autoRemoveTimeout);
            });
            
        }, 100);
    }
});