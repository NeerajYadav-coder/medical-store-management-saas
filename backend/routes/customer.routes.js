/**
 * routes/customer.routes.js
 * Customer routes with repeat buyer tracking
 */

import express from 'express';
import Customer from '../models/Customer.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all customers
router.get('/', async (req, res, next) => {
  try {
    const { loyaltyCategory, page = 1, limit = 50 } = req.query;
    
    const query = { 
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
    };
    
    if (loyaltyCategory) {
      query.loyaltyCategory = loyaltyCategory;
    }
    
    const customers = await Customer.find(query)
      .sort({ lastVisitDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: customers,
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

// Search customers
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q, 'i');
    
    const customers = await Customer.find({
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
      $or: [
        { name: regex },
        { phone: regex },
      ],
    })
      .sort({ totalPurchases: -1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
});

// Get repeat buyers
router.get('/repeat-buyers', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const customers = await Customer.getRepeatBuyers(req.user.medicalStoreId, limit);
    
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
});

// Get VIP customers
router.get('/vip', async (req, res, next) => {
  try {
    const customers = await Customer.getVIPCustomers(req.user.medicalStoreId);
    
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
});

// Get customer by phone
router.get('/phone/:phone', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      medicalStoreId: req.user.medicalStoreId,
      phone: req.params.phone,
    });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Get customer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Create customer
router.post('/', auditAction('CREATE', 'CUSTOMER'), async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Quick create customer (minimal data)
router.post('/quick', auditAction('CREATE', 'CUSTOMER'), async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    
    let customer = null;
    if (phone?.trim()) {
      // Check if customer exists by phone
      customer = await Customer.findOne({
        medicalStoreId: req.user.medicalStoreId,
        phone: phone.trim(),
      });
    }
    
    if (customer) {
      return res.status(200).json({
        success: true,
        data: customer,
        message: 'Existing customer found',
      });
    }
    
    // Create new customer
    customer = await Customer.create({
      name: name || 'Customer',
      phone: phone?.trim() || undefined,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', auditAction('UPDATE', 'CUSTOMER'), async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Update loyalty category
router.patch('/:id/loyalty', async (req, res, next) => {
  try {
    const { loyaltyCategory } = req.body;
    
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { loyaltyCategory },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Update credit limit
router.patch('/:id/credit-limit', async (req, res, next) => {
  try {
    const { creditLimit } = req.body;
    
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { creditLimit },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// Delete customer (soft delete)
router.delete('/:id', ownerOnly, auditAction('DELETE', 'CUSTOMER'), async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { isActive: false },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
