const express = require('express');
const adminController = require('../controller/admin');
const router = express.Router();

router.get('/admin/login', adminController.getIndex);
router.post('/admin/login', adminController.postAdmin);
router.get('/admin/dashoard', adminController.getDashboard);
router.get('/admin/user/add', adminController.getAddUser);
router.post('/admin/user/add', adminController.postAddUser);
router.post('/api/process-payment', adminController.processPayment);
router.post('/api/checkinformation',adminController.postCheck);



module.exports = router;