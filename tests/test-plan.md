# Azure Policy Generator Test Plan

This document outlines a comprehensive testing strategy for the Azure Policy Generator to ensure all functionality works correctly across different environments and edge cases.

## Test Framework Setup

We'll use Jest for unit and integration testing, with additional tools for end-to-end testing:

```bash
# Install testing dependencies
npm init -y
npm install --save-dev jest jest-environment-jsdom @testing-library/dom @testing-library/jest-dom jest-html-reporter

# Install browser automation for E2E tests
npm install --save-dev puppeteer
```

## Test Directory Structure

```
/tests
├── unit/                     # Unit tests for individual functions
│   ├── utils/                # Tests for utility functions
│   └── components/           # Tests for component logic
├── integration/              # Integration tests for interconnected components
├── e2e/                      # End-to-end tests for complete workflows
├── fixtures/                 # Test fixtures and mock data
├── helpers/                  # Test helper functions
├── setup.js                  # Jest setup file
└── test-plan.md              # This test plan
```

## 1. Unit Tests

### 1.1 Policy Generator Tests (`/tests/unit/utils/policyGenerator.test.js`)

```javascript
describe('PolicyGenerator', () => {
  describe('generatePolicy', () => {
    test('generates a valid policy with basic options', () => {
      const options = {
        name: 'Test Policy',
        description: 'Test Description',
        mode: 'Indexed',
        effect: 'Audit'
      };
      const policy = PolicyGenerator.generatePolicy(options);
      expect(policy).toHaveProperty('properties');
      expect(policy.properties.displayName).toBe('Test Policy');
      expect(policy.properties.description).toBe('Test Description');
      expect(policy.properties.mode).toBe('Indexed');
      expect(policy.properties.policyRule.then.effect).toBe('Audit');
    });

    test('handles parameters correctly', () => {
      const options = {
        name: 'Test Policy',
        parameters: [
          {
            name: 'testParam',
            type: 'String',
            defaultValue: 'test',
            allowedValues: ['test', 'prod']
          }
        ]
      };
      const policy = PolicyGenerator.generatePolicy(options);
      expect(policy.properties.parameters).toHaveProperty('testParam');
      expect(policy.properties.parameters.testParam.type).toBe('String');
      expect(policy.properties.parameters.testParam.defaultValue).toBe('test');
      expect(policy.properties.parameters.testParam.allowedValues).toContain('test');
    });

    test('handles various condition structures correctly', () => {
      // Tests for single condition
      // Tests for multiple conditions with allOf/anyOf
      // Tests for nested conditions
    });

    test('handles different effects correctly', () => {
      // Tests for simple effects (Audit, Deny)
      // Tests for complex effects (DeployIfNotExists, AuditIfNotExists)
      // Tests for parameterized effects
    });

    test('throws error on invalid inputs', () => {
      expect(() => PolicyGenerator.generatePolicy({})).toThrow();
      expect(() => PolicyGenerator.generatePolicy({ name: '' })).toThrow();
    });
  });

  // Test other methods
  describe('_formatParamValue', () => {
    test('correctly formats string values', () => { /* ... */ });
    test('correctly formats number values', () => { /* ... */ });
    test('correctly formats boolean values', () => { /* ... */ });
    test('correctly formats array values', () => { /* ... */ });
    test('correctly formats object values', () => { /* ... */ });
  });

  // Similar tests for _generateParameters, _processNestedConditions, etc.
});
```

### 1.2 Policy Validator Tests (`/tests/unit/utils/policyValidator.test.js`)

```javascript
describe('PolicyValidator', () => {
  describe('validatePolicy', () => {
    test('validates a correct policy with no errors', () => {
      const validPolicy = { /* valid policy structure */ };
      const result = PolicyValidator.validatePolicy(validPolicy);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('catches missing required fields', () => {
      const invalidPolicy = { properties: {} }; // Missing displayName, etc.
      const result = PolicyValidator.validatePolicy(invalidPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validates policy rule structure', () => {
      const invalidRule = {
        properties: {
          displayName: 'Test',
          mode: 'Indexed',
          policyRule: { 
            /* Invalid rule structure */
          }
        }
      };
      const result = PolicyValidator.validatePolicy(invalidRule);
      expect(result.valid).toBe(false);
    });

    // More specific validation tests for different parts of the policy
  });
});
```

