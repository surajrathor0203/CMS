const User = require('../models/User');
const Student = require('../models/Student');
const { 
  sendWelcomeEmail, 
  sendOTPEmail, 
  sendSignupVerificationEmail 
} = require('../utils/emailService');
const { generateUsername } = require('../utils/usernameGenerator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, verifyOTPValidity } = require('../utils/otpUtils');
const s3 = require('../config/s3Config');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');

// Cache for OTP storage with 10 minute TTL
const otpCache = new NodeCache({ stdTTL: 600 });

// Rate limiter for verification endpoints
exports.verifyEmailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: { success: false, message: 'Too many verification attempts. Please try again later.' }
});

// Store OTPs with expiry (in memory - consider using Redis in production)
const otpStore = new Map();
const signupOTPStore = new Map();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Check cache first
    const existingUser = await User.findOne({ email }).select('email').lean();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const otp = generateOTP();
    otpCache.set(`signup_${email}`, {
      otp,
      attempts: 0
    });

    await sendSignupVerificationEmail(email, otp);

    res.json({
      success: true,
      message: 'Verification code has been sent to your email'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email'
    });
  }
};

exports.verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const otpData = otpCache.get(`signup_${email}`);
    
    if (!otpData || otpData.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or too many attempts'
      });
    }

    if (otpData.otp !== otp) {
      otpData.attempts++;
      otpCache.set(`signup_${email}`, otpData);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Clear OTP after successful verification
    otpCache.del(`signup_${email}`);
    otpCache.set(`verified_${email}`, true, 3600); // 1 hour validity

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP'
    });
  }
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, countryCode, cochingName, address, role } = req.body;

        // Check if email was verified
        const wasVerified = otpCache.get(`verified_${email}`);
        if (!wasVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email not verified. Please verify your email first.'
            });
        }

        // Remove verification flag
        otpCache.del(`verified_${email}`);

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

        // Set subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phoneNumber,
            countryCode,
            cochingName,
            address,
            role,
            username,
            subscription: {
                startDate,
                endDate,
                subscriptionStatus: 'Free trial'  // Set initial status as Free trial
            }
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

        // Create user info object with status
        const userInfo = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
            cochingName: user.cochingName,
            address: user.address,
            status: user.status // Include status in response
        };

        // Set cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.cookie('userInfo', JSON.stringify(userInfo), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Send response with user info including status
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

    // Include the profile picture URL in the response
    const profileData = {
      ...teacher.toObject(),
      profilePictureUrl: teacher.profilePicture?.url || ''
    };

    res.json({ success: true, data: profileData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTeacherProfile = async (req, res) => {
  try {
    const { name, phoneNumber, cochingName, address } = req.body;
    const profilePicture = req.file;
    const removeProfilePicture = req.body.removeProfilePicture === 'true';
    
    const teacher = await User.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (name) teacher.name = name;
    if (phoneNumber) teacher.phoneNumber = phoneNumber;
    if (cochingName) teacher.cochingName = cochingName;
    if (address) teacher.address = address;

    // Handle profile picture removal
    if (removeProfilePicture) {
      if (teacher.profilePicture?.s3Key) {
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: teacher.profilePicture.s3Key
          }).promise();
        } catch (error) {
          console.error('Error deleting profile picture:', error);
        }
      }
      teacher.profilePicture = { url: '', s3Key: '' };
    }
    // Handle profile picture upload
    else if (profilePicture) {
      // Delete old profile picture if exists
      if (teacher.profilePicture?.s3Key) {
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: teacher.profilePicture.s3Key
          }).promise();
        } catch (error) {
          console.error('Error deleting old profile picture:', error);
        }
      }

      try {
        const fileName = `profiles/teacher-${teacher._id}-${Date.now()}-${profilePicture.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName,
          Body: profilePicture.buffer,
          ContentType: profilePicture.mimetype,
          ACL: 'public-read'
        };

        const uploadResult = await s3.upload(params).promise();
        
        teacher.profilePicture = {
          url: uploadResult.Location,
          s3Key: fileName
        };
      } catch (error) {
        console.error('Error uploading to S3:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture'
        });
      }
    }

    const updatedTeacher = await teacher.save();

    res.json({
      success: true,
      data: {
        ...updatedTeacher.toObject(),
        profilePictureUrl: updatedTeacher.profilePicture?.url || ''
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating profile'
    });
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
