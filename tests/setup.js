// Import Jest DOM matchers
require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch API
global.fetch = jest.fn().mockImplementation((url) => {
  // Return different mock data based on URL
  if (url.includes('policyEffects.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        effects: [
          { name: 'Audit', description: 'Creates an audit record' },
          { name: 'Deny', description: 'Prevents the resource action' },
          { name: 'Disabled', description: 'Turns off enforcement' }
        ]
      })
    });
  }
  
  if (url.includes('resourceTypes.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          name: 'Microsoft.Compute/virtualMachines',
          description: 'Virtual Machines',
          properties: [
            { field: 'type', displayName: 'Resource Type' },
            { field: 'location', displayName: 'Location' }
          ]
        }
      ])
    });
  }
  
  if (url.includes('policyTemplates.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        templates: [
          {
            name: 'Test Template',
            description: 'A test template',
            category: 'General',
            effect: 'Audit',
            parameters: [],
            policyRule: {}
          }
        ],
        categories: [
          { name: 'General', description: 'General policies' }
        ]
      })
    });
  }
  
  // Default response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
});

// Mock window methods
global.alert = jest.fn();
global.confirm = jest.fn().mockImplementation(() => true);

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost/'
};

// Mock document.execCommand for clipboard operations
document.execCommand = jest.fn().mockImplementation(() => true);

// Mock URL and Blob APIs for file downloads
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = jest.fn().mockImplementation(() => 'blob:test');
  global.URL.revokeObjectURL = jest.fn();
}

global.Blob = jest.fn().mockImplementation((content, options) => ({
  size: 0,
  type: options?.type || '',
}));

// Mock setTimeout and clearTimeout
jest.useFakeTimers();