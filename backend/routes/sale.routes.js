/**
 * routes/sale.routes.js
 * Sale/Billing routes with symptom and doctor tracking
 */

import express from 'express';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import Medicine from '../models/Medicine.js';
import MedicineBatch from '../models/MedicineBatch.js';
import Customer from '../models/Customer.js';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';
import { hasPermission } from '../middleware/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all sales with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, date } = req.query;
    
    const query = { 
      medicalStoreId: req.user.medicalStoreId,
    };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.billDate = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const sales = await Sale.find(query)
      .sort({ billDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('customerId', 'name phone')
      .populate('billedBy', 'name')
      .lean(); // Use lean for easier modification

    // Sanitize financial data depending on permissions
    const canViewFinancials = req.user.role === ROLES.OWNER || 
                             (req.user.permissions && req.user.permissions.includes(PERMISSIONS.VIEW_FINANCIAL_REPORTS));

    if (!canViewFinancials) {
      sales.forEach(sale => {
        delete sale.totalCost;
        delete sale.grossProfit;
        delete sale.netProfit;
        // Keep paymentDetails as it is relevant for cashiers
      });
    }
    
    const total = await Sale.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: sales,
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

// Get today's sales
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sales = await Sale.find({
      medicalStoreId: req.user.medicalStoreId,
      billDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'VOID' },
      status: { $ne: 'VOID' },
    })
      .sort({ billDate: -1 })
      .populate('customerId', 'name phone')
      .lean();

    // Sanitize financial data
    const canViewFinancials = req.user.role === ROLES.OWNER || 
                             (req.user.permissions && req.user.permissions.includes(PERMISSIONS.VIEW_FINANCIAL_REPORTS));

    if (!canViewFinancials) {
      sales.forEach(sale => {
        delete sale.totalCost;
        delete sale.grossProfit;
        delete sale.netProfit;
      });
    }
    
    res.status(200).json({
      success: true,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
});

// Get daily summary
router.get('/summary/daily', async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    const summary = await Sale.getDailySummary(req.user.medicalStoreId, date);
    
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

// Get symptom-wise analysis
router.get('/analysis/symptoms', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const analysis = await Sale.getSymptomAnalysis(req.user.medicalStoreId, start, end);
    
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
});

// Generate bill number
router.get('/generate-bill-number', async (req, res, next) => {
  try {
    const billNumber = await Sale.generateBillNumber(req.user.medicalStoreId);
    
    res.status(200).json({
      success: true,
      billNumber,
    });
  } catch (error) {
    next(error);
  }
});

// Get sale by ID
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    })
      .populate('customerId')
      .populate('doctorId')
      .populate('billedBy', 'name');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    // Get sale items
    let items = await SaleItem.find({ saleId: sale._id }).lean();
    let saleObj = sale.toObject();

    // Sanitize financial data
    const canViewFinancials = req.user.role === ROLES.OWNER || 
                             (req.user.permissions && req.user.permissions.includes(PERMISSIONS.VIEW_FINANCIAL_REPORTS));
    
    // Check purchase price permission separately
    const canViewPurchasePrice = req.user.role === ROLES.OWNER || 
                               (req.user.permissions && req.user.permissions.includes(PERMISSIONS.VIEW_PURCHASE_PRICE));

    if (!canViewFinancials) {
      delete saleObj.totalCost;
      delete saleObj.grossProfit;
      delete saleObj.netProfit;
    }

    if (!canViewPurchasePrice) {
      items = items.map(item => {
        const i = { ...item };
        delete i.purchasePrice;
        delete i.costAmount;
        delete i.profitAmount;
        return i;
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...saleObj,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get sale by bill number
router.get('/bill/:billNumber', async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      billNumber: req.params.billNumber,
      medicalStoreId: req.user.medicalStoreId,
    })
      .populate('customerId')
      .populate('doctorId');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    // Get items
    let items = await SaleItem.find({ saleId: sale._id }).lean();
    let saleObj = sale.toObject();

    // Sanitize
    const canViewFinancials = req.user.role === ROLES.OWNER || 
                             (req.user.permissions && req.user.permissions.includes(PERMISSIONS.VIEW_FINANCIAL_REPORTS));
    
    const canViewPurchasePrice = req.user.role === ROLES.OWNER || 
                               (req.user.permissions && req.user.permissions.includes(PERMISSIONS.VIEW_PURCHASE_PRICE));

    if (!canViewFinancials) {
      delete saleObj.totalCost;
      delete saleObj.grossProfit;
      delete saleObj.netProfit;
    }

    if (!canViewPurchasePrice) {
      items = items.map(item => {
        const i = { ...item };
        delete i.purchasePrice;
        delete i.costAmount;
        delete i.profitAmount;
        return i;
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...saleObj,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create sale (billing)
router.post('/', auditAction('CREATE', 'SALE'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      billNumber,
      customerId,
      customerName,
      customerPhone,
      doctorId,
      doctorName,
      isPrescribed,
      symptoms,
      isRepeatCustomer,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      discountReason,
      taxableAmount,
      totalGst,
      roundOff,
      grandTotal,
      totalCost,
      grossProfit,
      netProfit,
      paymentMode,
      paymentStatus,
      amountPaid,
      notes,
    } = req.body;

    // 🛡 DISCOUNT CONTROL POLICY
    // Staff/Manager max discount check (e.g. 10%)
    if (req.user.role !== ROLES.OWNER && discountValue > 10) {
      // unless they have a specific override permission (future)
      return res.status(403).json({
        success: false,
        message: 'Discount exceeds authorized limit (10%). Ask owner for approval.',
      });
    }
    
    // Create sale
    const sale = await Sale.create([{
      medicalStoreId: req.user.medicalStoreId,
      billNumber,
      customerId,
      customerName,
      customerPhone,
      doctorId,
      doctorName,
      isPrescribed,
      symptoms,
      isRepeatCustomer,
      totalItems: items.length,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxableAmount,
      cgstAmount: totalGst / 2,
      sgstAmount: totalGst / 2,
      totalGst,
      roundOff,
      grandTotal,
      totalCost,
      grossProfit,
      netProfit,
      paymentMode,
      paymentDetails: {
        [paymentMode.toLowerCase()]: grandTotal,
      },
      paymentStatus,
      amountPaid,
      balanceAmount: grandTotal - amountPaid,
      billedBy: req.user._id,
      billedByName: req.user.name,
      notes,
    }], { session });
    
    // Create sale items and update stock
    const saleItems = [];
    
    for (const item of items) {
      // Create sale item
      const saleItem = await SaleItem.create([{
        medicalStoreId: req.user.medicalStoreId,
        saleId: sale[0]._id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        medicineDosage: item.medicineDosage,
        medicineForm: item.medicineForm,
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        purchasePrice: item.purchasePrice,
        discountPercent: item.discountPercent || 0,
        gstRate: item.gstRate || 12,
        subtotal: item.quantity * item.sellingPrice,
        totalAmount: item.quantity * item.sellingPrice * (1 - (item.discountPercent || 0) / 100),
        costAmount: item.quantity * item.purchasePrice,
        profitAmount: (item.quantity * item.sellingPrice * (1 - (item.discountPercent || 0) / 100)) - (item.quantity * item.purchasePrice),
      }], { session });
      
      saleItems.push(saleItem[0]);
      
      // Update batch stock
      const batch = await MedicineBatch.findById(item.batchId).session(session);
      if (batch) {
        await batch.sell(item.quantity);
      }
      
      // Update medicine stats
      await Medicine.findByIdAndUpdate(
        item.medicineId,
        {
          $inc: {
            totalUnitsSold: item.quantity,
            totalRevenue: item.quantity * item.sellingPrice,
            totalProfit: saleItem[0].profitAmount,
          },
        },
        { session }
      );
    }
    
    // Update customer stats if exists
    if (customerId) {
      const customer = await Customer.findById(customerId).session(session);
      if (customer) {
        await customer.updateStatsAfterSale(grandTotal, netProfit, isPrescribed);
      }
    }
    
    // Update doctor stats if exists
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId).session(session);
      if (doctor) {
        await doctor.updateStatsAfterSale(grandTotal);
      }
    }
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: {
        ...sale[0].toObject(),
        items: saleItems,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// Void sale
router.post('/:id/void', hasPermission(PERMISSIONS.DELETE_SALE), auditAction('UPDATE', 'SALE'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { reason } = req.body;
    
    const sale = await Sale.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    }).session(session);
    
    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    if (sale.status === 'VOID') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Sale already voided',
      });
    }
    
    // Get sale items and restore stock
    const items = await SaleItem.find({ saleId: sale._id }).session(session);
    
    for (const item of items) {
      const batch = await MedicineBatch.findById(item.batchId).session(session);
      if (batch) {
        await batch.returnStock(item.quantity);
      }
    }
    
    // Update sale status
    sale.status = 'VOID';
    sale.voidReason = reason;
    sale.voidedAt = new Date();
    sale.voidedBy = req.user._id;
    await sale.save({ session });
    
    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: 'Sale voided successfully',
      data: sale,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export default router;
