const User = require('./user');
const Account = require('./account');
const Card = require('./card');
const Passkey = require('./passkey');
const Role = require('./roles');
const UserRole = require('./user-role');
const Phone = require('./device');
const PendingPayment = require('./pending-payment');

function defineAssociations() {
  // User has many Accounts
  User.hasMany(Account, { foreignKey: 'userId' });
  Account.belongsTo(User, { foreignKey: 'userId' });

  // Account has many Cards
  Account.hasMany(Card, { foreignKey: 'accountId' });
  Card.belongsTo(Account, { foreignKey: 'accountId' });

  // User has one Passkey
  User.hasOne(Passkey, { foreignKey: 'userId' });
  Passkey.belongsTo(User, { foreignKey: 'userId' });

  // User has many Cards directly
  User.hasMany(Card, { foreignKey: 'userId' });
  Card.belongsTo(User, { foreignKey: 'userId' });

  // User and Role many-to-many relationship
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId' });

  // User has many Devices
  User.hasMany(Phone, { foreignKey: 'userId' });
  Phone.belongsTo(User, { foreignKey: 'userId' });

  // ✅ PendingPayment Relationships
  // كل PendingPayment مرتبط بـ User و Card
  PendingPayment.belongsTo(User, { foreignKey: 'userId' });
  PendingPayment.belongsTo(Card, { foreignKey: 'cardId' });
  User.hasMany(PendingPayment, { foreignKey: 'userId' });
  Card.hasMany(PendingPayment, { foreignKey: 'cardId' });

}

module.exports = defineAssociations;
