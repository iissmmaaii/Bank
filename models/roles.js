const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Role = sequelize.define('role', {
  roleId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  roleName: DataTypes.STRING,
}, {
  timestamps: true
});

module.exports = Role;