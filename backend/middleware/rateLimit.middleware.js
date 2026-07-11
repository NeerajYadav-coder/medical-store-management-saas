import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Limit login requests to prevent brute force
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limit signup attempts
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    message: 'Too many store creation attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limit OTP requests to prevent spam.
 * Keys on destination (email/phone) so Railway IPv6 addresses don't bypass limits.
 * Uses ipKeyGenerator as fallback — required by express-rate-limit v7+ to suppress
 * ERR_ERL_KEY_GEN_IPV6 validation error.
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  keyGenerator: (req) => {
    // Prefer destination (email/phone) as the rate-limit key — most accurate for OTP abuse
    if (req.body && req.body.destination) {
      return req.body.destination;
    }
    // Fall back to IP (using ipKeyGenerator to handle IPv6 correctly)
    return ipKeyGenerator(req);
  },
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limit forgot password and reset password requests
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
