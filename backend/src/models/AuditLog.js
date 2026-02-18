const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN_FAIL'
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false // e.g., 'Patient', 'Visit', 'User'
    },
    entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    changes: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['action'] },
        { fields: ['entity_type'] },
        { fields: ['entity_id'] },
        { fields: ['created_at'] }
    ]
});

module.exports = AuditLog;
