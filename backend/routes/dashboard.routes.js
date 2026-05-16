import express from "express";
import { getDashboardSnapshot } from "../controllers/dashboard.controller.js";
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
import { ownerOrStaff } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/**
 * OWNER only
 * Get dashboard snapshot (sales, profit, top medicines, alerts)
 */
router.get(
  "/",
  protect,
  ownerOrStaff,
  getDashboardSnapshot
);

export default router;
