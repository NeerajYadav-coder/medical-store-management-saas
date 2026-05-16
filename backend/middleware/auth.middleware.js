// /**
//  * middleware/auth.middleware.js
//  *
//  * Responsibility:
//  * - Verify JWT access token
//  * - Identify logged-in user
//  * - Attach user info to request
//  * - Block unauthenticated access
//  *
//  * This middleware PROTECTS routes
//  */

// const jwt = require('jsonwebtoken');
// const env = require('../config/env');

// const authMiddleware = (req, res, next) => {
//   try {
//     /**
//      * Expect token in Authorization header
//      * Format: Bearer <token>
//      */
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//     }

//     const token = authHeader.split(' ')[1];

//     /**
//      * Verify token
//      */
//     const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

//     /**
//      * Attach user context to request
//      * This is CRITICAL for multi-tenant isolation
//      */
//     req.user = {
//       userId: decoded.userId,
//       role: decoded.role,
//       medicalStoreId: decoded.medicalStoreId,
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token',
//     });
//   }
// };

// module.exports = authMiddleware;













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

import jwt from 'jsonwebtoken';
import env from '../config/env.js';

import User from '../models/User.js';

export const protect = async (req, res, next) => {
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
    // Fetch user from DB to get permissions and ensure active status
    const user = await User.findById(decoded.userId).select('name email role medicalStoreId permissions isActive');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User request failed: User inactive or not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
