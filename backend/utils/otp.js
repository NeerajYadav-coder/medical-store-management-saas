/**
 * utils/otp.js
 * 
 * OTP generation and verification utilities
 */

import crypto from 'crypto';

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP() {
  // Generate random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

/**
 * Hash OTP for storage (one-way hash)
 */
export function hashOTP(otp) {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
}

/**
 * Verify OTP against hash
 */
export function verifyOTPHash(otp, hash) {
  const otpHash = hashOTP(otp);
  return otpHash === hash;
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Format phone number for display (mask middle digits)
 * e.g., +91 98765XXXX0
 */
export function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  const start = phone.slice(0, -6);
  const end = phone.slice(-2);
  return `${start}XXXX${end}`;
}

/**
 * Format email for display (mask)
 * e.g., n***@gmail.com
 */
export function maskEmail(email) {
  if (!email) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local[0]}***@${domain}`;
}
