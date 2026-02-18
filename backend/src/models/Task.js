const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patient_id: {
    type: DataTypes.UUID,
    references: { model: 'patients', key: 'id' }
  },
  household_id: {
    type: DataTypes.UUID,
    references: { model: 'households', key: 'id' }
  },
  chw_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  task_type: {
    type: DataTypes.ENUM('visit', 'follow_up', 'immunization', 'nutrition', 'delivery', 'referral', 'supply'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  assigned_date: {
    type: DataTypes.DATE
  },
  completed_date: {
    type: DataTypes.DATE
  },
  visit_id: {
    type: DataTypes.UUID,
    references: { model: 'visits', key: 'id' }
  },
  risk_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Task;
