const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Account = sequelize.define('account', {
  accountId: {
    type: DataTypes.INTEGER, 
    primaryKey: true,
    autoIncrement: true
  },
  balance: {
    type: DataTypes.DECIMAL(25, 2), 
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Account;