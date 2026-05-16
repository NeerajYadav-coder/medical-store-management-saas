/**
 * routes/doctor.routes.js
 * Doctor routes for prescription tracking
 */

import express from 'express';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all doctors for the store
router.get('/', async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ 
      medicalStoreId: req.user.medicalStoreId,
      isActive: true 
    }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

// Search doctors
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q, 'i');
    
    const doctors = await Doctor.find({
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
      $or: [
        { name: regex },
        { phone: regex },
        { specialization: regex },
      ],
    })
      .sort({ totalPrescriptions: -1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

// Get top doctors by revenue
router.get('/top', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const doctors = await Doctor.getTopDoctors(req.user.medicalStoreId, limit);
    
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

// Get doctor by ID
router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

// Create doctor
router.post('/', async (req, res, next) => {
  try {
    const doctor = await Doctor.create({
      ...req.body,
      medicalStoreId: req.user.medicalStoreId,
    });
    
    res.status(201).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

// Update doctor
router.put('/:id', async (req, res, next) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

// Delete doctor
router.delete('/:id', async (req, res, next) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, medicalStoreId: req.user.medicalStoreId },
      { isActive: false },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Doctor deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
