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
} from '../controllers/auth.controller.js';
import { createStaff } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';


const router = express.Router();

/**
 * -----------------------
 * Public Routes
 * -----------------------
 */

// Signup (OWNER / STAFF)
router.post('/signup', signup);

// Login
router.post('/login', login);

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
 * OWNER → CREATE STAFF
 * -----------------------
 * POST /api/v1/auth/staff
 */
router.post('/staff', protect, ownerOnly, createStaff);

export default router;
