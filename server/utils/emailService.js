const nodemailer = require('nodemailer');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Create transporter with timeout
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.gmail_id,
    pass: process.env.gmail_app_password
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  socketTimeout: 10000 // 10 second timeout
});

// Add rate limiting with exponential backoff
const rateLimiter = {
    lastSent: Date.now(),
    minDelay: 200,  // Minimum delay between emails (ms)
    maxDelay: 2000, // Maximum delay when rate limited
    backoffFactor: 1.5,
    currentDelay: 200
};

const updateRateLimiter = () => {
    const now = Date.now();
    const timeSinceLastSend = now - rateLimiter.lastSent;
    
    if (timeSinceLastSend < rateLimiter.minDelay) {
        rateLimiter.currentDelay = Math.min(
            rateLimiter.currentDelay * rateLimiter.backoffFactor,
            rateLimiter.maxDelay
        );
    } else {
        rateLimiter.currentDelay = rateLimiter.minDelay;
    }
    
    rateLimiter.lastSent = now;
    return rateLimiter.currentDelay;
};

const sendMailWithRetry = async (mailOptions, retries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const delay = updateRateLimiter();
            if (delay > rateLimiter.minDelay) {
                await sleep(delay);
            }
            
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            lastError = error;
            
            // Don't wait on last attempt
            if (attempt < retries) {
                await sleep(1000 * attempt); // Exponential backoff
            }
        }
    }
    
    throw lastError;
};

exports.sendWelcomeEmail = async (user, plainPassword) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: user.email,
    subject: 'Welcome to CMS - Teacher Account Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://cms2222025.s3.eu-north-1.amazonaws.com/logo/cms-favicon1.png" alt="CMS Logo" style="max-width: 150px;">
        </div>
        <h2 style="color: #2E7D32;">Welcome to CMS!</h2>
        <p>Dear ${user.name},</p>
        <p>Your teacher account has been successfully created. Here are your account details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Password:</strong> ${plainPassword}</p>
          <p><strong>Coaching Name:</strong> ${user.cochingName}</p>
        </div>

        <p>Please keep these credentials safe and change your password after your first login.</p>
        <p>You can login at: <a href="http://localhost:3000/login">CMS Login</a></p>
        
        <p style="margin-top: 20px;">Best regards,</p>
        <p>The CMS Team</p>
      </div>
    `
  };

  try {
    await sendMailWithRetry(mailOptions);
    // console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

exports.sendStudentWelcomeEmail = async (student, plainPassword, batchDetails, isNewAccount = true) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: student.email,
    subject: batchDetails.cochingName,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://cms2222025.s3.eu-north-1.amazonaws.com/logo/cms-favicon1.png" alt="CMS Logo" style="max-width: 150px;">
        </div>
        <h2 style="color: #2E7D32;">Welcome to CMS!</h2>
        <p>Dear ${student.name},</p>
        <p>${isNewAccount ? 'Your student account has been successfully created.' : 'You have been enrolled in a new batch.'} Here are your account details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Password:</strong> ${plainPassword || 'Use your existing password'}</p>
          <p><strong>Batch:</strong> ${batchDetails.name}</p>
          <p><strong>Subject:</strong> ${batchDetails.subject}</p>
          <p><strong>Coaching Name:</strong> ${batchDetails.cochingName}</p>
        </div>

        ${isNewAccount ? '<p>Please keep these credentials safe and change your password after your first login.</p>' : ''}
        <p>You can login at: <a href="http://localhost:3000/login">CMS Login</a></p>
        
        <p style="color: #666; font-size: 14px;">Note: This is an automated email. Please do not reply.</p>
        
        <p style="margin-top: 20px;">Best regards,</p>
        <p>The CMS Team</p>
      </div>
    `
  };

  try {
    await sendMailWithRetry(mailOptions);
    // console.log('Student email sent successfully');
  } catch (error) {
    console.error('Error sending student email:', error);
    throw new Error('Failed to send email');
  }
};

exports.sendSignupVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: email,
    subject: 'Email Verification - CMS Teacher Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://cms2222025.s3.eu-north-1.amazonaws.com/logo/cms-favicon1.png" alt="CMS Logo" style="max-width: 150px;">
          </div>
          
          <h2 style="color: #2E7D32; text-align: center; margin-bottom: 20px;">Verify Your Email Address</h2>
          
          <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Thank you for choosing CMS! To complete your registration, please use the following verification code:
          </p>
          
          <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2E7D32; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">
              ${otp}
            </h1>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 20px;">
            This code will expire in 10 minutes for security purposes.
          </p>
          
          <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              If you didn't request this verification code, please ignore this email.
              <br>Your email address will not be verified without entering the code.
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              Need help? Contact our support team at
              <a href="mailto:support@your-cms.com" style="color: #2E7D32; text-decoration: none;">
                rathor.suraj0203@gmail.com
              </a>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} CMS. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await sendMailWithRetry(mailOptions);
    // console.log('Signup verification email sent successfully');
  } catch (error) {
    console.error('Error sending signup verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

exports.sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: email,
    subject: 'Password Reset Verification - CMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://cms2222025.s3.eu-north-1.amazonaws.com/logo/cms-favicon1.png" alt="CMS Logo" style="max-width: 150px;">
          </div>
          
          <h2 style="color: #2E7D32; text-align: center; margin-bottom: 20px;">Password Reset Code</h2>
          
          <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            We received a request to reset your password. Use this verification code to complete the process:
          </p>
          
          <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2E7D32; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">
              ${otp}
            </h1>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 20px;">
            This code will expire in 10 minutes for security purposes.
          </p>
          
          <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              If you didn't request this password reset, please ignore this email or contact support
              if you believe this is suspicious activity.
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              Need help? Contact our support team at
              <a href="mailto:support@your-cms.com" style="color: #2E7D32; text-decoration: none;">
                support@your-cms.com
              </a>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} CMS. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await sendMailWithRetry(mailOptions);
    // console.log('OTP email sent successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

exports.sendMessageNotificationEmail = async (studentEmail, studentName, teacherName, batchName, messageContent) => {
    const mailOptions = {
        from: process.env.gmail_id,
        to: studentEmail,
        subject: `New Message from ${teacherName} - ${batchName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <p>Dear ${studentName},</p>
                <p>New message from ${teacherName}:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                    ${messageContent}
                </div>
                <p>Login to view all messages: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">CMS Login</a></p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions, 2); // Reduced retries for batch processing
        return true;
    } catch (error) {
        console.error(`Failed to send message notification to ${studentEmail}:`, error);
        return false;
    }
};

exports.sendTeacherPaymentNotificationEmail = async ({
  teacherEmail,
  teacherName,
  studentName,
  studentEmail,
  batchName,
  amount,
  installmentNumber,
  paymentDate,
}) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: teacherEmail,
    subject: `New Payment Submitted by ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Payment Notification</h2>
        <p>Dear ${teacherName},</p>
        <p>
          Student <strong>${studentName}</strong> (${studentEmail}) has submitted a payment for batch <strong>${batchName}</strong>.
        </p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${amount}</p>
          <p><strong>Installment Number:</strong> ${installmentNumber}</p>
          <p><strong>Date:</strong> ${new Date(paymentDate).toLocaleString()}</p>
        </div>
        <p>Please review and verify the payment in your dashboard.</p>
        <p style="margin-top: 20px;">Best regards,<br/>The CMS Team</p>
      </div>
    `
  };

  try {
    await sendMailWithRetry(mailOptions);
  } catch (error) {
    console.error('Error sending teacher payment notification email:', error);
  }
};
