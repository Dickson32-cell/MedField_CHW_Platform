const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supply = sequelize.define('Supply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('medication', 'vaccine', 'supplies', 'equipment', 'other'),
    defaultValue: 'medication'
  },
  unit: {
    type: DataTypes.STRING(50)
  },
  quantity_on_hand: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  expiry_date: {
    type: DataTypes.DATEONLY
  },
  batch_number: {
    type: DataTypes.STRING(100)
  },
  location: {
    type: DataTypes.STRING(100)
  },
  supplied_by: {
    type: DataTypes.STRING(200)
  },
  last_restock_date: {
    type: DataTypes.DATEONLY
  }
});

module.exports = Supply;
