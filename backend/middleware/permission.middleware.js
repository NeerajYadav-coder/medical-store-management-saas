/**
 * middleware/permission.middleware.js
 * 
 * Responsibility:
 * - Enforce granular permission checks
 * - Validates req.user.permissions (populated in DB/Auth)
 */

import { ROLES } from '../constants/roles.js';

/**
 * Check if user has specific permission
 * @param {string} requiredPermission 
 */
export const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // OWNER has all permissions implicitly
      if (req.user.role === ROLES.OWNER) {
        return next();
      }

      // Check if user has permission
      // Note: req.user from auth middleware might not have permissions array if it comes from JWT
      // We need to ensure permissions are available. 
      // If we store permissions in JWT, this works. 
      // If not, we fetched user in auth.controller/getMe. 
      // But for middleware chain, we might need to fetch user if permissions are missing.
      // However, efficient design suggests putting critical permissions in JWT or caching user.
      // For now, let's assume req.user has permissions (we'll ensure this in auth.middleware or by query)
      
      const userPermissions = req.user.permissions || [];
      
      if (userPermissions.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. Requires permission: ${requiredPermission}`,
      });

    } catch (error) {
      console.error('Permission check failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check',
      });
    }
  };
};

export default hasPermission;
