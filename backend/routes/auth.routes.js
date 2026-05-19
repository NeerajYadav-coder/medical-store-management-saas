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




/**
 * routes/auth.routes.js
 *
 * Responsibility:
 * - Define authentication-related API routes
 * - Keep routes clean and predictable
 * - Delegate logic to controller
 */

import express from 'express';
import {
  signup,
  login,
  getMe,
  logout,
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
} from '../controllers/auth.controller.js';
import {
  sendOtp,
  verifyOtp,
  checkVerification,
} from '../controllers/otp.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';


const router = express.Router();

/**
 * -----------------------
 * Public Routes
 * -----------------------
 */

// OTP Routes (for signup verification)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/check-verification', checkVerification);

// Signup (OWNER)
router.post('/signup', signup);

// Login
router.post('/login', auditAction('LOGIN', 'USER'), login);

/**
 * -----------------------
 * Protected Routes
 * -----------------------
 */

// Get current logged-in user profile
router.get('/me', protect, getMe);

// Logout
router.post('/logout', protect, logout);

/**
 * -----------------------
 * OWNER → STAFF MANAGEMENT
 * -----------------------
 */
// Create new staff
router.post('/staff', protect, ownerOnly, auditAction('CREATE', 'USER'), createStaff);

// Get list of staff
router.get('/staff', protect, ownerOnly, getStaff);

// Update staff member
router.put('/staff/:id', protect, ownerOnly, auditAction('UPDATE', 'USER'), updateStaff);

// Delete staff member
router.delete('/staff/:id', protect, ownerOnly, auditAction('DELETE', 'USER'), deleteStaff);

export default router;
