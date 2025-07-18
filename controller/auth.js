const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../util/database');
const User = require('../models/user');
const Account = require('../models/account');
const Role = require('../models/roles');
const UserRole = require('../models/user-role');
const Passkey = require('../models/passkey');
const Card = require('../models/card');
const Phone = require('../models/device');
const { generateCardNumber } = require('../util/cardHelper');
const crypto = require('crypto');
require('dotenv').config();

exports.signup = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { username, email, phoneNumber, publicKey } = req.body;
        if (!username || !email || !phoneNumber || !publicKey) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate public key format (basic check for PEM)
        if (!publicKey.includes('-----BEGIN PUBLIC KEY-----')) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Invalid public key format' });
        }

        const user = await User.create({
            userName: username,
            Email: email,
            phoneNumber: phoneNumber
        }, { transaction });

        await user.createAccount({ balance: 0 }, { transaction });

        const defaultRole = await Role.findOne({
            where: { roleName: 'user' },
            transaction
        });

        if (!defaultRole) {
            await transaction.rollback();
            return res.status(500).json({ error: 'Default role missing' });
        }

        await user.addRole(defaultRole, { transaction });

        await user.createCard({
            cardNumber: await generateCardNumber()
        }, { transaction });

        await Passkey.create({
            publicKey: publicKey, // Store PEM directly
            userId: user.userId,
        }, { transaction });

        await transaction.commit();

        res.status(201).json({ 
            success: true,
            user: {
                id: user.userId,
                username: user.userName,
                email: user.Email
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.loginStart = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const user = await User.findOne({
            where: { userId },
            include: [Passkey]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const passkey = await Passkey.findOne({ where: { userId: user.userId } });
        if (!passkey) {
            return res.status(400).json({ error: 'No passkey registered for this user' });
        }

        const challenge = crypto.randomBytes(32).toString('base64url');
        const challengeCreatedAt = new Date();

        await user.update({ 
            currentChallenge: challenge,
            challengeCreatedAt: challengeCreatedAt
        });

        res.json({ challenge });
    } catch (error) {
        console.error('Login start error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.loginFinish = async (req, res) => {
    try {
        const { userId, signature, deviceToken } = req.body;

        if (!userId || !signature) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await User.findOne({
            where: { userId },
            include: [Passkey]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const passkey = await Passkey.findOne({ where: { userId: user.userId } });
        if (!passkey) {
            return res.status(400).json({ error: 'No passkey registered for this user' });
        }

        // Check challenge timeout (e.g., 5 minutes)
        if (!user.challengeCreatedAt || !user.currentChallenge) {
            return res.status(400).json({ error: 'No valid challenge found' });
        }

        const challengeAge = (new Date() - new Date(user.challengeCreatedAt)) / 1000;
        if (challengeAge > 300) { // 5 minutes
            await user.update({ currentChallenge: null, challengeCreatedAt: null });
            return res.status(400).json({ error: 'Challenge expired' });
        }

        // Debug: Print challenge and signature for verification
        console.log('Challenge in Backend:', user.currentChallenge);
        console.log('Received Signature:', signature);

        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(user.currentChallenge); // Use as Base64 URL-safe string

        const isValid = verifier.verify(
            passkey.publicKey, // Use PEM directly
            signature,
            'base64'
        );

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        await user.update({ currentChallenge: null, challengeCreatedAt: null });
        console.log('hello this is device token');
        console.log(deviceToken)

        if (deviceToken) {
            await Phone.upsert({
                userId: user.userId,
                deviceToken: deviceToken
            }, {
                conflictFields: ['userId']
            });
        }

        const roles = await user.getRoles().then(roles => roles.map(r => r.roleName));
        const token = jwt.sign({
            userId: user.userId,
            roles,
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        }, process.env.JWT_SECRET);

        res.json({
            success: true,
            token,
            user: {
                id: user.userId,
                username: user.userName,
                email: user.Email
            }
        });
    } catch (error) {
        console.error('Login finish error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Device token already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
