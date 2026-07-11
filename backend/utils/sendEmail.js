/**
 * utils/sendEmail.js
 *
 * Primary: Brevo HTTP API (HTTPS port 443 — NEVER BLOCKED by Railway).
 * Railway's free tier blocks ALL SMTP ports (25, 465, 587), so Nodemailer
 * will always time out. We must use an HTTP-based email provider.
 *
 * Required Railway env vars:
 *   BREVO_API_KEY = xkeysib-...  (Get this from Brevo -> SMTP & API -> API Keys tab)
 *   SMTP_USER = your-brevo-account-email@gmail.com
 */

import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

export async function sendEmail({ to, subject, text, html, replyTo }) {
  // ── Dev / no-config fallback ─────────────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS; // fallback just in case
  const senderEmail = process.env.SMTP_USER || 'support@krishnapharmacy.com';

  if (!apiKey || apiKey === 'YOUR_BREVO_API_KEY') {
    console.log('\n========================================');
    console.log('📧 EMAIL (no BREVO_API_KEY configured — console only)');
    console.log('----------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('========================================\n');
    return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
  }

  // ── Real send via Brevo HTTP API (Bypasses Railway SMTP block) ───────────────
  try {
    const payload = {
      sender: {
        name: 'Krishna Pharmacy',
        email: senderEmail,
      },
      to: [{ email: to }],
      subject: subject,
      ...(html && { htmlContent: html }),
      ...(text && { textContent: text }),
      ...(replyTo && { replyTo: { email: replyTo } }),
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Email] ❌ Failed → ${to} | Subject: "${subject}" | ${JSON.stringify(data)}`);
      return { success: false, error: data.message || JSON.stringify(data) };
    }

    console.log(`[Email] ✅ Delivered → ${to} | Subject: "${subject}" | ID: ${data.messageId}`);
    return { success: true, messageId: data.messageId };

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
