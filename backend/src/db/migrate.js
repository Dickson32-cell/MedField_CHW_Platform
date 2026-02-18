/**
 * Database Migration Script
 * Run with: node src/db/migrate.js
 */

const { sequelize } = require('../models');

async function migrate() {
  console.log('Starting database migration...');

  try {
    // Create tables
    await sequelize.sync({ alter: true });
    console.log('Database tables created/updated successfully');

    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
