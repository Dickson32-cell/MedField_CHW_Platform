module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            lines: 1
        }
    },
    coverageReporters: ["text", "lcov", "clover", "json"],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup.js'],
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/db/**",
        "!src/config/**"
    ]
};
