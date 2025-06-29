const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Card = sequelize.define('card', {
  cardId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cardNumber: {
    type: DataTypes.STRING(16),
    unique: true,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Card;