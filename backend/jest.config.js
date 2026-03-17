module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/server.js'
  ],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./jest.setup.js']
};