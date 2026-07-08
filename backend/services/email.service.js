/**
 * services/email.service.js
 *
 * Responsibility:
 * - Provide a single reusable `sendEmail()` function for all transactional emails
 * - Provide higher-level helpers (sendOtpEmail, etc.) that compose templates + sendEmail
 * - Log success and failure with structured output
 * - Throw descriptive errors so callers can handle them appropriately
 *
 * Future extension points:
 *  - sendPasswordResetEmail(email, resetLink)
 *  - sendWelcomeEmail(email, name)
 *  - sendInvoiceEmail(email, invoicePdf)
 *  - sendNotificationEmail(email, subject, body)
 */

import transporter from '../config/mailer.js';
import { generateOtpEmail } from '../templates/otp.template.js';

/**
 * sendEmail({ to, subject, html })
 *
 * Core email dispatch function. All other helpers funnel through here.
 *
 * @param {Object} options
 * @param {string}   options.to      - Recipient email address
 * @param {string}   options.subject - Email subject line
 * @param {string}   options.html    - Full HTML body content
 * @returns {Promise<Object>} Nodemailer info object (messageId, accepted, rejected, etc.)
 * @throws {Error} If SMTP delivery fails
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Krishna Pharmacy" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email] ✅ Sent to ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error(`[Email] ❌ Failed to send to ${to} | Subject: "${subject}" | Error: ${error.message}`);
    // Re-throw with a clear, descriptive message for the calling layer
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

/**
 * sendOtpEmail(email, otp)
 *
 * Sends an OTP verification email to the given recipient.
 * Composes the OTP template and delegates to sendEmail().
 *
 * @param {string}        email - Recipient email address
 * @param {string|number} otp   - The one-time password
 * @returns {Promise<Object>} Nodemailer info object
 * @throws {Error} If email delivery fails
 */
export const sendOtpEmail = async (email, otp) => {
  const subject = 'Your Verification Code – Mad Store';
  const html = generateOtpEmail(otp);
  return sendEmail({ to: email, subject, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// Future helpers to be added below:
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sendPasswordResetEmail(email, resetLink)
 * sendWelcomeEmail(email, name)
 * sendInvoiceEmail(email, invoicePdf)
 * sendNotificationEmail(email, subject, body)
 */
