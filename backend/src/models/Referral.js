const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  referral_number: {
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
    references: { model: 'users', key: 'id' }
  },
  visit_id: {
    type: DataTypes.UUID,
    references: { model: 'visits', key: 'id' }
  },
  referral_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  referred_to_facility: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  referral_reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  clinical_notes: {
    type: DataTypes.TEXT
  },
  vital_signs: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'not_completed', 'cancelled'),
    defaultValue: 'pending'
  },
  appointment_date: {
    type: DataTypes.DATEONLY
  },
  facility_feedback: {
    type: DataTypes.TEXT
  },
  outcome: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  sms_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sms_confirmation: {
    type: DataTypes.STRING(20)
  }
});

module.exports = Referral;
