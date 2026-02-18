const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplyReport = sequelize.define('SupplyReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  supply_id: {
    type: DataTypes.UUID,
    references: { model: 'supplies', key: 'id' },
    allowNull: false
  },
  chw_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  report_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  quantity_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_remaining: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_needed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_low_stock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = SupplyReport;