### 1.3 Component Logic Tests

For each component (parameterBuilder, conditionBuilder, etc.), test their core functionality:

```javascript
describe('ConditionBuilder', () => {
  test('creates a condition element correctly', () => {
    document.body.innerHTML = '<div id="test-container"></div>';
    const container = document.getElementById('test-container');
    const condition = createConditionElement();
    expect(condition.tagName).toBe('DIV');
    expect(condition.classList.contains('condition')).toBe(true);
  });
  
  test('builds correct condition structure from UI elements', () => {
    // Setup mock DOM with condition elements
    // Call getConditions()
    // Validate structure matches expected output
  });
});
```

## 2. Integration Tests

### 2.1 Policy Generation Workflow (`/tests/integration/policyWorkflow.test.js`)

```javascript
describe('Policy Generation Workflow', () => {
  // Setup mock DOM with all required elements
  
  beforeEach(() => {
    document.body.innerHTML = fs.readFileSync('./src/index.html', 'utf8');
    // Initialize components
    initParameterBuilder();
    initConditionBuilder();
    // etc.
  });
  
  test('generates a complete policy from UI interactions', () => {
    // Fill in policy name
    document.getElementById('policy-name').value = 'Test Policy';
    
    // Add a parameter
    document.getElementById('add-parameter').click();
    // Fill parameter details
    
    // Add a condition
    document.getElementById('add-condition').click();
    // Configure condition
    
    // Generate policy
    document.getElementById('generate-policy').click();
    
    // Verify JSON output
    const policyJson = document.getElementById('policy-json').textContent;
    const policy = JSON.parse(policyJson);
    expect(policy.properties.displayName).toBe('Test Policy');
    // More assertions on the policy structure
  });
  
  test('handles template selection and customization', () => {
    // Navigate to templates tab
    document.querySelector('[data-tab="templates"]').click();
    
    // Select a template
    // Verify template data loaded correctly
    // Customize template
    // Generate policy
    // Verify policy matches expected structure
  });
});
```

### 2.2 Theme Switching (`/tests/integration/themeSwitching.test.js`)

```javascript
describe('Theme Switching', () => {
  beforeEach(() => {
    document.body.innerHTML = fs.readFileSync('./src/index.html', 'utf8');
    // Clear localStorage
    localStorage.clear();
    // Initialize theme
    initTheme();
  });
  
  test('default theme is set based on system preference', () => {
    // Mock system preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query
    }));
    
    // Re-initialize theme
    initTheme();
    
    // Check if dark theme is applied
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });
  
  test('theme toggle switches between light and dark', () => {
    // Start with light theme
    document.body.classList.remove('dark-theme');
    
    // Click toggle
    document.getElementById('theme-toggle').click();
    
    // Check if dark theme is applied
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    
    // Click toggle again
    document.getElementById('theme-toggle').click();
    
    // Check if light theme is applied
    expect(document.body.classList.contains('dark-theme')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
```

## 3. End-to-End Tests

### 3.1 Complete Policy Creation Flow (`/tests/e2e/policyCreation.test.js`)

```javascript
describe('End-to-End Policy Creation', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('file://' + path.resolve('./src/index.html'));
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('Create a complete policy through UI', async () => {
    // Enter policy name
    await page.type('#policy-name', 'E2E Test Policy');
    
    // Enter description
    await page.type('#policy-description', 'Policy created during E2E test');
    
    // Select effect
    await page.select('#policy-effect', 'Deny');
    
    // Navigate to parameters tab
    await page.click('.tab-button[data-tab="parameters"]');
    
    // Add parameter
    await page.click('#add-parameter');
    await page.type('.parameter-row:last-child input[name="param-name"]', 'testParam');
    await page.select('.parameter-row:last-child select[name="param-type"]', 'String');
    await page.type('.parameter-row:last-child input[name="param-default"]', 'default-value');
    
    // Navigate to conditions tab
    await page.click('.tab-button[data-tab="conditions"]');
    
    // Add condition
    await page.click('#add-condition');
    // Configure condition (select field, operator, value)
    
    // Generate policy
    await page.click('#generate-policy');
    
    // Verify JSON generated correctly
    const policyJson = await page.$eval('#policy-json', el => el.textContent);
    const policy = JSON.parse(policyJson);
    expect(policy.properties.displayName).toBe('E2E Test Policy');
    expect(policy.properties.policyRule.then.effect).toBe('Deny');
    // More assertions
  });
});
```

