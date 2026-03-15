const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patient_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100)
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  household_id: {
    type: DataTypes.UUID,
    references: { model: 'households', key: 'id' }
  },
  risk_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  risk_factors: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  is_pregnant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  due_date: {
    type: DataTypes.DATEONLY
  },
  last_visit_date: {
    type: DataTypes.DATE
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: { lat: null, lng: null }
  },
  chronic_conditions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  allergies: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  medications: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  emergency_contact: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['household_id'] },
    { fields: ['is_active'] },
    { fields: ['risk_score'] },
    { fields: ['last_visit_date'] }
  ]
});

module.exports = Patient;
