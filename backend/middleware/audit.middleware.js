import AuditLog from '../models/AuditLog.js';

/**
 * Middleware to log critical actions
 * @param {string} action - 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
 * @param {string} entity - 'SALE', 'PURCHASE', 'MEDICINE', 'USER', 'SUPPLIER'
 */
export const auditAction = (action, entity) => {
  return async (req, res, next) => {
    // We intercept the response to log only on success
    const originalSend = res.json;

    res.json = function (data) {
      res.json = originalSend; // Restore original

      // Only log if success
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const safeBody = { ...req.body };
          if (safeBody.password) delete safeBody.password;
          if (safeBody.passwordHash) delete safeBody.passwordHash;

          const logData = {
            medicalStoreId: req.user?.medicalStoreId || data?.user?.medicalStoreId || data?.medicalStoreId,
            userId: req.user?._id || data?.user?.id,
            action,
            entityType: entity,
            entityId: data?.data?._id || data?.staff?._id || data?.staff?.id || req.params.id || data?.user?.id,
            details: {
              method: req.method,
              url: req.originalUrl,
              body: action === 'LOGIN' ? {} : safeBody,
              params: req.params,
              query: req.query,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          };

          // Create log asynchronously (fire and forget)
          AuditLog.create(logData).catch(err => 
            console.error('Audit Log Error:', err)
          );
        } catch (error) {
          console.error('Audit Log Middleware Error:', error);
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
};
