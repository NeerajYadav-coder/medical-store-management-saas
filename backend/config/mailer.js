/**
 * config/mailer.js
 *
 * Responsibility:
 * - Create and export a configured Nodemailer transporter
 * - All SMTP credentials are read strictly from environment variables
 * - Never hardcode credentials here
 *
 * Transport: Gmail SMTP via TLS (port 587)
 * Auth: App Password (not your Gmail login password)
 */

import nodemailer from 'nodemailer';

// Gmail App Passwords are shown with spaces (e.g. "vxeb ybff rfjn naxx")
// but Nodemailer requires them without spaces. Strip them here to be safe.
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

/**
 * Nodemailer transporter configured via environment variables.
 * Uses STARTTLS on port 587 — the Gmail-recommended secure method.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT,
  family: 4,  // Force IPv4 — Railway cannot reach Gmail over IPv6 (ENETUNREACH)
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false,
  },
});

export default transporter;
