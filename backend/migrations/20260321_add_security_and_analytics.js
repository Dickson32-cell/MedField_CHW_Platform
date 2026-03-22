'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Refresh Tokens table
    await queryInterface.createTable('RefreshTokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      token: { type: Sequelize.TEXT, allowNull: false, unique: true },
      userId: { type: Sequelize.INTEGER, allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Audit Logs table
    await queryInterface.createTable('AuditLogs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: Sequelize.INTEGER, allowNull: true },
      action: { type: Sequelize.STRING(100), allowNull: false },
      details: { type: Sequelize.JSON, allowNull: true },
      ipAddress: { type: Sequelize.STRING(45), allowNull: true },
      userAgent: { type: Sequelize.TEXT, allowNull: true },
      timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Citations table (for tracking academic citations)
    await queryInterface.createTable('Citations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      citedBy: { type: Sequelize.STRING(255), allowNull: false },
      citationSource: { type: Sequelize.STRING(100), allowNull: false },
      citationUrl: { type: Sequelize.TEXT, allowNull: true },
      paperTitle: { type: Sequelize.STRING(500), allowNull: false },
      authors: { type: Sequelize.TEXT, allowNull: true },
      publishedDate: { type: Sequelize.DATE, allowNull: true },
      citationCount: { type: Sequelize.INTEGER, defaultValue: 1 },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Organizations table (for tracking institutional adoption)
    await queryInterface.createTable('Organizations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      type: { type: Sequelize.ENUM('hospital', 'clinic', 'ngo', 'research', 'government', 'other'), allowNull: false },
      country: { type: Sequelize.STRING(100), allowNull: false },
      region: { type: Sequelize.STRING(100), allowNull: true },
      deploymentSize: { type: Sequelize.INTEGER, allowNull: true },
      deploymentDate: { type: Sequelize.DATE, allowNull: true },
      contactName: { type: Sequelize.STRING(255), allowNull: true },
      contactEmail: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Add indexes
    await queryInterface.addIndex('RefreshTokens', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['action']);
    await queryInterface.addIndex('AuditLogs', ['timestamp']);
    await queryInterface.addIndex('Citations', ['paperTitle']);
    await queryInterface.addIndex('Organizations', ['country']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Organizations');
    await queryInterface.dropTable('Citations');
    await queryInterface.dropTable('AuditLogs');
    await queryInterface.dropTable('RefreshTokens');
  }
};
