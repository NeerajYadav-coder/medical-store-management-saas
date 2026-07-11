/**
 * utils/sendEmail.js
 *
 * Primary: SMTP via Brevo (formerly Sendinblue).
 * Brevo works reliably on Railway/GCP — unlike Gmail SMTP (blocked by GCP)
 * and Resend free tier (restricted to account owner's email without domain).
 *
 * Required Railway env vars:
 *   SMTP_HOST = smtp-relay.brevo.com
 *   SMTP_PORT = 587
 *   SMTP_USER = your-brevo-account-email@gmail.com
 *   SMTP_PASS = your-brevo-smtp-key  (from Brevo dashboard → SMTP & API → SMTP)
 *
 * Free tier: 300 emails/day, no domain verification required.
 * Sign up: https://brevo.com
 */

import transporter from '../config/mailer.js';
import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

/**
 * sendEmail({ to, subject, text, html, replyTo })
 *
 * Core dispatch. Falls back to console-log if SMTP_USER not set.
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  // ── Dev / no-config fallback ─────────────────────────────────────────────────
  if (!process.env.SMTP_USER) {
    console.log('\n========================================');
    console.log('📧 EMAIL (no SMTP_USER configured — console only)');
    console.log('----------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('========================================\n');
    return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
  }

  // ── Real send via SMTP (Brevo) ───────────────────────────────────────────────
  try {
    const info = await transporter.sendMail({
      from: `"Krishna Pharmacy" <${process.env.SMTP_USER}>`,
      to,
      subject,
      ...(text && { text }),
      ...(html && { html }),
      ...(replyTo && { replyTo }),
    });

    console.log(`[Email] ✅ Delivered → ${to} | Subject: "${subject}" | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

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


// ═══════════════════════════════════════════════════════════════════════════════
// RESEND IMPLEMENTATION (kept for reference)
// Limitation: free tier only sends to account owner's email without domain verify
// ═══════════════════════════════════════════════════════════════════════════════
//
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);
// export async function sendEmail({ to, subject, text, html, replyTo }) {
//   const { data, error } = await resend.emails.send({
//     from: 'Krishna Pharmacy <onboarding@resend.dev>',
//     to: [to], subject,
//     text: text || '', html: html || '',
//     ...(replyTo && { reply_to: replyTo }),
//   });
//   if (error) throw new Error(error.message);
//   return { success: true, messageId: data.id };
// }
