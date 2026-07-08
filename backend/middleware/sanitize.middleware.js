/**
 * Request Body Sanitizer Middleware
 * 
 * Prevents Mass Assignment vulnerabilities (such as cross-tenant updates
 * or privilege escalation) by stripping restricted parameters from req.body
 * before controllers process the request.
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Fields that should never be injected/modified by users directly
    const restrictedFields = ['medicalStoreId', '_id', 'createdAt', 'updatedAt', 'tokenVersion'];

    // Prevent privilege escalation unless it is the staff management route
    const isStaffManagementRoute = req.originalUrl.includes('/api/v1/auth/staff');

    if (!isStaffManagementRoute) {
      restrictedFields.push('role', 'permissions');
    }

    // Strip the fields
    restrictedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        delete req.body[field];
      }
    });
  }
  next();
};

export default sanitizeBody;
