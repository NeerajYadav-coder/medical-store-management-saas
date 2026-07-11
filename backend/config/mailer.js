/**
 * config/mailer.js
 *
 * Responsibility:
 * - Create and export a configured Nodemailer transporter
 * - All SMTP credentials are read strictly from environment variables
 * - Never hardcode credentials here
 *
 * Transport: Gmail SMTP via STARTTLS (port 587)
 * Auth: App Password (not your Gmail login password)
 *
 * ⚠️  WHY PORT 587 (not 465):
 * Railway runs on Google Cloud Platform. GCP silently drops outbound connections
 * to port 465 (SMTP SSL) from its own IPs to Gmail — Google's spam prevention.
 * Port 587 (STARTTLS) is NOT blocked and works reliably on Railway.
 *
 * Required Railway env vars:
 *   SMTP_HOST = smtp.gmail.com
 *   SMTP_PORT = 587          ← must be 587, not 465
 *   SMTP_USER = your-gmail@gmail.com
 *   SMTP_PASS = your-16-char-app-password (spaces are stripped automatically)
 */

import nodemailer from 'nodemailer';

// Gmail App Passwords are shown with spaces (e.g. "vxeb ybff rfjn naxx")
// but Nodemailer requires them without spaces. Strip them here to be safe.
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

const smtpPort = Number(process.env.SMTP_PORT) || 587;

/**
 * Nodemailer transporter configured via environment variables.
 *
 * secure: false  → use STARTTLS upgrade (required for port 587)
 * requireTLS     → reject connections that don't upgrade to TLS (security)
 * family: 4      → Force IPv4 — Railway cannot reach Gmail over IPv6 (ENETUNREACH)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465, // true only for port 465 SSL; false = STARTTLS for 587
  requireTLS: smtpPort !== 465, // enforce TLS upgrade on port 587
  family: 4, // Force IPv4
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 25000,
  tls: {
    rejectUnauthorized: false,
  },
});

export default transporter;
