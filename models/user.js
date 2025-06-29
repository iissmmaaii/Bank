const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    currentChallenge: {
        type: DataTypes.STRING,
        allowNull: true
    },
    challengeCreatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = User;