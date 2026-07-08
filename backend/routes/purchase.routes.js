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
        batch.sellingPrice = (item.sellingPrice || item.mrp) / (item.unitsPerPack || 1);
        batch.supplierId = supplierId;
        if (item.expiryDate) batch.expiryDate = item.expiryDate;
        batch.isActive = true; // Reactivate in case it was previously marked as expired
        await batch.save({ session });
      } else {
        // Create new batch
        const totalUnits = (item.quantity + (item.freeQuantity || 0)) * (item.unitsPerPack || 1);
        const perUnitPurchasePrice = item.purchasePrice / (item.unitsPerPack || 1);
        const perUnitMRP = item.mrp / (item.unitsPerPack || 1);
        const perUnitSellingPrice = (item.sellingPrice || item.mrp) / (item.unitsPerPack || 1);

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
      // Calculate invoice average margin
      const invoiceAvgMargin = items.length > 0 ? items.reduce((acc, curr) => acc + (parseFloat(curr.margin) || 0), 0) / items.length : 0;
      const oldWeightedMargin = (supplier.avgMarginPercentage || 0) * (supplier.totalInvoices || 0);
      
      supplier.totalInvoices = (supplier.totalInvoices || 0) + 1;
      supplier.avgMarginPercentage = (oldWeightedMargin + invoiceAvgMargin) / supplier.totalInvoices;
      
      // Auto-categorize margin
      if (supplier.avgMarginPercentage >= 20) supplier.marginCategory = 'HIGH';
      else if (supplier.avgMarginPercentage >= 10) supplier.marginCategory = 'MEDIUM';
      else supplier.marginCategory = 'LOW';
      
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { notes, paymentStatus, amountPaid } = req.body;

    const purchase = await Purchase.findOne({
      _id: req.params.id, 
      medicalStoreId: req.user.medicalStoreId
    }).session(session);

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (notes !== undefined) purchase.notes = notes;
    if (paymentStatus) purchase.paymentStatus = paymentStatus;

    if (amountPaid !== undefined && amountPaid !== purchase.amountPaid) {
      const difference = amountPaid - purchase.amountPaid;
      purchase.amountPaid = amountPaid;
      purchase.balanceAmount = purchase.grandTotal - amountPaid;
      
      // Update supplier credit
      const supplier = await Supplier.findById(purchase.supplierId).session(session);
      if (supplier) {
        // If we paid MORE, currentCredit DECREASES (we owe them less)
        // If difference > 0, subtract from credit
        supplier.currentCredit = Math.max(0, (supplier.currentCredit || 0) - difference);
        await supplier.save({ session });
      }
      
      // Auto update payment status if not explicitly provided
      if (!req.body.paymentStatus) {
        if (purchase.balanceAmount <= 0) purchase.paymentStatus = 'PAID';
        else if (purchase.amountPaid > 0) purchase.paymentStatus = 'PARTIAL';
        else purchase.paymentStatus = 'PENDING';
      }
    }

    await purchase.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// Void Purchase (Rollback stock and supplier stats)
router.delete('/:id', auditAction('DELETE', 'PURCHASE'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId
    }).session(session);
    
    if (!purchase) {
      throw new Error('Purchase not found');
    }
    
    const items = await PurchaseItem.find({ purchaseId: purchase._id }).session(session);
    
    // 1. Validate if any batch has been sold
    for (const item of items) {
      const batch = await MedicineBatch.findById(item.batchId).session(session);
      if (batch) {
        // If remaining is less than what was purchased, it means some units were sold
        if (batch.quantityRemaining < item.totalQuantity) {
           throw new Error(`Cannot void purchase: Stock from batch ${batch.batchNumber} for ${item.medicineName} has already been sold or moved.`);
        }
      }
    }
    
    // 2. Rollback Stock Quantities
    for (const item of items) {
      const batch = await MedicineBatch.findById(item.batchId).session(session);
      if (batch) {
        batch.quantityReceived -= item.totalQuantity;
        batch.quantityRemaining -= item.totalQuantity;
        
        if (batch.quantityRemaining <= 0) {
           batch.status = 'OUT_OF_STOCK';
           if (batch.quantityReceived <= 0) {
              batch.isActive = false;
              batch.deactivationReason = 'Purchase Voided';
           }
        }
        await batch.save({ session });
      }
    }
    
    // 3. Rollback Supplier Stats
    const supplier = await Supplier.findById(purchase.supplierId).session(session);
    if (supplier) {
      // Rollback margin calculation
      const invoiceAvgMargin = items.length > 0 ? items.reduce((acc, curr) => acc + (parseFloat(curr.margin) || 0), 0) / items.length : 0;
      const oldWeightedMargin = (supplier.avgMarginPercentage || 0) * (supplier.totalInvoices || 0);
      
      supplier.totalInvoices = Math.max(0, (supplier.totalInvoices || 0) - 1);
      
      if (supplier.totalInvoices > 0) {
        supplier.avgMarginPercentage = Math.max(0, (oldWeightedMargin - invoiceAvgMargin) / supplier.totalInvoices);
      } else {
        supplier.avgMarginPercentage = 0;
      }
      
      // Auto-categorize margin
      if (supplier.avgMarginPercentage >= 20) supplier.marginCategory = 'HIGH';
      else if (supplier.avgMarginPercentage >= 10) supplier.marginCategory = 'MEDIUM';
      else supplier.marginCategory = 'LOW';
      
      supplier.totalPurchaseValue = Math.max(0, (supplier.totalPurchaseValue || 0) - purchase.grandTotal);
      supplier.currentCredit = Math.max(0, (supplier.currentCredit || 0) - (purchase.grandTotal - purchase.amountPaid));
      await supplier.save({ session });
    }
    
    // 4. Delete the purchase and its items
    await Purchase.deleteOne({ _id: purchase._id }).session(session);
    await PurchaseItem.deleteMany({ purchaseId: purchase._id }).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ success: true, message: 'Purchase voided successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // Return 400 for business logic errors instead of 500
    if (error.message.includes('Cannot void purchase')) {
      return res.status(400).json({ success: false, message: error.message });
    }
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

// Parse supplier invoice image using AI OCR
router.post('/parse-invoice', async (req, res, next) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // We will use Groq API with the 3 fallback keys
    const GROQ_API_KEYS = [
      'YOUR_GROQ_API_KEY_1',
      'YOUR_GROQ_API_KEY_2',
      'YOUR_GROQ_API_KEY_3'
    ];

    // Qwen is superior for complex dense tables and multi-lingual OCR
    // Llama is good for general tasks. We will try Qwen first, then Llama.
    const VISION_MODELS = [
      'qwen/qwen3.6-27b',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ];

    const promptText = `You are an elite AI system with over 10 years of domain expertise in Indian Pharmacy operations and Medical Billing.
Your specific job is to perform high-precision Optical Character Recognition (OCR) and structured data extraction from the provided supplier purchase invoice image. 
Medical invoices in India are extremely dense, noisy, and contain complex table grids. 
Examples of columns you will see: HSN, MFG, BATCH, EXP, QTY, FREE, RATE, N.RATE, S.RATE, MRP, DISC, CGST, SGST.

EXTRACT THE FOLLOWING INVOICE METADATA:
1. "supplierName": The name of the medical agency/distributor/supplier (e.g., "MAHAVEER MEDICAL AGENCY", "BANSAL DISTRIBUTERS", "SONALI MEDICAL STORE").
2. "supplierPhone": Their contact number.
3. "supplierEmail": Their email.
4. "supplierGstNumber": The 15-character GSTIN of the supplier (e.g., 09AANPG9333R1ZT).
5. "supplierDrugLicenseNumber": The DL (Drug License) number(s) (e.g., UP8020B001216).
6. "supplierBillNumber": The unique Invoice/Bill/Memo Number (e.g., "MMG002367", "GST003495").
7. "supplierBillDate": The date of the invoice strictly in YYYY-MM-DD format (convert 09-12-25 to 2025-12-09).

EXTRACT THE FOLLOWING LINE ITEMS (Array of Objects):
8. "items": An Array of Objects. For each medicine/product row in the invoice table, meticulously extract and map values from left to right into this array. Each object must contain exactly:
- "medicineName": The exact raw product name printed (e.g., "ASTHAKIND-DX-SYP 100ML", "CALCIGARD 10 CAP").
- "cleanName": The core brand name without dosage form, strength, or volume (e.g., "ASTHAKIND-DX", "CALCIGARD"). Aggressively strip terms like TAB, CAP, SYP, INJ, DROP, ML, MG, GM, BOLUS.
- "dosage": The strength or volume (e.g., "625MG", "250MG", "60ML", "10 CAP"). Extract this from the product name or packing.
- "form": Must be exactly one of: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'POWDER', 'GEL', 'SPRAY', 'INHALER', 'SUSPENSION', 'LOTION', 'OTHER']. Infer this from terms like TAB, CAP, SYP, INJ, DROP.
- "unitType": Packaging type. Must be exactly one of: ['STRIP', 'BOTTLE', 'VIAL', 'TUBE', 'BOX', 'PIECE', 'SACHET', 'AMPOULE']. (E.g., Tablets are usually STRIP, Syrups/Drops are BOTTLE, Injections are VIAL/AMPOULE).
- "unitsPerPack": Integer. Number of individual units in one pack. VERY IMPORTANT: Read the 'Packing' or 'Unit' column. "1*10" or "1x10" means 10. "1*15" means 15. "20X1X10 TA" means 10. "100ML" or "15ML" or "1" means 1. "10GM" means 1.
- "manufacturer": The manufacturing company, if present. Look for a separate 'MFG' column or abbreviations.
- "quantity": Integer. The billed quantity. Look closely for 'Qty.' or 'QTY' column. DO NOT confuse with HSN (e.g., 9018, 3004 are HSN codes, not quantity).
- "freeQuantity": Integer. The free quantity given. Look for 'Free' or 'SCH.' column. Default 0.
- "purchasePrice": Number. The primary billing rate or Price to Retailer (PTR). Look for 'Rate', 'N.Rate' (Net Rate), or 'PTR' column. DO NOT confuse with 'S.Rate' (Secondary Rate) or 'Amount'.
- "mrp": Number. The Maximum Retail Price per pack. Look for 'MRP' or 'Mrp.' column.
- "discountPercent": Number. The discount percentage applied. Look for 'Dis%', 'DISC.', or 'Disc' column (e.g., 29.52). Default 0.
- "gstRate": Number. The GST percentage (e.g., 5, 12, 18). Look for 'GST%' column. If split into CGST and SGST, sum them (e.g., CGST 2.5% + SGST 2.5% = 5).
- "batchNumber": String. The batch number. Look for 'Batch' or 'B.NO'.
- "expiryDate": String. The expiry date in YYYY-MM-DD format. Look for 'Exp.' column. Convert MM/YY to the LAST day of that month (e.g., "11/25" -> "2025-11-30", "Jul-27" -> "2027-07-31").

CRITICAL INSTRUCTIONS:
- You must deeply analyze the column headers and align the numbers perfectly. It is very easy to shift numbers (e.g. putting GST% in Discount, or HSN in Quantity). Read Left-to-Right carefully.
- If a field is missing, return an empty string or 0 as appropriate.
- Ensure the output is a PERFECT, strict JSON object containing the 7 metadata keys and the 1 "items" array key.
- No markdown wrappers, no introductory text, just the raw JSON object.`;

    let parsedData = null;
    let lastError = null;

    // Iterate models first, then API keys
    for (const model of VISION_MODELS) {
      if (parsedData) break;
      
      for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEYS[i]}`
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: promptText },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                  ]
                }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errText}`);
          }

          const data = await response.json();
          let candidateText = data.choices?.[0]?.message?.content;
          
          if (!candidateText) {
            throw new Error('Empty response from Groq API');
          }

          const cleanJsonStr = candidateText.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
          parsedData = JSON.parse(cleanJsonStr);
          
          // Break out of the API key loop since we succeeded!
          console.log(`Successfully parsed invoice using model ${model} with Groq API key ${i + 1}`);
          break;
        } catch (err) {
          console.error(`OCR attempt failed with model ${model}, key ${i + 1}:`, err.message);
          lastError = err;
          // Proceed to the next fallback API key
        }
      }
    }

    if (!parsedData) {
      throw lastError || new Error('All Groq API fallback models and keys failed to parse the invoice');
    }

    // --- ENFORCE STRICT ENUMS TO PREVENT MONGOOSE VALIDATION ERRORS ---
    if (parsedData && Array.isArray(parsedData.items)) {
      const validForms = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'POWDER', 'GEL', 'SPRAY', 'INHALER', 'SUPPOSITORY', 'PATCH', 'SUSPENSION', 'LOTION', 'OTHER'];
      const validUnitTypes = ['STRIP', 'BOTTLE', 'VIAL', 'TUBE', 'BOX', 'PIECE', 'SACHET', 'AMPOULE', 'CARTRIDGE'];
      
      parsedData.items = parsedData.items.map(item => {
        let safeForm = String(item.form).toUpperCase().trim();
        let safeUnitType = String(item.unitType).toUpperCase().trim();
        
        // Map common hallucinations
        if (safeUnitType === 'BLISTER') safeUnitType = 'STRIP';
        if (safeUnitType === 'PACK' || safeUnitType === 'PACKET') safeUnitType = 'BOX';
        if (safeUnitType === 'PCS' || safeUnitType === 'NOS') safeUnitType = 'PIECE';
        if (safeForm === 'TAB') safeForm = 'TABLET';
        if (safeForm === 'CAP') safeForm = 'CAPSULE';
        if (safeForm === 'SYP') safeForm = 'SYRUP';
        if (safeForm === 'INJ') safeForm = 'INJECTION';
        
        if (!validForms.includes(safeForm)) safeForm = 'OTHER';
        if (!validUnitTypes.includes(safeUnitType)) {
          // Intelligent fallback based on form
          if (['TABLET', 'CAPSULE'].includes(safeForm)) safeUnitType = 'STRIP';
          else if (['SYRUP', 'DROPS', 'SUSPENSION', 'LOTION'].includes(safeForm)) safeUnitType = 'BOTTLE';
          else if (['INJECTION'].includes(safeForm)) safeUnitType = 'VIAL';
          else if (['CREAM', 'OINTMENT', 'GEL'].includes(safeForm)) safeUnitType = 'TUBE';
          else safeUnitType = 'PIECE';
        }
        
        return { ...item, form: safeForm, unitType: safeUnitType };
      });
    }

    res.status(200).json({
      success: true,
      isMock: false,
      data: parsedData,
    });

  } catch (error) {
    console.error('Invoice parse error:', error);
    next(error);
  }
});

export default router;
