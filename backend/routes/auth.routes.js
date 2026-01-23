/**
 * routes/auth.routes.js
 *
 * Responsibility:
 * - Define authentication-related API routes
 * - Keep routes clean and predictable
 * - Delegate logic to controller
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * -----------------------
 * Public Routes
 * -----------------------
 */

/**
 * Login (OWNER / STAFF)
 * POST /api/v1/auth/login
 */
router.post('/login', authController.login);

/**
 * -----------------------
 * Protected Routes
 * -----------------------
 */

/**
 * Get current logged-in user profile
 * GET /api/v1/auth/me
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * Logout (stateless for now, token-based)
 * POST /api/v1/auth/logout
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
