const User = require('../models/User');
const Student = require('../models/Student');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');
const { generateUsername } = require('../utils/usernameGenerator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Store OTPs with expiry (in memory - consider using Redis in production)
const otpStore = new Map();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, phone, subject, address, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Generate unique username
        const username = await generateUsername(name);

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phone,
            subject,
            address,
            role,
            username
        });

        // Save plain password temporarily for email
        const plainPassword = password;

        // Save user to database
        await user.save();

        // Send welcome email with credentials
        await sendWelcomeEmail(user, plainPassword);

        res.status(201).json({
            success: true,
            message: 'Teacher registered successfully'
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error during registration'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password, userType } = req.body;

        let user;
        let Model = userType === 'student' ? Student : User;

        // Find user by email or username
        user = await Model.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Create user info object
        const userInfo = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
            subject: user.subject,
            address: user.address
        };

        // Set token cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        // Set user info cookie
        res.cookie('userInfo', JSON.stringify(userInfo), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        // Send response
        res.json({
            success: true,
            user: userInfo,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiry
    otpStore.set(email, {
      otp,
      expiry: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request'
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedOTPData = otpStore.get(email);
    if (!storedOTPData) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found'
      });
    }

    if (Date.now() > storedOTPData.expiry) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (storedOTPData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP again
    const storedOTPData = otpStore.get(email);
    if (!storedOTPData || storedOTPData.otp !== otp || Date.now() > storedOTPData.expiry) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    // Clear OTP
    otpStore.delete(email);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};
