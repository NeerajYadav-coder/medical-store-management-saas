/**
 * middleware/auth.middleware.js
 *
 * Responsibility:
 * - Verify JWT access token
 * - Identify logged-in user
 * - Attach user info to request
 * - Block unauthenticated access
 *
 * This middleware PROTECTS routes
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authMiddleware = (req, res, next) => {
  try {
    /**
     * Expect token in Authorization header
     * Format: Bearer <token>
     */
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];

    /**
     * Verify token
     */
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    /**
     * Attach user context to request
     * This is CRITICAL for multi-tenant isolation
     */
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      medicalStoreId: decoded.medicalStoreId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = authMiddleware;
