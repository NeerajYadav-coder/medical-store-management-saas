import express from "express";
import {
  getMyStore,
  updateMyStore,
  upgradeStore,
  downgradeStore,
} from "../controllers/store.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { ownerOnly } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * STORE-SCOPED ROUTES
 */

// Get logged-in user's store (OWNER + STAFF)
router.get("/me", protect, getMyStore);

// Update store (OWNER ONLY)
router.put("/me", protect, ownerOnly, updateMyStore);

// Upgrade store (OWNER ONLY)
router.post("/me/upgrade", protect, ownerOnly, upgradeStore);

// Downgrade store (OWNER ONLY)
router.post("/me/downgrade", protect, ownerOnly, downgradeStore);

export default router;
