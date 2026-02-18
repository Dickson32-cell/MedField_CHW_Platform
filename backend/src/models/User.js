const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  role: {
    type: DataTypes.ENUM('chw', 'supervisor', 'district_officer', 'admin'),
    defaultValue: 'chw'
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  managed_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  },
  device_id: {
    type: DataTypes.STRING(100)
  },
  location: {
    type: DataTypes.JSONB,
    defaultValue: { lat: null, lng: null }
  },
  refresh_token: {
    type: DataTypes.STRING(255)
  }
});

module.exports = User;
