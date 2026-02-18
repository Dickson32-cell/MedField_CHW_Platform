const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  visit_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  patient_id: {
    type: DataTypes.UUID,
    references: { model: 'patients', key: 'id' },
    allowNull: false
  },
  chw_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' },
    allowNull: false
  },
  visit_type: {
    type: DataTypes.ENUM('scheduled', 'follow_up', 'emergency', 'referral_follow', 'outreach'),
    defaultValue: 'scheduled'
  },
  visit_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  visit_status: {
    type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'missed', 'cancelled'),
    defaultValue: 'planned'
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: { lat: null, lng: null }
  },
  gps_coordinates: {
    type: DataTypes.STRING(100)
  },
  vitals: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  symptoms: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  diagnosis: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  treatment: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  referral: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT
  },
  next_visit_date: {
    type: DataTypes.DATEONLY
  },
  danger_signs_detected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  danger_signs: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  duration_minutes: {
    type: DataTypes.INTEGER
  },
  synced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  synced_at: {
    type: DataTypes.DATE
  }
}, {
  indexes: [
    { fields: ['visit_number'] },
    { fields: ['patient_id'] },
    { fields: ['chw_id'] },
    { fields: ['visit_date'] },
    { fields: ['visit_status'] }
  ]
});

module.exports = Visit;
