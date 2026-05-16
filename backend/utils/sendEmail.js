/**
 * utils/sendEmail.js
 * 
 * Email sending utility using console logging for development
 * In production, integrate with Nodemailer, SendGrid, or other email providers
 */

import env from '../config/env.js';

/**
 * Send Email (development mode: logs to console)
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export async function sendEmail({ to, subject, text, html }) {
  // Development mode - just log to console
  if (env.NODE_ENV === 'development' || !env.SMTP_HOST) {
    console.log('\n========================================');
    console.log('📧 EMAIL (DEV MODE)');
    console.log('----------------------------------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('========================================\n');
    
    return {
      success: true,
      messageId: `dev_${Date.now()}`,
      mode: 'development',
    };
  }

  // Production mode - integrate with email provider
  // Example with Nodemailer (uncomment and configure)
  /*
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    
    const result = await transporter.sendMail({
      from: env.EMAIL_FROM || '"MedStore" <noreply@medstore.com>',
      to,
      subject,
      text,
      html,
    });
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('[Email] Failed to send:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
  */

  // Fallback
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
  };
}

/**
 * Send OTP via Email
 */
export async function sendOTPEmail(email, otp) {
  // IMPORTANT: Must return the result
  const result = await sendEmail({
    to: email,
    subject: 'Your MedStore Verification Code',
    text: `Your verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">MedStore Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
        </div>
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} MedStore. All rights reserved.</p>
      </div>
    `,
  });
  
  return result;
}

export default sendEmail;
