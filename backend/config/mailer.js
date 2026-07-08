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
    pass: process.env.SMTP_PASS,        // Gmail App Password (16-char, spaces allowed)
  },
  // Explicit TLS options — enforce minimum TLS version and reject unsigned certs
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

export default transporter;
