const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const sequelize = require('./util/database');
require('dotenv').config();

const admin = require('firebase-admin');
const serviceAccount = require('./bank-61d15-firebase-adminsdk-fbsvc-446ec6d6a9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

// ⚙️ إعداد socket.io
const http = require('http');
const { Server } = require('socket.io');
const { setupSocket } = require('./socket/socketHandler'); // 👈 استدعاء ملفات السوكيت

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
setupSocket(io);
app.set('io', io); // جعل io متاح من داخل الـ controllers

// ⚙️ Middleware و إعدادات Express
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

// 🧠 النماذج
const User = require('./models/user');
const Account = require('./models/account');
const Card = require('./models/card');
const Passkey = require('./models/passkey');
const Role = require('./models/roles');
const UserRole = require('./models/user-role');
const Phone = require('./models/device');
const defineAssociations = require('./models/associations');
defineAssociations();

// 🛣️ الراوترات
app.use(require('./routes/auth'));
app.use(require('./routes/admin'));

// 🧯 مسار غير موجود
app.use((req, res) => {
  console.log(`🚫 Route not found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// 🚀 تشغيل السيرفر
sequelize.sync()
  .then(() => {
    server.listen(3001, '0.0.0.0', () => {
      console.log('🚀 Server with WebSocket is running on port 3001');
    });
  })
  .catch(err => {
    console.error('❌ Database sync error:', err);
  });
