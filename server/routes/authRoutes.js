const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  signup, 
  forgotPassword, 
  verifyOTP, 
  resetPassword, 
  login,
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherPassword 
} = require('../controllers/authController');

// Auth routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Teacher profile routes
router.get('/teacher/profile/:id', auth, getTeacherProfile);
router.put('/teacher/profile/:id', auth, updateTeacherProfile);
router.put('/teacher/profile/:id/password', auth, updateTeacherPassword);

module.exports = router;
