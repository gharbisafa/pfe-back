const nodemailer = require('nodemailer');
require('dotenv').config();


// Create transporter with your custom SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g., smtp.mailgun.org
  port: parseInt(process.env.SMTP_PORT, 10),                         // 465 for SSL, 587 for TLS
  secure: false,                     // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS// Use environment variable for security
  },
  tls: {
    rejectUnauthorized: false        // Optional: allow self-signed certs
  }
});


// Branded email template
const lammaEmailTemplate = (content) => `
  <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
    <div style="background: #6C5CE7; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Lamma</h1>
    </div>
    <div style="padding: 20px;">
      ${content}
      <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
        <p>© ${new Date().getFullYear()} Lamma. All rights reserved.</p>
      </div>
    </div>
  </div>
`;

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const content = `
    <h2 style="color: #333;">Welcome to Lamma!</h2>
    <p>Please verify your email address to complete your registration:</p>
    <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
      <h1 style="color: #6C5CE7; margin: 0; font-size: 28px; letter-spacing: 2px;">${code}</h1>
    </div>
    <p style="color: #666;">This verification code will expire in 30 minutes.</p>
    <p>If you didn't create a Lamma account, please ignore this email.</p>
  `;

  await transporter.sendMail({
    from: `"Lamma Team"<${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Lamma Account',
    html: lammaEmailTemplate(content)
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, code) => {
  const content = `
    <h2 style="color: #333;">Reset Your Lamma Password</h2>
    <p>We received a request to reset your password. Here's your verification code:</p>
    <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
      <h1 style="color: #6C5CE7; margin: 0; font-size: 28px; letter-spacing: 2px;">${code}</h1>
    </div>
    <p style="color: #666;">This code will expire in 30 minutes.</p>
    <p>If you didn't request this password reset, please secure your account.</p>
  `;

  await transporter.sendMail({
    from: `"Lamma Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Lamma Password Reset Code',
    html: lammaEmailTemplate(content)
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};