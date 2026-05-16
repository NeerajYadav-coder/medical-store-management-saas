import express from "express";
import {
  createBatch,
  getBatchesByMedicine,
  getAllBatches,
} from "../controllers/batch.controller.js";

import { protect } from '../middleware/auth.middleware.js';
// import { ownerOnly } from '../middleware/role.middleware.js';
import { ownerOrStaff } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/**
 * @route   POST /api/batches
 * @desc    Create a new medicine batch
 * @access  Private (OWNER, STAFF)
 */
router.post(
  "/",
  protect,
  ownerOrStaff,
  createBatch
);

/**
 * @route   GET /api/batches
 * @desc    Get all batches for logged-in store
 * @access  Private
 */
router.get(
  "/",
  protect,
  getAllBatches
);

/**
 * @route   GET /api/batches/medicine/:medicineId
 * @desc    Get batches for a specific medicine
 * @access  Private
 */
router.get(
  "/medicine/:medicineId",
  protect,
  getBatchesByMedicine
);

export default router;
