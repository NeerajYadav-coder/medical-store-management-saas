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
  host: process.env.SMTP_HOST,         // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // e.g. 587
  secure: false,                        // false = STARTTLS (port 587), true = TLS (port 465)
  auth: {
    user: process.env.SMTP_USER,        // Gmail address
    pass: smtpPass,                     // Gmail App Password (spaces stripped)
  },
  // Connection timeout settings — important for Railway's network
  connectionTimeout: 10000, // 10 seconds to establish connection
  greetingTimeout: 10000,   // 10 seconds for SMTP greeting
  socketTimeout: 15000,     // 15 seconds for socket inactivity
  tls: {
    // Allow Railway's outbound TLS (some providers have intermediate cert issues)
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
});

export default transporter;
