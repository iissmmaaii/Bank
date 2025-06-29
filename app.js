const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const sequelize = require('./util/database');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://localhost:3000', 'https://your-flutter-app-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.set('view engine', 'ejs');
app.set('views', 'views');
const User = require('./models/user');
const Account = require('./models/account');
const Card = require('./models/card');
const Passkey = require('./models/passkey');
const Role = require('./models/roles');
const UserRole = require('./models/user-role');
const Phone = require('./models/device');

const defineAssociations = require('./models/associations');
const { FORCE } = require('sequelize/lib/index-hints');
defineAssociations();
app.use(async (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    
    if (!token) return next();
    
    const decoded = jwt.verify(token, 'your-strong-secret-key-here');
    const user = await User.findByPk(decoded.userId, {
      include: [Role]
    });
    
    if (!user) throw new Error('User not found');
    
    req.user = user;
    res.locals.user = user.get({ plain: true });
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.use(require('./routes/auth'));

sequelize.sync()
  .then(() => {
    app.listen(3001, '0.0.0.0', () => {
      console.log('Server is running on port 3001');
    });
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });