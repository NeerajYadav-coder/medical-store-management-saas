/**
 * controllers/otp.controller.js
 * 
 * Handles OTP sending and verification for phone and email
 */

import OTP from '../models/OTP.js';
import { generateOTP, hashOTP, verifyOTPHash, getOTPExpiry, maskPhone, maskEmail } from '../utils/otp.js';
import { sendOTPSMS } from '../utils/sendSMS.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

// Rate limiting constants
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const MAX_VERIFICATION_ATTEMPTS = 3;

/**
 * -----------------------
 * SEND OTP
 * -----------------------
 * POST /api/v1/auth/send-otp
 * 
 * Body: { type: 'phone' | 'email', destination: string, purpose?: string }
 */
export const sendOtp = async (req, res, next) => {
  try {
    let { type, destination, purpose = 'signup' } = req.body;
    
    // Normalize email to prevent case-sensitivity/space issues
    if (type === 'email' && destination) {
      destination = destination.toLowerCase().trim();
    }

    // Validation
    if (!type || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Type and destination are required',
      });
    }

    if (!['phone', 'email'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "phone" or "email"',
      });
    }

    // Validate phone format (basic)
    if (type === 'phone') {
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      if (!phoneRegex.test(destination.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
        });
      }
    }

    // Validate email format
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(destination)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
    }

    // Rate limiting - check recent OTP requests
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTP.countDocuments({
      destination,
      type,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOTPs >= MAX_OTP_REQUESTS_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
      });
    }

    // Cooldown check - limit request frequency to 1 per 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recentCooldownOTP = await OTP.findOne({
      destination,
      type,
      createdAt: { $gte: sixtySecondsAgo },
    });

    if (recentCooldownOTP) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another OTP.',
      });
    }

    // Delete any existing unverified OTPs for this destination
    await OTP.deleteMany({
      destination,
      type,
      purpose,
      isVerified: false,
    });

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Store OTP
    await OTP.create({
      destination,
      type,
      code: hashedOTP,
      purpose,
      expiresAt,
    });

    // Send OTP via appropriate channel
    let sendResult;
    if (type === 'phone') {
      sendResult = await sendOTPSMS(destination, otp);
    } else {
      sendResult = await sendOTPEmail(destination, otp);
    }

    if (!sendResult.success) {
      // Clean up the saved OTP so the user can retry immediately
      await OTP.deleteOne({ destination, type, purpose, isVerified: false });
      console.error(`[OTP] ❌ Delivery failed for ${destination}: ${sendResult.error || 'Unknown error'}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
        ...(process.env.NODE_ENV !== 'production' && { debug: sendResult.error }),
      });
    }

    // Log OTP in development for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${destination}: ${otp}`);
    }

    // Return success (masked destination for privacy)
    const maskedDestination = type === 'phone' 
      ? maskPhone(destination) 
      : maskEmail(destination);

    // Build response
    const response = {
      success: true,
      message: `OTP sent to ${maskedDestination}`,
      destination: maskedDestination,
      expiresIn: 600, // 10 minutes in seconds
    };

    // DEV MODE ONLY: Include OTP in response for testing
    // IMPORTANT: Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      response.devOtp = otp;
      response.devMessage = '⚠️ DEV MODE: OTP included for testing. Remove in production!';
    }

    res.status(200).json(response);

  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * VERIFY OTP
 * -----------------------
 * POST /api/v1/auth/verify-otp
 * 
 * Body: { type: 'phone' | 'email', destination: string, otp: string, purpose?: string }
 */
export const verifyOtp = async (req, res, next) => {
  try {
    let { type, destination, otp, purpose = 'signup' } = req.body;
    
    // Normalize email to prevent case-sensitivity/space issues
    if (type === 'email' && destination) {
      destination = destination.toLowerCase().trim();
    }

    // Validation
    if (!type || !destination || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Type, destination, and OTP are required',
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      destination,
      type,
      purpose,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.',
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      // Delete the OTP to force requesting a new one
      await OTP.deleteOne({ _id: otpRecord._id });
      
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    const cleanOtp = otp.toString().trim();
    const isValid = verifyOTPHash(cleanOtp, otpRecord.code);

    if (!isValid) {
      // Increment attempt count
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - otpRecord.attempts;

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts,
      });
    }

    // Mark as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
      type,
      destination,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * CHECK VERIFICATION STATUS
 * -----------------------
 * GET /api/v1/auth/check-verification
 * 
 * Query: { type, destination, purpose }
 */
export const checkVerification = async (req, res, next) => {
  try {
    let { type, destination, purpose = 'signup' } = req.query;
    
    // Normalize email to prevent case-sensitivity/space issues
    if (type === 'email' && destination) {
      destination = destination.toLowerCase().trim();
    }

    if (!type || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Type and destination are required',
      });
    }

    // Check if there's a verified OTP
    const verifiedOTP = await OTP.findOne({
      destination,
      type,
      purpose,
      isVerified: true,
      // Check within last 30 minutes (verification window)
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });

    res.status(200).json({
      success: true,
      isVerified: !!verifiedOTP,
      type,
    });

  } catch (error) {
    next(error);
  }
};
