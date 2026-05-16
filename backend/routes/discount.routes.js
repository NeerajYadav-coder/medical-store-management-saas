import express from "express";
import {
  createDiscountRule,
  getAllDiscountRules,
  getSingleDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
} from "../controllers/discount.controller.js";


import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
// import { createMedicine } from '../controllers/medicine.controller.js';
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/**
 * OWNER only
 * Create a new discount rule
 */
router.post(
  "/",
  protect,
  ownerOnly,
  createDiscountRule
);

/**
 * Any authenticated user
 * Get all discount rules for the store
 */
router.get("/", protect, getAllDiscountRules);

/**
 * Any authenticated user
 * Get single discount rule by ID
 */
router.get("/:id", protect, getSingleDiscountRule);

/**
 * OWNER only
 * Update discount rule
 */
router.put(
  "/:id",
  protect,
  ownerOnly,
  updateDiscountRule
);

/**
 * OWNER only
 * Delete discount rule
 */
router.delete(
  "/:id",
  protect,
  ownerOnly,
  deleteDiscountRule
);

export default router;
