const express = require('express');
const adminController = require('../controller/auth');
const router = express.Router();
router.post('/signfirst',adminController.signup);
router.post('/loginstart',adminController.loginStart);
router.post('/loginfinish',adminController.loginFinish);





module.exports = router;