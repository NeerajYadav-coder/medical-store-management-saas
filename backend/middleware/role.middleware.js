// /**
//  * middleware/role.middleware.js
//  *
//  * Responsibility:
//  * - Enforce role-based access control
//  * - OWNER vs STAFF permissions
//  * - Prevent privilege abuse
//  *
//  * This middleware is used AFTER auth.middleware.js
//  */

// import { ROLES } from '../constants/roles.js';



// /**
//  * Generic role checker
//  * @param {...string} allowedRoles
//  */
// const allowRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !req.user.role) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied',
//       });
//     }

//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'You do not have permission to perform this action',
//       });
//     }

//     next();
//   };
// };

// /**
//  * Convenience wrappers
//  * (Readable, explicit, safe)
//  */

// const ownerOnly = allowRoles(roles.OWNER);

// const ownerOrStaff = allowRoles(roles.OWNER, roles.STAFF);

// module.exports = {
//   allowRoles,
//   ownerOnly,
//   ownerOrStaff,
// };


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

import { ROLES } from '../constants/roles.js';

/**
 * Generic role checker
 * @param {...string} allowedRoles
 */
export const allowRoles = (...allowedRoles) => {
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
 */
export const ownerOnly = allowRoles(ROLES.OWNER);
export const ownerOrStaff = allowRoles(ROLES.OWNER, ROLES.STAFF);


// /**
//  * middleware/role.middleware.js
//  *
//  * Responsibility:
//  * - Enforce role-based access control
//  * - OWNER vs STAFF permissions
//  * - Prevent privilege abuse
//  * - Check for active users (new!)
//  *
//  * This middleware is used AFTER auth.middleware.js
//  */

// import { ROLES } from '../constants/roles.js';

// /**
//  * Generic role checker
//  * @param {...string} allowedRoles
//  */
// export const allowRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !req.user.role) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied',
//       });
//     }

//     // NEW: Check if user is active (e.g., not fired/deactivated)
//     // Why: Preserves audit logs while blocking access
//     if (!req.user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Account is inactive. Contact the owner.',
//       });
//     }

//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'You do not have permission to perform this action',
//       });
//     }

//     next();
//   };
// };

// /**
//  * Convenience wrappers
//  */
// export const ownerOnly = allowRoles(ROLES.OWNER);
// export const ownerOrStaff = allowRoles(ROLES.OWNER, ROLES.STAFF); // NEW: Exported for reuse in other routes (e.g., sales views)