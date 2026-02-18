const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SyncLog = sequelize.define('SyncLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  sync_type: {
    type: DataTypes.ENUM('push', 'pull', 'full'),
    defaultValue: 'push'
  },
  records_pushed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  records_pulled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conflicts: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('success', 'partial', 'failed'),
    defaultValue: 'success'
  },
  error_message: {
    type: DataTypes.TEXT
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE
  },
  network_type: {
    type: DataTypes.STRING(20)
  }
});

module.exports = SyncLog;
