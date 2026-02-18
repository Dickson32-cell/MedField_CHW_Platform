const { Sequelize } = require('sequelize');
const { sequelize } = require('../src/models');

// Mocking database for tests
beforeAll(async () => {
    // We need to re-initialize the sequelize instance for tests to use SQLite
    // This is a bit tricky because the models are already imported and bound to the original sequelize instance.
    // A better way is to use a test environment variable to change the dialect in src/config/database.js
});

// For simplicity in this setup, we will ensure NODE_ENV is test
process.env.NODE_ENV = 'test';

// We will mock the database config if necessary or rely on env vars
// In a real scenario, src/config/database.js would handle 'test' dialect.

// Clear database between tests if using a persistent one, but we prefer in-memory
beforeEach(async () => {
    // Sync database
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});
