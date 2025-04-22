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
  ],
  // Mock CSS imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js'
  },
  // Transform files
  transform: {},
  // Test timeout
  testTimeout: 10000
};