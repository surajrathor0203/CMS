const express = require('express');
const router = express.Router();
const { signup, forgotPassword, verifyOTP, resetPassword, login } = require('../controllers/authController');

// Auth routes
router.post('/login', login);

router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
