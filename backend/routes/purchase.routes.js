/**
 * routes/purchase.routes.js
 * Purchase invoice routes
 * Handles incoming stock, creates batches, updates supplier stats
 */

import express from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import PurchaseItem from '../models/PurchaseItem.js';
import MedicineBatch from '../models/MedicineBatch.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOrStaff } from '../middleware/role.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);
// Purchases are Owner and Staff business
router.use(ownerOrStaff);

// Get all purchases
router.get('/', async (req, res, next) => {
  // ... existing logic ...
  try {
    const { page = 1, limit = 50, supplierId, startDate, endDate } = req.query;
    
    const query = { 
      medicalStoreId: req.user.medicalStoreId,
    };
    
    if (supplierId) {
      query.supplierId = supplierId;
    }
    
    if (startDate && endDate) {
      query.supplierBillDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const purchases = await Purchase.find(query)
      .sort({ supplierBillDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('supplierId', 'name vendorCode');
    
    const total = await Purchase.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: purchases,
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

// Create purchase (Inward Stock)
router.post('/', auditAction('CREATE', 'PURCHASE'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      supplierId,
      supplierName,
      supplierBillNumber,
      supplierBillDate,
      items,
      subtotal,
      discountAmount,
      taxableAmount,
      totalGst,
      roundOff,
      grandTotal,
      amountPaid,
      paymentStatus,
      dueDate,
      notes,
    } = req.body;
    
    // Create purchase record
    const purchase = await Purchase.create([{
      medicalStoreId: req.user.medicalStoreId,
      supplierId,
      supplierName,
      supplierBillNumber,
      supplierBillDate,
      totalItems: items.length,
      subtotal,
      discountAmount,
      taxableAmount,
      totalGst,
      cgst: req.body.cgst || totalGst / 2, // Default to 50/50 split if not provided
      sgst: req.body.sgst || totalGst / 2,
      igst: req.body.igst || 0,
      roundOff,
      grandTotal,
      amountPaid,
      paymentStatus,
      dueDate,
      balanceAmount: grandTotal - amountPaid,
      receivedBy: req.user._id,
      receivedByName: req.user.name,
      notes,
    }], { session });
    
    const purchaseItems = [];
    
    for (const item of items) {
      // 1. Create or Update Medicine Batch
      // Check if batch exists for this medicine
      let batch = await MedicineBatch.findOne({
        medicalStoreId: req.user.medicalStoreId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
      }).session(session);
      
      if (batch) {
        // Update existing batch
        const newUnits = (item.quantity + (item.freeQuantity || 0)) * (item.unitsPerPack || 1);
        batch.quantityReceived += newUnits;
        batch.quantityRemaining += newUnits;
        batch.purchasePrice = item.purchasePrice / (item.unitsPerPack || 1);
        batch.mrp = item.mrp / (item.unitsPerPack || 1);
        batch.sellingPrice = item.sellingPrice || batch.mrp;
        batch.supplierId = supplierId;
        await batch.save({ session });
      } else {
        // Create new batch
        const totalUnits = (item.quantity + (item.freeQuantity || 0)) * (item.unitsPerPack || 1);
        const perUnitPurchasePrice = item.purchasePrice / (item.unitsPerPack || 1);
        const perUnitMRP = item.mrp / (item.unitsPerPack || 1);
        const perUnitSellingPrice = item.sellingPrice || perUnitMRP;

        batch = await MedicineBatch.create([{
          medicalStoreId: req.user.medicalStoreId,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          manufacturingDate: item.manufacturingDate,
          quantityReceived: totalUnits, // Real inventory count
          quantityRemaining: totalUnits,
          purchasePrice: perUnitPurchasePrice, 
          sellingPrice: perUnitSellingPrice, 
          mrp: perUnitMRP,
          supplierId,
          supplierName,
        }], { session });
        batch = batch[0];
      }
      
      // 2. Create Purchase Item (Stores Pack-level info for Invoice Audit)
      const purchaseItem = await PurchaseItem.create([{
        medicalStoreId: req.user.medicalStoreId,
        purchaseId: purchase[0]._id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchId: batch._id,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        manufacturingDate: item.manufacturingDate,
        unitsPerPack: item.unitsPerPack || 1,
        quantity: item.quantity,
        freeQuantity: item.freeQuantity || 0,
        totalQuantity: item.quantity + (item.freeQuantity || 0),
        mrp: item.mrp, // Pack MRP
        purchasePrice: item.purchasePrice, // Pack Price
        sellingPrice: item.sellingPrice || item.mrp, 
        gstRate: item.gstRate,
        cgst: item.cgst || (item.taxAmount / 2),
        sgst: item.sgst || (item.taxAmount / 2),
        igst: item.igst || 0,
        discountPercent: item.discountPercent || 0,
        subtotal: item.subtotal,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
        margin: item.margin,
      }], { session });
      
      purchaseItems.push(purchaseItem[0]);
    }
    
    // 3. Update Supplier Stats
    const supplier = await Supplier.findById(supplierId).session(session);
    if (supplier) {
      supplier.totalPurchaseValue = (supplier.totalPurchaseValue || 0) + grandTotal;
      supplier.currentCredit = (supplier.currentCredit || 0) + (grandTotal - amountPaid);
      supplier.lastPurchaseDate = new Date();
      await supplier.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession(); // Ensure session is ended here too if successful, though finally block handles it

    res.status(201).json({
      success: true,
      data: {
        ...purchase[0].toObject(),
        items: purchaseItems,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// Update purchase (only notes or payment status)
router.patch('/:id', auditAction('UPDATE', 'PURCHASE'), async (req, res, next) => {
  try {
    const { notes, paymentStatus, amountPaid } = req.body;
    
    const updates = {};
    if (notes) updates.notes = notes;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (amountPaid !== undefined) {
      updates.amountPaid = amountPaid;
      // Recalculate balance
      // This is simplified; ideally needs robust transaction management for payments
    }
    
    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      updates,
      { new: true }
    );
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
});

// Get purchase by ID with items
router.get('/:id', async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    }).populate('supplierId', 'name vendorCode phone email address gstNumber');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    const items = await PurchaseItem.find({
      purchaseId: purchase._id,
      medicalStoreId: req.user.medicalStoreId,
    });

    res.status(200).json({
      success: true,
      data: {
        ...purchase.toObject(),
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
