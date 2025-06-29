const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const UserRole = sequelize.define('userRole', {}, {
  timestamps: true
});

module.exports = UserRole;