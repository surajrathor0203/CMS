const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');

// Auth routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
