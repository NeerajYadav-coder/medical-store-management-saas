import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { ownerOnly, allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import {
  getStatus,
  connectStore,
  getQR,
  disconnectStore,
  reconnectStore,
  sendManualMessage,
  getHealth,
  updateSettings,
  getLogs,
  getStatusSse,
  testDailyReport,
  testRefillReminders,
  sendPromotionCampaign
} from "../modules/whatsapp/controllers/whatsapp.controller.js";

const router = express.Router();

// Require auth for all WhatsApp operations
router.use(protect);

/**
 * Middleware to restrict access from STAFF role entirely.
 * Permits OWNER or MANAGER roles.
 */
const managerOrOwnerOnly = (req, res, next) => {
  if (req.user && req.user.role === ROLES.STAFF) {
    return res.status(403).json({
      success: false,
      message: "Staff users are not permitted to access WhatsApp Integration."
    });
  }
  next();
};

// GET /status (Owner/Manager only)
router.get("/status", managerOrOwnerOnly, getStatus);

// GET /status-sse (Real-time update channel)
router.get("/status-sse", managerOrOwnerOnly, getStatusSse);

// GET /logs
router.get("/logs", managerOrOwnerOnly, getLogs);

// GET /health
router.get("/health", managerOrOwnerOnly, getHealth);

// POST /connect (Owner only)
router.post("/connect", ownerOnly, connectStore);

// GET /qr (Owner only)
router.get("/qr", ownerOnly, getQR);

// POST /disconnect (Owner only)
router.post("/disconnect", ownerOnly, disconnectStore);

// POST /reconnect (Owner only)
router.post("/reconnect", ownerOnly, reconnectStore);

// POST /send
router.post("/send", managerOrOwnerOnly, sendManualMessage);

// POST /settings (Owner only)
router.post("/settings", ownerOnly, updateSettings);

// POST /test-daily-report
router.post("/test-daily-report", ownerOnly, testDailyReport);

// POST /test-refill-reminders
router.post("/test-refill-reminders", ownerOnly, testRefillReminders);

// POST /promotions
router.post("/promotions", ownerOnly, sendPromotionCampaign);

export default router;
