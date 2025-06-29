const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Passkey = sequelize.define('passkey', {

  passkeyId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  publicKey: {
    type: DataTypes.TEXT  // ← الحل: بدّلنا STRING بـ TEXT
  }

}, {
  timestamps: true
});

module.exports = Passkey;
