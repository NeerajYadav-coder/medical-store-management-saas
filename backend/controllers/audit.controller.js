import AuditLog from '../models/AuditLog.js';

/**
 * Get audit logs with filtering and pagination
 * OWNER only
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      entity, 
      action, 
      userId, 
      startDate, 
      endDate 
    } = req.query;

    const query = {
      medicalStoreId: req.user.medicalStoreId,
    };

    if (entity) query.entityType = entity;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
