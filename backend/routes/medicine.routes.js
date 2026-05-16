/**
 * routes/medicine.routes.js
 * Medicine routes with symptom filtering and stock search
 */

import express from 'express';
import Medicine from '../models/Medicine.js';
import MedicineBatch from '../models/MedicineBatch.js';
import { protect } from '../middleware/auth.middleware.js';
import { hasPermission } from '../middleware/permission.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all medicines
router.get('/', async (req, res, next) => {
  try {
    const { therapeuticClass, page = 1, limit = 50 } = req.query;
    
    const query = { 
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
    };
    
    if (therapeuticClass) {
      query.therapeuticClass = therapeuticClass;
    }
    
    const medicines = await Medicine.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
});

// Search medicines
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    const medicines = await Medicine.searchMedicines(
      req.user.medicalStoreId,
      q,
      20
    );
    
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
});

// Search medicines with available stock (for billing)
router.get('/search-with-stock', async (req, res, next) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q, 'i');
    
    // First find matching medicines
    const medicines = await Medicine.find({
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
      $or: [
        { name: regex },
        { genericName: regex },
        { manufacturer: regex },
        { tags: regex },
      ],
    })
      .limit(10)
      .lean();
    
    // Then get available batches for each
    const results = [];
    
    for (const medicine of medicines) {
      const batches = await MedicineBatch.find({
        medicalStoreId: req.user.medicalStoreId,
        medicineId: medicine._id,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() },
        isActive: true,
      })
        .sort({ expiryDate: 1 })
        .limit(3)
        .lean();
      
      for (const batch of batches) {
        results.push({
          _id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          dosage: medicine.dosage,
          form: medicine.form,
          manufacturer: medicine.manufacturer,
          gstRate: medicine.gstRate,
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          mrp: batch.mrp,
          sellingPrice: batch.sellingPrice,
          purchasePrice: batch.purchasePrice,
          availableQty: batch.quantityRemaining,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Get top-selling medicines
router.get('/top-selling', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const medicines = await Medicine.getTopSelling(req.user.medicalStoreId, limit);
    
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
});

// Get medicines by symptom
router.get('/by-symptom/:symptomId', async (req, res, next) => {
  try {
    const medicines = await Medicine.getBySymptom(
      req.user.medicalStoreId,
      req.params.symptomId
    );
    
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
});

// Get low stock medicines
router.get('/low-stock', async (req, res, next) => {
  try {
    const medicines = await Medicine.aggregate([
      { $match: { medicalStoreId: req.user.medicalStoreId, isActive: true } },
      {
        $lookup: {
          from: 'medicinebatches',
          localField: '_id',
          foreignField: 'medicineId',
          as: 'batches',
        },
      },
      {
        $project: {
          name: 1,
          dosage: 1,
          form: 1,
          reorderLevel: 1,
          totalStock: { $sum: '$batches.quantityRemaining' },
        },
      },
      {
        $match: { $expr: { $lte: ['$totalStock', '$reorderLevel'] } },
      },
      { $sort: { totalStock: 1 } },
      { $limit: 50 },
    ]);
    
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
});

// Get near expiry medicines
router.get('/near-expiry', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const batches = await MedicineBatch.getNearExpiryBatches(
      req.user.medicalStoreId,
      days
    );
    
    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    next(error);
  }
});

// Get medicine by ID
router.get('/:id', async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
});

// Get available batches for a medicine
router.get('/:id/batches', async (req, res, next) => {
  try {
    const batches = await MedicineBatch.getAvailableBatches(
      req.user.medicalStoreId,
      req.params.id
    );
    
    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    next(error);
  }
});

// Create medicine
router.post('/', hasPermission(PERMISSIONS.MANAGE_INVENTORY), auditAction('CREATE', 'MEDICINE'), async (req, res, next) => {
  try {
    const medicine = await Medicine.create({
      ...req.body,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    res.status(201).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
});

// Update medicine
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_INVENTORY), auditAction('UPDATE', 'MEDICINE'), async (req, res, next) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
});

// Update medicine symptoms
router.patch('/:id/symptoms', hasPermission(PERMISSIONS.MANAGE_INVENTORY), auditAction('UPDATE', 'MEDICINE'), async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { 
        symptomCategories: symptoms.map(s => s.symptomId),
        symptomNames: symptoms.map(s => s.symptomName),
      },
      { new: true }
    );
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
});

// Delete medicine (soft delete)
router.delete('/:id', hasPermission(PERMISSIONS.MANAGE_INVENTORY), auditAction('DELETE', 'MEDICINE'), async (req, res, next) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { isActive: false },
      { new: true }
    );
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Medicine deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
