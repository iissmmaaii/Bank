const Card = require('../models/card');
const User = require('../models/user');
const Phone = require('../models/device');
const Account = require('../models/account');
const admin = require('firebase-admin');
const sequelize = require('../util/database');
const axios = require('axios');
const { where } = require('sequelize');

console.log("📦 Admin routes loaded");

// ✅ 1. جلب معلومات المستخدم
exports.getinfo = async (req, res, next) => {
  console.log('✅ تابع getinfo تم استدعاؤه');
  console.log('🕒 الطلب الوارد:', req.body);

  try {
    const { userId } = req.body;
    if (!userId) {
      console.log('❌ خطأ: userId مطلوب');
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      console.log('❌ المستخدم غير موجود:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const card = await Card.findOne({ where: { userId } });

    const responseData = {
      id: user.userId,
      username: user.userName,
      email: user.Email,
      phoneNumber: user.phoneNumber,
      cardNumber: card ? card.cardNumber : null
    };

    console.log('📤 الاستجابة:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ خطأ في getinfo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ 2. إرسال طلب الدفع
const { v4: uuidv4 } = require('uuid');
const PendingPayment = require('../models/pending-payment'); // تأكد إنك مستورد هذا النموذج

exports.processPayment = async (req, res) => {
  try {
    const { cardNumber, amount, username, email } = req.body;
    const paymentAmount = parseFloat(amount);

    if (!cardNumber || !amount) {
      return res.status(400).json({ success: false, message: 'البيانات ناقصة' });
    }

    const card = await Card.findOne({
      where: { cardNumber },
      include: [{ model: Account }],
    });

    if (!card || !card.account) {
      throw new Error('بطاقة أو حساب غير صالح');
    }

    const userId = card.account.userId;

    const deviceTokenEntry = await Phone.findOne({ where: { userId } });

    if (!deviceTokenEntry || !deviceTokenEntry.deviceToken) {
      throw new Error('لا يوجد توكن للمستخدم');
    }

    const userDeviceToken = deviceTokenEntry.deviceToken;
    const transactionId = "1"; // توليد رقم العملية

    // إرسال إشعار Firebase
    await admin.messaging().send({
      token: userDeviceToken,
      notification: {
        title: 'طلب دفع جديد',
        body: `هل توافق على دفع ${paymentAmount}؟`,
      },
      data: {
        userId: userId.toString(),
        amount: paymentAmount.toString(),
        cardNumber,
        transactionId, // ضروري
      },
    });

    // حفظ العملية بقاعدة البيانات
    await PendingPayment.create({
      transactionId,
      userId,
      cardNumber,
      amount: paymentAmount,
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'تم إرسال الإشعار، بانتظار موافقة المستخدم.',
      transactionId,
    });

  } catch (err) {
    console.error('❌ خطأ في processPayment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.approvePayment = async (req, res) => {
  try {
    const { userId, amount, cardNumber } = req.body;
    const paymentAmount = parseFloat(parseFloat(amount).toFixed(2));
     transactionId="1";


    if (!userId || !amount || !cardNumber || !transactionId) {
      return res.status(400).json({ success: false, message: 'بيانات ناقصة' });
    }

    const card = await Card.findOne({
      where: { cardNumber },
      include: [{ model: Account, required: true }],
    });
    if (!card) {
      console.log("❌ لم يتم العثور على البطاقة");
      throw new Error('تفاصيل البطاقة غير صحيحة');
    }

    console.log("✅ تم العثور على البطاقة:");
    console.log(JSON.stringify(card, null, 2));

    if (!card.account) {
      console.log("❌ لم يتم العثور على الحساب المرتبط بالبطاقة");
      throw new Error('البطاقة غير مرتبطة بحساب صالح');
    }

    if (!card) throw new Error('تفاصيل البطاقة غير صحيحة');

    if (card.account.balance < paymentAmount) {
      throw new Error('الرصيد غير كافٍ');
    }

  await sequelize.query(
  'UPDATE accounts SET balance = balance - :amount WHERE accountId = :accountId',
  {
    replacements: {
      amount: paymentAmount,
      accountId: card.account.accountId,
    },
    type: sequelize.QueryTypes.UPDATE,
  }
);



    await card.account.reload();

    // إرسال النتيجة عبر WebSocket
    const io = req.app.get('io');
    io.to(transactionId).emit('payment-result', {
      status: 'approved',
      transactionId,
      amount: paymentAmount,
    });

    // تحديث حالة العملية إلى approved
    await PendingPayment.update(
      { status: 'approved' },
      { where: { transactionId } }
    );

    res.json({ success: true, message: 'تمت الموافقة على العملية' });

  } catch (err) {
    console.error('❌ خطأ في approvePayment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.rejectPayment = async (req, res) => {
  try {
    const { userId, amount, cardNumber } = req.body;
        transactionId="1";


    if (!userId || !amount || !cardNumber || !transactionId) {
      return res.status(400).json({ success: false, message: 'بيانات ناقصة' });
    }

    // إرسال النتيجة عبر WebSocket
    const io = req.app.get('io');
    io.to(transactionId).emit('payment-result', {
      status: 'rejected',
      transactionId,
      amount,
    });

    // تحديث حالة العملية إلى rejected
    await PendingPayment.update(
      { status: 'rejected' },
      { where: { transactionId } }
    );

    res.json({ success: true, message: 'تم الرفض وإبلاغ الموقع التجاري' });

  } catch (err) {
    console.error('❌ خطأ في rejectPayment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
