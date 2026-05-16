/**
 * routes/symptom.routes.js
 * Symptom category routes
 */

import express from 'express';
import SymptomCategory from '../models/SymptomCategory.js';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';

const router = express.Router();

// Get all active symptoms (public for billing)
router.get('/', async (req, res, next) => {
  try {
    const symptoms = await SymptomCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      data: symptoms,
    });
  } catch (error) {
    next(error);
  }
});

// Get symptom by ID
router.get('/:id', async (req, res, next) => {
  try {
    const symptom = await SymptomCategory.findById(req.params.id);
    
    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom category not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
});

// Create symptom (owner only)
router.post('/', protect, ownerOnly, async (req, res, next) => {
  try {
    const symptom = await SymptomCategory.create(req.body);
    
    res.status(201).json({
      success: true,
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
});

// Update symptom
router.put('/:id', protect, ownerOnly, async (req, res, next) => {
  try {
    const symptom = await SymptomCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom category not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
});

// Delete symptom
router.delete('/:id', protect, ownerOnly, async (req, res, next) => {
  try {
    const symptom = await SymptomCategory.findByIdAndDelete(req.params.id);
    
    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom category not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Symptom category deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
