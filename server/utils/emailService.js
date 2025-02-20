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
          <p><strong>Password:</strong> ${plainPassword}</p>
          <p><strong>Subject:</strong> ${user.subject}</p>
          <p><strong>Role:</strong> Teacher</p>
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
