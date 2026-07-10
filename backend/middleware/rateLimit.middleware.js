import rateLimit from 'express-rate-limit';

/**
 * Limit login requests to prevent brute force
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
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
  max: 100, // Limit each IP to 100 store signups per hour
  message: {
    success: false,
    message: 'Too many store creation attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limit OTP requests to prevent spam
 * Keys on the destination (email/phone) not IP — prevents Railway's shared 
 * proxy IP from falsely rate-limiting all users simultaneously.
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each destination to 10 OTP requests per 10 minutes
  keyGenerator: (req) => {
    // Use the destination (email/phone) as the key if available, fallback to IP
    return (req.body && req.body.destination) ? req.body.destination : req.ip;
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
  max: 50, // Limit to 50 password reset attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
