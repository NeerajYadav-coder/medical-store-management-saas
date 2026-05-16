/**
 * routes/supplier.routes.js
 * Supplier routes with vendor code and margin tracking
 */

import express from 'express';
import Supplier from '../models/Supplier.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);
// Strict: Suppliers are Owner-only business
router.use(ownerOnly);

// Get all suppliers
router.get('/', async (req, res, next) => {
  try {
    const { marginCategory, page = 1, limit = 50 } = req.query;
    
    const query = { 
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
    };
    
    if (marginCategory) {
      query.marginCategory = marginCategory;
    }
    
    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Supplier.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: suppliers,
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

// Search suppliers
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q, 'i');
    
    const suppliers = await Supplier.find({
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
      $or: [
        { name: regex },
        { vendorCode: regex },
        { phone: regex },
        { contactPerson: regex },
      ],
    })
      .sort({ totalPurchaseValue: -1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
});

// Get best margin suppliers
router.get('/best-margin', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const suppliers = await Supplier.getBestMarginSuppliers(req.user.medicalStoreId, limit);
    
    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
});

// Get supplier by vendor code
router.get('/code/:code', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      medicalStoreId: req.user.medicalStoreId,
      vendorCode: req.params.code.toUpperCase(),
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// Get supplier by ID
router.get('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// Create supplier
router.post('/', async (req, res, next) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// Update supplier
router.put('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// Update supplier rating
router.patch('/:id/rating', async (req, res, next) => {
  try {
    const { rating } = req.body;
    
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { rating },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { isActive: false },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Supplier deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
