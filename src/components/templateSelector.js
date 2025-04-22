/**
 * Azure Policy Template Selector
 * Handles loading and applying policy templates
 */

/**
 * Initialize the Template Selector component
 */
function initTemplateSelector() {
    // Load templates and categories
    loadPolicyTemplates();
    
    // Set up category filter
    const categorySelect = document.getElementById('template-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', filterTemplates);
    }
}

/**
 * Load policy templates from JSON data
 */
function loadPolicyTemplates() {
    fetch('../data/policyTemplates.json')
        .then(response => response.json())
        .then(data => {
            // Populate categories dropdown
            populateCategories(data.categories);
            
            // Create template cards
            createTemplateCards(data.templates);
        })
        .catch(error => {
            console.error('Error loading policy templates:', error);
            const templatesContainer = document.getElementById('templates-container');
            if (templatesContainer) {
                templatesContainer.innerHTML = '<p class="error-message">Failed to load policy templates. Please try again later.</p>';
            }
        });
}

/**
 * Populate the categories dropdown
 * @param {Array} categories - Categories data
 */
function populateCategories(categories) {
    const categorySelect = document.getElementById('template-category');
    if (!categorySelect) return;
    
    // Keep the "All Categories" option
    const allOption = categorySelect.querySelector('option');
    categorySelect.innerHTML = '';
    categorySelect.appendChild(allOption);
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

/**
 * Create template cards from data
 * @param {Array} templates - Templates data
 */
function createTemplateCards(templates) {
    const templatesContainer = document.getElementById('templates-container');
    if (!templatesContainer) return;
    
    // Clear container
    templatesContainer.innerHTML = '';
    
    // Create a card for each template
    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.setAttribute('data-category', template.category);
        card.setAttribute('data-name', template.name);
        
        const title = document.createElement('h4');
        title.textContent = template.name;
        
        const category = document.createElement('span');
        category.className = 'category';
        category.textContent = template.category;
        
        const description = document.createElement('p');
        description.className = 'template-description';
        description.textContent = template.description;
        
        card.appendChild(title);
        card.appendChild(category);
        card.appendChild(description);
        
        // Add click event to apply the template
        card.addEventListener('click', () => applyTemplate(template));
        
        templatesContainer.appendChild(card);
    });
}

/**
 * Filter templates by category
 */
function filterTemplates() {
    const categorySelect = document.getElementById('template-category');
    const selectedCategory = categorySelect ? categorySelect.value : '';
    
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (!selectedCategory || cardCategory === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Apply a selected template to the policy builder
 * @param {Object} template - The template object
 */
function applyTemplate(template) {
    // Set basic information
    const nameInput = document.getElementById('policy-name');
    if (nameInput) {
        nameInput.value = template.name;
    }
    
    const descriptionInput = document.getElementById('policy-description');
    if (descriptionInput) {
        descriptionInput.value = template.description;
    }
    
    const effectSelect = document.getElementById('policy-effect');
    if (effectSelect) {
        // Find and select the matching effect option
        const effectOption = Array.from(effectSelect.options).find(option => 
            option.value === template.effect);
        
        if (effectOption) {
            effectOption.selected = true;
            // Trigger effect description update if such function exists
            if (typeof updateEffectDescription === 'function') {
                updateEffectDescription();
            }
        }
    }
    
    // Clear existing parameters
    const parametersContainer = document.getElementById('parameters-container');
    if (parametersContainer) {
        parametersContainer.innerHTML = '';
    }
    
    // Add template parameters
    if (template.parameters && Array.isArray(template.parameters)) {
        template.parameters.forEach(param => {
            if (typeof addParameter === 'function') {
                addParameter(param);
            }
        });
    }
    
    // Clear existing conditions
    const conditionBuilder = document.getElementById('condition-builder');
    if (conditionBuilder) {
        conditionBuilder.innerHTML = '';
    }
    
    // Parse and add policy rule conditions
    if (template.policyRule && template.policyRule.if) {
        parseConditionsFromRule(template.policyRule);
    }
    
    // Switch to the basic info tab
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === 'basic-info') {
            activateTab(button);
        }
    });
    
    // Generate policy preview
    if (typeof generatePolicy === 'function') {
        generatePolicy();
    }
}

/**
 * Parse conditions from a policy rule
 * @param {Object} policyRule - The policy rule object
 */
function parseConditionsFromRule(policyRule) {
    // This is a simplified version; the real implementation would need 
    // to handle complex rules with logical operators (allOf, anyOf, not)
    
    if (!policyRule || !policyRule.if) return;
    
    const ifCondition = policyRule.if;
    let conditions = [];
    
    // Handle single condition
    if (ifCondition.field && Object.keys(ifCondition).length > 1) {
        const operator = Object.keys(ifCondition).find(key => key !== 'field');
        if (operator) {
            conditions.push({
                field: ifCondition.field,
                operator: operator,
                value: ifCondition[operator]
            });
        }
    }
    // Handle allOf operator
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
    // Handle not operator
    else if (ifCondition.not) {
        if (ifCondition.not.field) {
            const operator = Object.keys(ifCondition.not).find(key => key !== 'field');
            if (operator) {
                const negatedOp = `not${operator.charAt(0).toUpperCase() + operator.slice(1)}`;
                conditions.push({
                    field: ifCondition.not.field,
                    operator: negatedOp,
                    value: ifCondition.not[operator]
                });
            }
        }
    }
    
    // Add parsed conditions to UI
    conditions.forEach(condition => {
        if (typeof addCondition === 'function') {
            addCondition(condition);
        }
    });
}

/**
 * Activate a tab
 * @param {HTMLElement} button - The tab button to activate
 */
function activateTab(button) {
    // Deactivate all tabs
    const allTabButtons = document.querySelectorAll('.tab-button');
    allTabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    const allTabContents = document.querySelectorAll('.tab-content');
    allTabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate selected tab
    button.classList.add('active');
    
    const tabId = button.getAttribute('data-tab');
    const tabContent = document.getElementById(`${tabId}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
}