const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

const sequelize = isTest
  ? new Sequelize('sqlite::memory:', { logging: false })
  : new Sequelize(
    process.env.DB_NAME || 'medfield',
    process.env.DB_USER || 'medfield_user',
    process.env.DB_PASSWORD || 'medfield_password',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 50,
        min: 5,
        acquire: 60000,
        idle: 5000,
        evict: 1000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );

module.exports = sequelize;
