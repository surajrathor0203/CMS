const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signup, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');

// Auth routes
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or username
    const existingUser = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, existingUser.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create user object without sensitive information
    const user = {
      id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      username: existingUser.username,
      subject: existingUser.subject,
      address: existingUser.address
    };

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
