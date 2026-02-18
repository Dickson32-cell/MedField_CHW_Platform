const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Household = sequelize.define('Household', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  household_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  head_of_household: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: { lat: null, lng: null }
  },
  gps_coordinates: {
    type: DataTypes.STRING(100)
  },
  community: {
    type: DataTypes.STRING(100)
  },
  village: {
    type: DataTypes.STRING(100)
  },
  ward: {
    type: DataTypes.STRING(100)
  },
  catchment_area: {
    type: DataTypes.STRING(100)
  },
  created_by: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  indexes: [
    { fields: ['household_number'] },
    { fields: ['created_by'] },
    { fields: ['community'] },
    { fields: ['village'] }
  ]
});

module.exports = Household;
