/**
 * routes/audit.routes.js
 * 
 * Responsibility:
 * - Fetch audit logs
 * - Protected access (Owner/Auth only)
 */

import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.middleware.js';
import { hasPermission } from '../middleware/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

router.use(protect);
router.use(hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS));

// Get audit logs
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, entity, action, userId, startDate, endDate } = req.query;

    const query = {
      medicalStoreId: req.user.medicalStoreId,
    };

    if (entity) query.entityType = entity;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email role')
      .lean();

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
});

export default router;
