const User = require('../models/User');
const Student = require('../models/Student');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');
const { generateUsername } = require('../utils/usernameGenerator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, verifyOTPValidity } = require('../utils/otpUtils');

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
        const { email, userType } = req.body;
        let user;

        if (userType === 'student') {
            user = await Student.findOne({ email }, 'email name');
        } else {
            user = await User.findOne({ email }, 'email name');
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiry in memory (or preferably Redis in production)
        const otpData = {
            otp,
            email,
            userType,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        };
        
        otpStore.set(email, otpData);

        // Send OTP via email
        await sendOTPEmail(email, otp);

        res.json({
            success: true,
            message: 'OTP has been sent to your email'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing forgot password request'
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, userType } = req.body;
        
        const storedOTPData = otpStore.get(email);
        
        if (!storedOTPData || 
            storedOTPData.otp !== otp || 
            storedOTPData.userType !== userType || 
            Date.now() > storedOTPData.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
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
            message: 'Error verifying OTP'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, userType } = req.body;
        
        const storedOTPData = otpStore.get(email);
        
        if (!storedOTPData || 
            storedOTPData.otp !== otp || 
            storedOTPData.userType !== userType || 
            Date.now() > storedOTPData.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Find and update user password
        let user;
        if (userType === 'student') {
            user = await Student.findOne({ email });
        } else {
            user = await User.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Clear OTP data
        otpStore.delete(email);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
};

exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id).select('-password');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTeacherProfile = async (req, res) => {
  try {
    const { name, phone, subject, address } = req.body;
    const teacher = await User.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    teacher.name = name || teacher.name;
    teacher.phone = phone || teacher.phone;
    teacher.subject = subject || teacher.subject;
    teacher.address = address || teacher.address;

    await teacher.save();

    res.json({ success: true, data: teacher, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTeacherPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const teacher = await User.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Verify current password
    const isMatch = await teacher.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    teacher.password = newPassword;
    await teacher.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
