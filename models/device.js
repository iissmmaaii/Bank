// models/phone.js
const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Phone = sequelize.define('Phone', {
  phoneId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  deviceToken: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Phone;