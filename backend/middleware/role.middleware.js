/**
 * middleware/role.middleware.js
 *
 * Responsibility:
 * - Enforce role-based access control
 * - OWNER vs STAFF permissions
 * - Prevent privilege abuse
 *
 * This middleware is used AFTER auth.middleware.js
 */

const roles = require('../constants/roles');

/**
 * Generic role checker
 * @param {...string} allowedRoles
 */
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

/**
 * Convenience wrappers
 * (Readable, explicit, safe)
 */

const ownerOnly = allowRoles(roles.OWNER);

const ownerOrStaff = allowRoles(roles.OWNER, roles.STAFF);

module.exports = {
  allowRoles,
  ownerOnly,
  ownerOrStaff,
};
