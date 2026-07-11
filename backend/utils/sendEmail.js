/**
 * utils/sendEmail.js
 *
 * Primary: Mailjet HTTP API v3.1 (HTTPS port 443 — NEVER BLOCKED by Railway).
 * Railway's free tier blocks ALL SMTP ports (25, 465, 587).
 * We use Mailjet because it has zero IP restrictions and a generous free tier.
 *
 * Required Railway env vars:
 *   MAILJET_API_KEY = (Public API Key)
 *   MAILJET_SECRET_KEY = (Private API Key)
 *   SMTP_USER = support.krishnapharmacy@gmail.com (Must be verified in Mailjet)
 */

import { generateOtpEmail } from '../templates/otp.template.js';
import { generateResetPasswordEmail } from '../templates/resetPassword.template.js';

export async function sendEmail({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;
  const senderEmail = process.env.SMTP_USER || 'support@krishnapharmacy.com';

  // ── Dev / no-config fallback ─────────────────────────────────────────────────
  if (!apiKey || !apiSecret) {
    console.log('\n========================================');
    console.log('📧 EMAIL (no MAILJET_API_KEY configured — console only)');
    console.log('----------------------------------------');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('========================================\n');
    return { success: true, messageId: `console_${Date.now()}`, mode: 'console' };
  }

  // ── Real send via Mailjet HTTP API (Bypasses Railway SMTP block) ─────────────
  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const payload = {
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: "Krishna Pharmacy"
          },
          To: [
            {
              Email: to
            }
          ],
          Subject: subject,
          ...(text && { TextPart: text }),
          ...(html && { HTMLPart: html }),
          ...(replyTo && { ReplyTo: { Email: replyTo } })
        }
      ]
    };

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.Messages || data.Messages[0].Status !== 'success') {
      const errorMessage = data.ErrorMessage || (data.Messages && data.Messages[0] && data.Messages[0].Errors) 
        ? JSON.stringify(data.Messages[0].Errors) 
        : 'Unknown Mailjet error';
        
      console.error(`[Email] ❌ Failed → ${to} | Subject: "${subject}" | ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    const messageId = data.Messages[0].To[0].MessageUUID;
    console.log(`[Email] ✅ Delivered → ${to} | Subject: "${subject}" | ID: ${messageId}`);
    return { success: true, messageId };

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
