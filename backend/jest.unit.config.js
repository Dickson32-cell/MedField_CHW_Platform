module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  detectOpenHandles: false,
  setupFilesAfterEnv: [],
  // Skip the global setup that tries to sync the database
  globalSetup: undefined,
  globalTeardown: undefined,
  testTimeout: 10000
};