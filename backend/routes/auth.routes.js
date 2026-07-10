// /**
//  * routes/auth.routes.js
//  *
//  * Responsibility:
//  * - Define authentication-related API routes
//  * - Keep routes clean and predictable
//  * - Delegate logic to controller
//  */

// import express from 'express';
// import {
//   signup,
//   login,
//   getMe,
//   logout,
// } from '../controllers/auth.controller.js';
// import { protect } from '../middleware/auth.middleware.js';

// const router = express.Router();

// /**
//  * -----------------------
//  * Public Routes
//  * -----------------------
//  */

// /**
//  * Signup (OWNER / STAFF)
//  * POST /api/v1/auth/signup
//  */
// router.post('/signup', signup);

// /**
//  * Login (OWNER / STAFF)
//  * POST /api/v1/auth/login
//  */
// router.post('/login', login);

// /**
//  * -----------------------
//  * Protected Routes
//  * -----------------------
//  */

// /**
//  * Get current logged-in user profile
//  * GET /api/v1/auth/me
//  */
// router.get('/me', protect, getMe);

// /**
//  * Logout
//  * POST /api/v1/auth/logout
//  */
// router.post('/logout', protect, logout);

// export default router;




import express from 'express';
import {
  signup,
  login,
  getMe,
  logout,
  logoutAll,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  updateProfile,
  checkEmailUniqueness,
  submitSupportTicket,
} from '../controllers/auth.controller.js';
import {
  sendOtp,
  verifyOtp,
  checkVerification,
} from '../controllers/otp.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';
import { sanitizeBody } from '../middleware/sanitize.middleware.js';
import { uploadProfilePhoto } from '../middleware/upload.middleware.js';
import {
  validate,
  loginSchema,
  signupSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../middleware/validation.middleware.js';
import {
  loginLimiter,
  signupLimiter,
  otpLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimit.middleware.js';

const router = express.Router();

/**
 * -----------------------
 * Public Routes
 * -----------------------
 */

// OTP Routes (for signup verification)
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.get('/check-verification', checkVerification);

// Signup (OWNER)
router.post('/check-email-uniqueness', checkEmailUniqueness);
router.post('/signup', signupLimiter, validate(signupSchema), signup);

// Login
router.post('/login', loginLimiter, validate(loginSchema), login);

// Refresh Token (Rotation)
router.post('/refresh', refreshToken);

// Forgot & Reset Password
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

// Contact Support / Ticket Submission
router.post('/contact', submitSupportTicket);

/**
 * -----------------------
 * Protected Routes
 * -----------------------
 */

// Get current logged-in user profile
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadProfilePhoto.single('profilePhoto'), sanitizeBody, auditAction('UPDATE', 'USER'), updateProfile);

// Change Password
router.post('/change-password', protect, passwordResetLimiter, changePassword);

// Logout
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

/**
 * -----------------------
 * OWNER → STAFF MANAGEMENT
 * -----------------------
 */
// Create new staff
router.post('/staff', protect, ownerOnly, sanitizeBody, auditAction('CREATE', 'USER'), createStaff);

// Get list of staff
router.get('/staff', protect, ownerOnly, getStaff);

// Update staff member
router.put('/staff/:id', protect, ownerOnly, sanitizeBody, auditAction('UPDATE', 'USER'), updateStaff);

// Delete staff member
router.delete('/staff/:id', protect, ownerOnly, auditAction('DELETE', 'USER'), deleteStaff);

export default router;
