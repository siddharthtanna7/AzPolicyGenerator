/**
 * Azure Built-In Policy Importer
 * Utility for importing Azure's built-in policies and making them available in the tool
 */
const BuiltInPolicyImporter = {
    // Base URL for the Azure built-in policy definitions
    builtInPoliciesBaseUrl: 'https://raw.githubusercontent.com/Azure/azure-policy/master/built-in-policies',
    
    // Azure policy categories for organization
    policyCategories: [
        'Compute',
        'Storage',
        'Networking',
        'Security Center',
        'Monitoring',
        'App Service',
        'SQL',
        'Key Vault',
        'Kubernetes',
        'Container Registry',
        'Identity',
        'Tags',
        'General',
        'Guest Configuration',
        'Cognitive Services',
        'API Management',
        'Data Factory',
        'IoT',
        'Event Hub',
        'Service Bus',
        'Cosmos DB',
        'Machine Learning'
    ],
    
    /**
     * Fetch the list of built-in policies from the Azure Policy GitHub repository
     * @returns {Promise<Array>} Array of built-in policy metadata
     */
    async fetchBuiltInPoliciesList() {
        try {
            // For demo purposes, we'll use a static list of popular policies with effect examples
            // In a production environment, this would fetch from the GitHub repo
            
            // Create an array of sample built-in policies
            const samplePolicies = [
                // Audit type policies
                {
                    id: 'a451c1ef-c6ca-483d-87ed-f49761e3ffb5',
                    name: 'Audit VMs that do not use managed disks',
                    category: 'Compute',
                    description: 'This policy audits VMs that do not use managed disks',
                    effect: 'Audit',
                    displayName: 'Audit VMs that do not use managed disks',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Compute/audit-vm-managed-disks/azurepolicy.json`
                },
                {
                    id: '06a78e20-9358-41c9-923c-fb736d382a4d',
                    name: 'Audit SQL DB transparent data encryption status',
                    category: 'SQL',
                    description: 'Audit transparent data encryption status for SQL databases',
                    effect: 'AuditIfNotExists',
                    displayName: 'Audit transparent data encryption status',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/SQL/audit-sql-db-tde-status/azurepolicy.json`
                },
                
                // Deny type policies
                {
                    id: 'e56962a6-4747-49cd-b67b-bf8b01975c4c',
                    name: 'Allowed locations',
                    category: 'General',
                    description: 'This policy enables you to restrict the locations your organization can create resources in.',
                    effect: 'Deny',
                    displayName: 'Allowed locations',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/General/allowed-locations/azurepolicy.json`
                },
                {
                    id: '0a914e76-4921-4c19-b460-a2d36003525a',
                    name: 'Allowed virtual machine SKUs',
                    category: 'Compute',
                    description: 'This policy enables you to specify a set of virtual machine SKUs that your organization can deploy.',
                    effect: 'Deny',
                    displayName: 'Allowed virtual machine SKUs',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Compute/allowed-vm-skus/azurepolicy.json`
                },
                
                // DeployIfNotExists policies
                {
                    id: '59efceea-0c96-497e-a4a1-4eb2290dfeaa',
                    name: 'Deploy Diagnostic Settings for Key Vault to Log Analytics workspace',
                    category: 'Key Vault',
                    description: 'Deploys the diagnostic settings for Key Vault to stream to a Log Analytics workspace when any Key Vault which is missing this diagnostic settings is created or updated.',
                    effect: 'DeployIfNotExists',
                    displayName: 'Deploy Diagnostic Settings for Key Vault to Log Analytics workspace',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/KeyVault/deploy-diagnostic-settings-to-log-analytics-workspace/azurepolicy.json`
                },
                {
                    id: 'f9d614c5-c173-4d56-95a7-b4437057d193',
                    name: 'Configure Azure Defender for SQL servers on machines',
                    category: 'SQL',
                    description: 'Configure virtual machines to run Azure Defender for SQL scanning. Azure Defender for SQL detects anomalous activities indicating unusual and potentially harmful attempts to access or exploit databases.',
                    effect: 'DeployIfNotExists',
                    displayName: 'Configure Azure Defender for SQL servers on machines',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/SQL/deploy-azure-defender-for-sql/azurepolicy.json`
                },
                
                // Modify policies
                {
                    id: '49c88fc8-6fd1-46fd-a676-f12d1d3a4c71',
                    name: 'Add tag to resources',
                    category: 'Tags',
                    description: 'Adds the tag specified in the parameter with its value from the parameter to resources, resource groups that you specify in the list.',
                    effect: 'Modify',
                    displayName: 'Add tag to resources',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Tags/add-tag/azurepolicy.json`
                },
                {
                    id: '96670d01-0a4d-4649-9c89-2d3abc0a5025',
                    name: 'Add or replace a tag on resources',
                    category: 'Tags',
                    description: 'Adds or replaces the tag and value when any resource is created or updated. Existing resources can be remediated by triggering a remediation task.',
                    effect: 'Modify',
                    displayName: 'Add or replace a tag on resources',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Tags/add-replace-tag/azurepolicy.json`
                },
                
                // Append policies
                {
                    id: '3219b347-c217-4b34-9774-36fb35cb1f8a',
                    name: 'Append a tag and its value to resources',
                    category: 'Tags',
                    description: 'Appends the specified tag and value when any resource which is missing this tag is created or updated.',
                    effect: 'Append',
                    displayName: 'Append a tag and its value to resources',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Tags/append-tag/azurepolicy.json`
                },
                {
                    id: '09024ccc-0c5f-475e-9457-b7c0d9ed487b',
                    name: 'Append type and number for disks without tag',
                    category: 'Tags',
                    description: 'Appends the Type and ResourceTypeNumber tag with its value from the parameter when any disk without these tags is created or updated.',
                    effect: 'Append',
                    displayName: 'Append type and number for disks without tag',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Tags/append-type-number-disks/azurepolicy.json`
                },
                
                // Security policies
                {
                    id: 'c3f317a7-a95c-4547-b7e7-11017ebdf2fe',
                    name: 'Storage accounts should be migrated to new Azure Resource Manager resources',
                    category: 'Storage',
                    description: 'Use new Azure Resource Manager for your storage accounts to provide better security features like: stronger access control (RBAC), better auditing, Azure Resource Manager based deployment and governance, access to managed identities, access to key vault for secrets, Azure AD-based authentication and support for tags and resource groups for easier security management',
                    effect: 'Audit',
                    displayName: 'Storage accounts should be migrated to new Azure Resource Manager resources',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Storage/storage-account-arm-migration/azurepolicy.json`
                },
                {
                    id: 'a4af4a39-4135-47fb-b175-47fbdf85311d',
                    name: 'Storage accounts should restrict network access',
                    category: 'Storage',
                    description: 'Network access to storage accounts should be restricted. Configure network rules so only applications from allowed networks can access the storage account. To allow connections from specific internet or on-premises clients, access can be granted to traffic from specific Azure virtual networks or to public internet IP address ranges',
                    effect: 'Audit',
                    displayName: 'Storage accounts should restrict network access',
                    policyType: 'BuiltIn',
                    url: `${this.builtInPoliciesBaseUrl}/Storage/storage-account-network-restriction/azurepolicy.json`
                }
            ];
            
            return samplePolicies;
        } catch (error) {
            console.error('Error fetching built-in policies:', error);
            throw new Error('Failed to fetch built-in policies from Azure');
        }
    },
    
    /**
     * Fetch the details of a specific built-in policy
     * @param {string} policyUrl - URL of the policy JSON file
     * @returns {Promise<Object>} Policy definition
     */
    async fetchPolicyDefinition(policyUrl) {
        try {
            // In a real implementation, this would fetch the actual policy definition
            // For demo purposes, we'll return a simplified example based on the URL
            
            // Extract policy name from URL
            const urlParts = policyUrl.split('/');
            const policyName = urlParts[urlParts.length - 2];
            
            // Create a sample policy definition based on the policy name
            let policyDefinition = {
                properties: {
                    displayName: policyName.replace(/-/g, ' '),
                    description: `Sample definition for ${policyName}`,
                    policyType: 'BuiltIn',
                    mode: 'Indexed',
                    parameters: {},
                    policyRule: {
                        if: {},
                        then: {}
                    }
                }
            };
            
            // Add specific details based on policy name pattern
            if (policyName.includes('audit')) {
                policyDefinition.properties.policyRule.then.effect = 'audit';
            } else if (policyName.includes('deny')) {
                policyDefinition.properties.policyRule.then.effect = 'deny';
            } else if (policyName.includes('deploy')) {
                policyDefinition.properties.policyRule.then.effect = 'deployIfNotExists';
            } else if (policyName.includes('append')) {
                policyDefinition.properties.policyRule.then.effect = 'append';
            } else if (policyName.includes('modify')) {
                policyDefinition.properties.policyRule.then.effect = 'modify';
            }
            
            return policyDefinition;
        } catch (error) {
            console.error('Error fetching policy definition:', error);
            throw new Error(`Failed to fetch policy definition from ${policyUrl}`);
        }
    },
    
    /**
     * Load a built-in policy into the UI
     * @param {string} policyId - ID of the built-in policy
     */
    async loadBuiltInPolicy(policyId, policyList) {
        try {
            // Find the policy in the list
            const policy = policyList.find(p => p.id === policyId);
            if (!policy) {
                throw new Error(`Policy with ID ${policyId} not found`);
            }
            
            // Fetch the policy definition
            const policyDefinition = await this.fetchPolicyDefinition(policy.url);
            
            // Import the policy definition using the existing policy importer
            PolicyImporter.importPolicy(policyDefinition);
            
            // Return success status
            return {
                success: true,
                message: `Successfully loaded policy: ${policy.displayName}`
            };
        } catch (error) {
            console.error('Error loading built-in policy:', error);
            return {
                success: false,
                message: `Failed to load policy: ${error.message}`
            };
        }
    },
    
    /**
     * Render built-in policies list in the UI
     * @param {Array} policies - List of built-in policies
     * @param {HTMLElement} container - Container element to render in
     */
    renderBuiltInPoliciesList(policies, container) {
        // Group policies by category
        const policiesByCategory = {};
        
        policies.forEach(policy => {
            if (!policiesByCategory[policy.category]) {
                policiesByCategory[policy.category] = [];
            }
            policiesByCategory[policy.category].push(policy);
        });
        
        // Clear the container
        container.innerHTML = '';
        
        // Create filter controls
        const filterContainer = document.createElement('div');
        filterContainer.className = 'built-in-filter';
        
        // Create category filter
        const categoryFilter = document.createElement('div');
        categoryFilter.className = 'filter-group';
        categoryFilter.innerHTML = `
            <label for="category-filter">Category:</label>
            <select id="category-filter">
                <option value="all">All Categories</option>
                ${this.policyCategories.map(category => 
                    `<option value="${category}">${category}</option>`
                ).join('')}
            </select>
        `;
        
        // Create effect filter
        const effectFilter = document.createElement('div');
        effectFilter.className = 'filter-group';
        effectFilter.innerHTML = `
            <label for="effect-filter">Effect:</label>
            <select id="effect-filter">
                <option value="all">All Effects</option>
                <option value="Audit">Audit</option>
                <option value="AuditIfNotExists">AuditIfNotExists</option>
                <option value="Deny">Deny</option>
                <option value="DeployIfNotExists">DeployIfNotExists</option>
                <option value="Modify">Modify</option>
                <option value="Append">Append</option>
            </select>
        `;
        
        // Create search box
        const searchBox = document.createElement('div');
        searchBox.className = 'filter-group search-box';
        searchBox.innerHTML = `
            <label for="policy-search">Search:</label>
            <input type="text" id="policy-search" placeholder="Search policies...">
        `;
        
        // Add filters to container
        filterContainer.appendChild(categoryFilter);
        filterContainer.appendChild(effectFilter);
        filterContainer.appendChild(searchBox);
        container.appendChild(filterContainer);
        
        // Create policies list container
        const policiesContainer = document.createElement('div');
        policiesContainer.className = 'built-in-policies-container';
        container.appendChild(policiesContainer);
        
        // Render policies by category
        Object.keys(policiesByCategory).sort().forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'policy-category-section';
            categorySection.setAttribute('data-category', category);
            
            const categoryHeader = document.createElement('h4');
            categoryHeader.textContent = category;
            categorySection.appendChild(categoryHeader);
            
            const policiesList = document.createElement('div');
            policiesList.className = 'policies-list';
            
            policiesByCategory[category].forEach(policy => {
                const policyCard = document.createElement('div');
                policyCard.className = 'policy-card';
                policyCard.setAttribute('data-id', policy.id);
                policyCard.setAttribute('data-effect', policy.effect);
                
                policyCard.innerHTML = `
                    <div class="policy-card-header">
                        <h5>${policy.displayName}</h5>
                        <span class="policy-effect ${policy.effect.toLowerCase()}">${policy.effect}</span>
                    </div>
                    <p class="policy-description">${policy.description}</p>
                    <div class="policy-card-footer">
                        <button class="use-policy-btn" data-id="${policy.id}">Use Policy</button>
                        <button class="view-policy-btn" data-id="${policy.id}">View Details</button>
                    </div>
                `;
                
                policiesList.appendChild(policyCard);
            });
            
            categorySection.appendChild(policiesList);
            policiesContainer.appendChild(categorySection);
        });
        
        // Add event listeners for filters
        const categoryFilterSelect = document.getElementById('category-filter');
        const effectFilterSelect = document.getElementById('effect-filter');
        const policySearchInput = document.getElementById('policy-search');
        
        // Filter function
        const filterPolicies = () => {
            const categoryValue = categoryFilterSelect.value;
            const effectValue = effectFilterSelect.value;
            const searchValue = policySearchInput.value.toLowerCase();
            
            // Get all policy cards
            const policyCards = document.querySelectorAll('.policy-card');
            
            // Get all category sections
            const categorySections = document.querySelectorAll('.policy-category-section');
            
            // Hide all first
            categorySections.forEach(section => {
                section.style.display = 'none';
            });
            
            policyCards.forEach(card => {
                card.style.display = 'none';
                
                const cardCategory = card.closest('.policy-category-section').getAttribute('data-category');
                const cardEffect = card.getAttribute('data-effect');
                const cardTitle = card.querySelector('h5').textContent.toLowerCase();
                const cardDescription = card.querySelector('.policy-description').textContent.toLowerCase();
                
                // Check if card matches all filters
                const matchesCategory = categoryValue === 'all' || cardCategory === categoryValue;
                const matchesEffect = effectValue === 'all' || cardEffect === effectValue;
                const matchesSearch = searchValue === '' || 
                                     cardTitle.includes(searchValue) || 
                                     cardDescription.includes(searchValue);
                
                if (matchesCategory && matchesEffect && matchesSearch) {
                    card.style.display = 'block';
                    // Show the category section if at least one policy matches
                    card.closest('.policy-category-section').style.display = 'block';
                }
            });
        };
        
        // Add event listeners
        categoryFilterSelect.addEventListener('change', filterPolicies);
        effectFilterSelect.addEventListener('change', filterPolicies);
        policySearchInput.addEventListener('input', filterPolicies);
        
        // Add event listeners for buttons
        document.querySelectorAll('.use-policy-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const policyId = button.getAttribute('data-id');
                const result = await this.loadBuiltInPolicy(policyId, policies);
                
                if (result.success) {
                    // Show success message
                    alert(result.message);
                    
                    // Switch to the basic info tab
                    const basicInfoTab = document.querySelector('.tab-button[data-tab="basic-info"]');
                    if (basicInfoTab) {
                        basicInfoTab.click();
                    }
                } else {
                    // Show error message
                    alert(result.message);
                }
            });
        });
        
        document.querySelectorAll('.view-policy-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const policyId = button.getAttribute('data-id');
                const policy = policies.find(p => p.id === policyId);
                
                // Create modal to show policy details
                const modalId = `policy-detail-${Date.now()}`;
                
                const modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'modal active';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${policy.displayName}</h3>
                            <span class="close-modal" onclick="document.getElementById('${modalId}').remove()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="policy-details">
                                <div class="detail-row">
                                    <div class="detail-label">Category:</div>
                                    <div class="detail-value">${policy.category}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Effect:</div>
                                    <div class="detail-value">${policy.effect}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Policy ID:</div>
                                    <div class="detail-value">${policy.id}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Description:</div>
                                    <div class="detail-value">${policy.description}</div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Type:</div>
                                    <div class="detail-value">${policy.policyType}</div>
                                </div>
                            </div>
                            <div class="detail-section">
                                <h4>Sample Implementation</h4>
                                <p>Loading policy definition...</p>
                                <pre id="${modalId}-definition" class="policy-definition"></pre>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="primary-button" onclick="document.getElementById('${modalId}').remove()">Close</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Fetch and display policy definition
                try {
                    const policyDefinition = await this.fetchPolicyDefinition(policy.url);
                    document.getElementById(`${modalId}-definition`).textContent = 
                        JSON.stringify(policyDefinition, null, 2);
                } catch (error) {
                    document.getElementById(`${modalId}-definition`).textContent = 
                        `Error loading policy definition: ${error.message}`;
                }
            });
        });
    },
    
    /**
     * Initialize the built-in policy browser
     * @param {HTMLElement} container - Container element to render in
     */
    async initializeBuiltInPolicyBrowser(container) {
        try {
            // Show loading state
            container.innerHTML = '<div class="loading">Loading built-in policies...</div>';
            
            // Fetch policies list
            const policies = await this.fetchBuiltInPoliciesList();
            
            // Render policies list
            this.renderBuiltInPoliciesList(policies, container);
            
            return {
                success: true,
                message: 'Successfully loaded built-in policies'
            };
        } catch (error) {
            container.innerHTML = `<div class="error">Error loading built-in policies: ${error.message}</div>`;
            
            return {
                success: false,
                message: `Failed to load built-in policies: ${error.message}`
            };
        }
    }
};