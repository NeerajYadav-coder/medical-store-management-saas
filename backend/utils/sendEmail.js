/**
 * utils/sendEmail.js
 *
 * Production-grade email utility backed by Nodemailer (Gmail SMTP).
 * All credentials are read from environment variables via config/mailer.js.
 *
 * This file intentionally keeps the same function signatures as the original
 * stub so that otp.controller.js and any other callers require zero changes.
 */

import transporter from '../config/mailer.js';
import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

/**
 * sendEmail({ to, subject, text, html })
 *
 * Core dispatch function used by all higher-level helpers.
 * Falls back to console-log in development when SMTP is not configured.
 *
 * @param {Object} options
 * @param {string}   options.to      - Recipient email address
 * @param {string}   options.subject - Email subject line
 * @param {string}   [options.text]  - Plain-text fallback body
 * @param {string}   [options.html]  - HTML body (preferred)
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  // ── Development / no-SMTP fallback ──────────────────────────────────────────
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n========================================');
    console.log('📧 EMAIL (no SMTP configured — console only)');
    console.log('----------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('========================================\n');
    return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
  }

  // ── Real send via Nodemailer ─────────────────────────────────────────────────
  try {
    const info = await transporter.sendMail({
      from: `"Krishna Pharmacy" <${process.env.SMTP_USER}>`,
      to,
      replyTo,
      subject,
      text: text || '',   // plain-text fallback for email clients that block HTML
      html: html || '',
    });

    console.log(`[Email] ✅ Delivered → ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`[Email] ❌ Failed → ${to} | Subject: "${subject}" | ${error.message}`);
    // Return failure so the caller (otp.controller) can surface a proper 500
    return { success: false, error: error.message };
  }
}

/**
 * sendOTPEmail(email, otp)
 *
 * Sends the branded Krishna Pharmacy OTP email.
 * Uses the professional HTML template from templates/otp.template.js.
 *
 * @param {string}        email - Recipient address
 * @param {string|number} otp   - The one-time password
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export async function sendOTPEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: 'Your Verification Code – Krishna Pharmacy',
    text: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
    html: generateOtpEmail(otp),
  });
}

/**
 * sendPasswordResetEmail(email, resetUrl)
 *
 * Sends the branded Krishna Pharmacy Password Reset email.
 *
 * @param {string} email - Recipient address
 * @param {string} resetUrl - The password reset URL
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: 'Reset your password – Krishna Pharmacy',
    text: `Reset your password by visiting this link: ${resetUrl}. Valid for 10 minutes.`,
    html: generateResetPasswordEmail(resetUrl),
  });
}

export default sendEmail;
