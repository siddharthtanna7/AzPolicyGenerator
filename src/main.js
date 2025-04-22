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
    
    // Add format and fullscreen buttons for JSON display
    document.getElementById('format-json')?.addEventListener('click', formatJsonDisplay);
    document.getElementById('fullscreen-preview')?.addEventListener('click', toggleFullscreenPreview);
    
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
        const policyJson = document.getElementById('policy-json');
        policyJson.textContent = JSON.stringify(policy, null, 4);
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
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
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