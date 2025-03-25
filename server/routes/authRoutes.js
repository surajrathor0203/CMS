const express = require('express');
const router = express.Router();
const multer = require('multer');
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
