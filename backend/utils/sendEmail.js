/**
 * utils/sendEmail.js
 *
 * Primary: Google Apps Script Web App Proxy (HTTPS port 443 — NEVER BLOCKED by Railway).
 * Railway's free tier blocks ALL SMTP ports (25, 465, 587).
 * Free API tiers (Mailjet, Brevo, Resend) often block accounts sending OTPs without custom domains.
 * This script sends emails directly from the user's Gmail outbox, making it 100% reliable and free.
 *
 * Required Railway env vars:
 *   GOOGLE_SCRIPT_URL = https://script.google.com/macros/s/.../exec
 */

import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

export async function sendEmail({ to, subject, text, html }) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  // ── Dev / no-config fallback ─────────────────────────────────────────────────
  if (!scriptUrl) {
    console.log('\n========================================');
    console.log('📧 EMAIL (no GOOGLE_SCRIPT_URL configured — console only)');
    console.log('----------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('========================================\n');
    return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
  }

  // ── Real send via Google Apps Script (Bypasses all API blocks & IP bans) ────
  try {
    // Note: Google Apps Script Web Apps prefer text/plain for POST requests to avoid preflight CORS issues
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        to,
        subject,
        html: html || text // Fallback to text if no HTML provided
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.error || 'Unknown Apps Script error';
      console.error(`[Email] ❌ Failed → ${to} | Subject: "${subject}" | ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log(`[Email] ✅ Delivered → ${to} | Subject: "${subject}" | AppsScript`);
    return { success: true, messageId: `gas_${Date.now()}` };

  } catch (error) {
    console.error(`[Email] ❌ Failed → ${to} | Subject: "${subject}" | ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * sendOTPEmail(email, otp)
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
