const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const timeout = require('connect-timeout');
const { 
  signup, 
  forgotPassword, 
  verifyOTP, 
  resetPassword, 
  login,
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherPassword,
  verifyEmail,
  verifySignupOTP,
  verifyEmailLimiter
} = require('../controllers/authController');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Add timeout middleware
const requestTimeout = timeout('15s');
const haltOnTimedout = (req, res, next) => {
  if (!req.timedout) next();
};

// Apply rate limiting and timeout to verification routes
router.post('/verify-email', requestTimeout, verifyEmailLimiter, verifyEmail, haltOnTimedout);
router.post('/verify-signup-otp', requestTimeout, verifyEmailLimiter, verifySignupOTP, haltOnTimedout);

// Auth routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Teacher profile routes
router.get('/teacher/profile/:id', auth, getTeacherProfile);
router.put('/teacher/profile/:id', auth, upload.single('file'), updateTeacherProfile);
router.put('/teacher/profile/:id/password', auth, updateTeacherPassword);

module.exports = router;