### 3.2 Cross-Browser Testing (`/tests/e2e/crossBrowser.test.js`)

Implement tests that run in different browsers (Chrome, Firefox, Safari, Edge) to ensure cross-browser compatibility.

## 4. Edge Cases and Error Handling Tests

### 4.1 Empty/Invalid Inputs (`/tests/unit/edgeCases.test.js`)

```javascript
describe('Edge Cases', () => {
  test('handles empty policy name', () => {
    // Setup form with empty name
    // Trigger generation
    // Verify appropriate error is shown
  });
  
  test('handles invalid parameter values', () => {
    // Setup with invalid parameter configuration
    // Verify validation catches issues
  });
  
  test('handles incomplete conditions', () => {
    // Setup with partial condition (missing fields)
    // Verify appropriate handling
  });
});
```

### 4.2 Performance Tests for Large Policies (`/tests/performance/largePolicy.test.js`)

```javascript
describe('Performance Tests', () => {
  test('generates large policy with many conditions efficiently', () => {
    // Create a policy with 50+ conditions
    // Measure generation time
    // Ensure it completes within acceptable threshold
  });
  
  test('handles large policy templates efficiently', () => {
    // Load and apply a large template
    // Measure rendering time
    // Ensure UI remains responsive
  });
});
```

## 5. Accessibility Tests

### 5.1 Keyboard Navigation (`/tests/accessibility/keyboard.test.js`)

```javascript
describe('Keyboard Navigation', () => {
  test('all interactive elements are reachable via keyboard', async () => {
    // Tab through all elements
    // Verify focus states
    // Verify all actions can be triggered via keyboard
  });
});
```

### 5.2 Screen Reader Compatibility (`/tests/accessibility/screenReader.test.js`)

Test with screen reader software to ensure proper ARIA attributes and semantic HTML.

## Test Automation Setup

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/vendor/**'
  ],
  coverageReporters: ['text', 'html'],
  reporters: [
    'default',
    ['./node_modules/jest-html-reporter', {
      pageTitle: 'Azure Policy Generator Test Report',
      outputPath: './tests/report.html'
    }]
  ]
};
```

### Setup File (`/tests/setup.js`)

```javascript
// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn().mockImplementation((url) => {
  // Return different mock data based on URL
  if (url.includes('policyEffects.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        effects: [
          { name: 'Audit', description: 'Test description' },
          { name: 'Deny', description: 'Test description' }
        ]
      })
    });
  }
  // More mocks for other data files
});

// Mock window methods
global.alert = jest.fn();
global.confirm = jest.fn().mockImplementation(() => true);
```

## Running Tests

Add to `package.json`:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "jest tests/e2e",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration"
}
```

## Continuous Integration

Create a GitHub Actions workflow file:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Upload coverage
      uses: actions/upload-artifact@v2
      with:
        name: coverage
        path: coverage
```

## Manual Testing Checklist

In addition to automated tests, maintain a manual testing checklist for pre-release verification:

1. **Visual Inspection**
   - Verify all UI elements render correctly
   - Test dark/light themes
   - Check responsive layout at different screen sizes

2. **Feature Testing**
   - Test all tabs and navigation
   - Verify all form inputs and validations
   - Test policy generation with different combinations
   - Verify template selection and application
   - Test export functionality

3. **Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify on macOS, Windows, Linux

4. **User Flow Testing**
   - Complete end-to-end policy creation
   - Verify helpful error messages
   - Test all keyboard shortcuts

## Test Reporting

Automated reports will be generated after each test run:
- Coverage report in `./coverage/index.html`
- Test results in `./tests/report.html`

Review these reports to identify areas needing more test coverage or improvements.