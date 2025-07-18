const express = require('express');
const adminController = require('../controller/admin');
const router = express.Router();
router.post('/getinfo',adminController.getinfo);
router.post('/api/process-payment', adminController.processPayment);
router.post('/approve-payment', adminController.approvePayment);
router.post('/reject-payment', adminController.rejectPayment);


module.exports = router;
