/**
 * utils/sendEmail.js
 *
 * Production email via Resend HTTP API (replaces nodemailer SMTP).
 * Railway blocks outbound SMTP ports — Resend uses HTTPS which always works.
 * Sign up at https://resend.com (free: 3,000 emails/month).
 */

import { Resend } from 'resend';
import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmail({ to, subject, text, html })
 *
 * Core dispatch function. Falls back to console-log if RESEND_API_KEY not set.
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  // ── Development / no-API-key fallback ───────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.log('\n========================================');
    console.log('📧 EMAIL (no RESEND_API_KEY configured — console only)');
    console.log('----------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('========================================\n');
    return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
  }

  // ── Real send via Resend ─────────────────────────────────────────────────────
  try {
    const { data, error } = await resend.emails.send({
      from: 'Krishna Pharmacy <onboarding@resend.dev>',
      to: [to],
      subject,
      text: text || '',
      html: html || '',
      reply_to: replyTo,
    });

    if (error) {
      console.error(`[Email] ❌ Failed → ${to} | Subject: "${subject}" | ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`[Email] ✅ Delivered → ${to} | Subject: "${subject}" | ID: ${data.id}`);
    return { success: true, messageId: data.id };

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

