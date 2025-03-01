const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.gmail_id,
    pass: process.env.gmail_app_password
  }
});

exports.sendWelcomeEmail = async (user, plainPassword) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: user.email,
    subject: 'Welcome to CMS - Teacher Account Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Welcome to CMS!</h2>
        <p>Dear ${user.name},</p>
        <p>Your teacher account has been successfully created. Here are your account details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Password:</strong> ${plainPassword}</p>
          <p><strong>Subject:</strong> ${user.subject}</p>
        </div>

        <p>Please keep these credentials safe and change your password after your first login.</p>
        <p>You can login at: <a href="http://localhost:3000/login">CMS Login</a></p>
        
        <p style="margin-top: 20px;">Best regards,</p>
        <p>The CMS Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

exports.sendStudentWelcomeEmail = async (student, plainPassword, batchDetails) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: student.email,
    subject: 'Welcome to CMS - Student Account Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Welcome to CMS!</h2>
        <p>Dear ${student.name},</p>
        <p>Your student account has been successfully created. Here are your account details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Password:</strong> ${plainPassword}</p>
          <p><strong>Batch:</strong> ${batchDetails.name}</p>
          <p><strong>Subject:</strong> ${batchDetails.subject}</p>
        </div>

        <p>Please keep these credentials safe and change your password after your first login.</p>
        <p>You can login at: <a href="http://localhost:3000/login">CMS Login</a></p>
        
        <p style="color: #666; font-size: 14px;">Note: This is an automated email. Please do not reply.</p>
        
        <p style="margin-top: 20px;">Best regards,</p>
        <p>The CMS Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Student welcome email sent successfully');
  } catch (error) {
    console.error('Error sending student welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

exports.sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.gmail_id,
    to: email,
    subject: 'Password Reset OTP - CMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Password Reset OTP</h2>
        <p>You have requested to reset your password. Here is your OTP:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #2E7D32; text-align: center; letter-spacing: 5px;">${otp}</h1>
        </div>

        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        
        <p style="margin-top: 20px;">Best regards,</p>
        <p>The CMS Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
