/**
 * models/OTP.js
 * 
 * Stores OTPs for phone and email verification
 * OTPs expire after 10 minutes
 */

import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  // The destination (phone number or email)
  destination: {
    type: String,
    required: true,
    index: true,
  },
  
  // Type: 'phone' or 'email'
  type: {
    type: String,
    enum: ['phone', 'email'],
    required: true,
  },
  
  // The OTP code (hashed for security)
  code: {
    type: String,
    required: true,
  },
  
  // Purpose: 'signup', 'login', 'reset_password'
  purpose: {
    type: String,
    enum: ['signup', 'login', 'reset_password'],
    default: 'signup',
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // Attempt count (for rate limiting)
  attempts: {
    type: Number,
    default: 0,
  },
  
  // Expiry time (10 minutes from creation)
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - auto-delete when expired
  },
}, {
  timestamps: true,
});

// Compound index for quick lookups
otpSchema.index({ destination: 1, type: 1, purpose: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
