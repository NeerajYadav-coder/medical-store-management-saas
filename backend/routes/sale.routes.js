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
import whatsappService from '../services/whatsapp.service.js';
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

    // Validate items array
    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // 🛡 DISCOUNT CONTROL POLICY — non-owners limited to 10%
    const effectiveDiscount = parseFloat(discountValue) || 0;
    if (req.user.role !== 'OWNER' && discountType !== 'NONE' && effectiveDiscount > 10) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Discount exceeds authorized limit (10%). Ask owner for approval.',
      });
    }
    
    // ✅ STEP 1: Pre-validate ALL batches before writing anything
    const batchDocs = [];
    for (const item of items) {
      if (!item.batchId) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Batch ID missing for ${item.medicineName}` });
      }
      const batch = await MedicineBatch.findOne({
        _id: item.batchId,
        medicalStoreId: req.user.medicalStoreId,
        isActive: true,
      }).session(session);

      if (!batch) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: `Batch not found for: ${item.medicineName}` });
      }
      if (batch.expiryDate <= new Date()) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Batch ${batch.batchNumber} of ${item.medicineName} is expired` });
      }
      if (batch.quantityRemaining < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.medicineName}. Available: ${batch.quantityRemaining}, Requested: ${item.quantity}`,
        });
      }
      batchDocs.push(batch);
    }

    // ✅ STEP 2: Create sale record
    const sale = await Sale.create([{
      medicalStoreId: req.user.medicalStoreId,
      billNumber,
      customerId: customerId || null,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      doctorId: doctorId || null,
      doctorName: doctorName || '',
      isPrescribed: !!isPrescribed,
      symptoms: symptoms || [],
      isRepeatCustomer: !!isRepeatCustomer,
      totalItems: items.length,
      subtotal: parseFloat(subtotal) || 0,
      discountType: discountType || 'NONE',
      discountValue: effectiveDiscount,
      discountAmount: parseFloat(discountAmount) || 0,
      discountReason: discountReason || '',
      taxableAmount: parseFloat(taxableAmount) || 0,
      cgstAmount: (parseFloat(totalGst) || 0) / 2,
      sgstAmount: (parseFloat(totalGst) || 0) / 2,
      totalGst: parseFloat(totalGst) || 0,
      roundOff: parseFloat(roundOff) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      totalCost: parseFloat(totalCost) || 0,
      grossProfit: parseFloat(grossProfit) || 0,
      netProfit: parseFloat(netProfit) || 0,
      paymentMode: (paymentMode || 'CASH').toUpperCase(),
      paymentDetails: {
        [(paymentMode || 'CASH').toLowerCase()]: parseFloat(grandTotal) || 0,
      },
      paymentStatus: paymentStatus || 'PAID',
      amountPaid: parseFloat(amountPaid) || parseFloat(grandTotal) || 0,
      balanceAmount: Math.max(0, (parseFloat(grandTotal) || 0) - (parseFloat(amountPaid) || 0)),
      billedBy: req.user._id,
      billedByName: req.user.name,
      notes: notes || '',
    }], { session });
    
    // ✅ STEP 3: Create sale items and update stock within transaction
    const saleItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const batch = batchDocs[i];

      const itemSubtotal = item.quantity * item.sellingPrice;
      const discPct = parseFloat(item.discountPercent) || 0;
      const itemDiscount = (itemSubtotal * discPct) / 100;
      const itemTotalAmount = itemSubtotal - itemDiscount;
      const itemCost = item.quantity * (item.purchasePrice || 0);
      const itemProfit = itemTotalAmount - itemCost;

      // Create sale item
      const saleItem = await SaleItem.create([{
        medicalStoreId: req.user.medicalStoreId,
        saleId: sale[0]._id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        medicineDosage: item.medicineDosage || '',
        medicineForm: item.medicineForm || '',
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        purchasePrice: item.purchasePrice || 0,
        discountPercent: discPct,
        gstRate: item.gstRate || 0,
        subtotal: itemSubtotal,
        totalAmount: itemTotalAmount,
        costAmount: itemCost,
        profitAmount: Math.max(0, itemProfit),
      }], { session });
      
      saleItems.push(saleItem[0]);
      
      // ✅ Update batch stock within session using atomic operator
      await MedicineBatch.findByIdAndUpdate(
        item.batchId,
        {
          $inc: {
            quantitySold: item.quantity,
            quantityRemaining: -item.quantity,
          },
        },
        { session, new: true }
      );
      
      // Update medicine sales stats
      await Medicine.findByIdAndUpdate(
        item.medicineId,
        {
          $inc: {
            totalUnitsSold: item.quantity,
            totalRevenue: itemTotalAmount,
            totalProfit: Math.max(0, itemProfit),
          },
        },
        { session }
      );
    }
    
    // ✅ STEP 4: Update customer stats if linked
    if (customerId) {
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: { totalPurchases: 1, totalSpent: parseFloat(grandTotal) || 0 },
          $set: { lastVisit: new Date() },
        },
        { session }
      );
    }
    
    // Update doctor stats if linked
    if (doctorId) {
      await Doctor.findByIdAndUpdate(
        doctorId,
        {
          $inc: { totalPrescriptions: 1, totalRevenue: parseFloat(grandTotal) || 0 },
        },
        { session }
      );
    }
    
    await session.commitTransaction();
    
    // Trigger WhatsApp Purchase Thank You asynchronously (non-blocking)
    whatsappService.sendPurchaseReceipt(sale[0]._id).catch((err) => {
      console.error('Failed to automatically send WhatsApp receipt:', err);
    });
    
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
      // Restore batch stock atomically within the session
      await MedicineBatch.findByIdAndUpdate(
        item.batchId,
        {
          $inc: {
            quantitySold: -item.quantity,
            quantityRemaining: item.quantity,
          },
        },
        { session }
      );
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
