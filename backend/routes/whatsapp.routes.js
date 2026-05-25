import express from "express";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import whatsappService from "../services/whatsapp.service.js";
import Customer from "../models/Customer.js";
import { protect } from "../middleware/auth.middleware.js";
import { ownerOnly } from "../middleware/role.middleware.js";
import { auditAction } from "../middleware/audit.middleware.js";

const router = express.Router();

// Require auth for all whatsapp operations
router.use(protect);

/**
 * GET /api/v1/whatsapp/logs
 * List logged WhatsApp messages with pagination
 */
router.get("/logs", async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, messageType } = req.query;
    
    const query = { 
      medicalStoreId: req.user.medicalStoreId 
    };

    if (status) {
      query.status = status;
    }

    if (messageType) {
      query.messageType = messageType;
    }

    const logs = await WhatsAppMessage.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await WhatsAppMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/whatsapp/test-daily-report
 * Trigger manual test of the daily report
 */
router.post("/test-daily-report", ownerOnly, async (req, res, next) => {
  try {
    const result = await whatsappService.sendDailyReport(req.user.medicalStoreId);
    
    if (result && result.status === "FAILED") {
      return res.status(500).json({
        success: false,
        message: "Failed to send test daily report",
        error: result.errorMessage
      });
    }

    res.status(200).json({
      success: true,
      message: "Test daily report sent successfully via WhatsApp",
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/whatsapp/test-refill-reminders
 * Trigger manual check/run for refill reminders
 */
router.post("/test-refill-reminders", async (req, res, next) => {
  try {
    const result = await whatsappService.sendRefillReminders(req.user.medicalStoreId);
    res.status(200).json({
      success: true,
      message: `Refill reminders job run completed. Reminders sent: ${result.remindersSent}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/whatsapp/promotions
 * Send promotional text to customer cohort
 */
router.post("/promotions", ownerOnly, auditAction("CREATE", "PROMOTION"), async (req, res, next) => {
  try {
    const { cohort, messageText } = req.body;
    
    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    const query = { 
      medicalStoreId: req.user.medicalStoreId,
      isActive: true,
      phone: { $exists: true, $ne: "" }
    };

    if (cohort === "VIP") {
      query.loyaltyCategory = "VIP";
    } else if (cohort === "REPEAT") {
      query.isRepeatBuyer = true;
    }

    const customers = await Customer.find(query);
    
    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No customers match the selected cohort filter"
      });
    }

    let sentCount = 0;
    for (const customer of customers) {
      try {
        await whatsappService.sendMessage(
          req.user.medicalStoreId,
          customer.name || "Customer",
          customer.phone,
          "PROMOTION",
          messageText
        );
        sentCount++;
      } catch (err) {
        console.error(`Failed to send promotional message to ${customer.name}:`, err);
      }
    }

    res.status(200).json({
      success: true,
      message: `Promotional campaign completed successfully. Messages sent: ${sentCount}`,
      sentCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;
