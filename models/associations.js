const User = require('./user');
const Account = require('./account');
const Card = require('./card');
const Passkey = require('./passkey');
const Role = require('./roles');
const UserRole = require('./user-role');
const Phone=require('./device')

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
  User.hasMany(Card, { foreignKey: 'userId' });
  Card.belongsTo(User, { foreignKey: 'userId' });

  // User and Role many-to-many relationship
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId',otherKey: 'roleId' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId',otherKey: 'userId' });
  User.hasMany(Phone, { foreignKey: 'userId' });
  Phone.belongsTo(User, { foreignKey: 'userId' });
}

module.exports = defineAssociations;