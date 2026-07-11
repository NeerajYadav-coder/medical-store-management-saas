/**
 * utils/sendEmail.js
 *
 * Production email via SMTP (Nodemailer + Gmail App Password).
 * Uses config/mailer.js transporter — all credentials come from env vars.
 *
 * Required env vars:
 *   SMTP_HOST   = smtp.gmail.com
 *   SMTP_PORT   = 465
 *   SMTP_USER   = your-gmail@gmail.com
 *   SMTP_PASS   = your-16-char-app-password (spaces are stripped automatically)
 */

import transporter from '../config/mailer.js';
import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

/**
 * sendEmail({ to, subject, text, html, replyTo })
 *
 * Core dispatch function — all helpers route through here.
 * Falls back to console-log in dev if SMTP_USER is not configured.
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  // ── Development / no-config fallback ────────────────────────────────────────
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

  // ── Real send via SMTP ───────────────────────────────────────────────────────
  try {
    const mailOptions = {
      from: `"Krishna Pharmacy" <${process.env.SMTP_USER}>`,
      to,
      subject,
      ...(text && { text }),
      ...(html && { html }),
      ...(replyTo && { replyTo }),
    };

    const info = await transporter.sendMail(mailOptions);

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
// RESEND IMPLEMENTATION (kept for reference — uncomment to switch back)
// ═══════════════════════════════════════════════════════════════════════════════
//
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);
//
// export async function sendEmail({ to, subject, text, html, replyTo }) {
//   if (!process.env.RESEND_API_KEY) {
//     console.log('📧 EMAIL (no RESEND_API_KEY — console only):', { to, subject });
//     return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
//   }
//   try {
//     const { data, error } = await resend.emails.send({
//       from: 'Krishna Pharmacy <onboarding@resend.dev>',
//       to: [to],
//       subject,
//       text: text || '',
//       html: html || '',
//       reply_to: replyTo,
//     });
//     if (error) {
//       console.error(`[Email] ❌ Failed → ${to} | ${error.message}`);
//       return { success: false, error: error.message };
//     }
//     console.log(`[Email] ✅ Delivered → ${to} | ID: ${data.id}`);
//     return { success: true, messageId: data.id };
//   } catch (error) {
//     console.error(`[Email] ❌ Failed → ${to} | ${error.message}`);
//     return { success: false, error: error.message };
//   }
// }
