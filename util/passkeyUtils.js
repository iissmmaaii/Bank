const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { Passkey, User } = require('../models');

// 1. توليد خيارات تسجيل Passkey
const generatePasskeyRegistrationOptions = async (user) => {
  return await generateRegistrationOptions({
    rpName: 'My App',
    rpID: process.env.RP_ID,
    userID: user.id.toString(),
    userName: user.email,
    attestationType: 'none'
  });
};

// 2. التحقق من تسجيل Passkey
const verifyPasskeyRegistration = async (user, credential) => {
  return await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: process.env.ORIGIN,
    expectedRPID: process.env.RP_ID
  });
};

// 3. توليد خيارات مصادقة Passkey
const generatePasskeyAuthOptions = async (user) => {
  const passkeys = await Passkey.findAll({ where: { userId: user.id } });
  return await generateAuthenticationOptions({
    rpID: process.env.RP_ID,
    allowCredentials: passkeys.map(passkey => ({
      id: passkey.credentialID,
      type: 'public-key'
    }))
  });
};

// 4. التحقق من مصادقة Passkey
const verifyPasskeyAuth = async (user, credential) => {
  const passkey = await Passkey.findOne({ where: { userId: user.id } });
  return await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: process.env.ORIGIN,
    expectedRPID: process.env.RP_ID,
    authenticator: {
      credentialID: passkey.credentialID,
      credentialPublicKey: passkey.publicKey
    }
  });
};

module.exports = {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthOptions,
  verifyPasskeyAuth
};