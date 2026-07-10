import { WhatsappService } from "../services/whatsapp.service.js";
import { registerClient, unregisterClient } from "../utils/sse.js";
import MedicalStore from "../../../models/MedicalStore.js";
import WhatsAppMessage from "../../../models/WhatsAppMessage.js";

/**
 * GET /status
 */
export const getStatus = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const store = await MedicalStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const status = await WhatsappService.getStatus(storeId);
    const config = store.whatsappConfig || {};

    res.status(200).json({
      success: true,
      data: {
        connected: status.connected,
        businessName: status.displayName || config.businessName || "",
        businessPhone: status.phoneNumber || config.businessPhone || "",
        connectedAt: status.connectedAt || config.connectedAt || null,
        connectionStatus: status.connected ? "CONNECTED" : "DISCONNECTED",
        dailyReportEnabled: config.dailyReportEnabled !== undefined ? config.dailyReportEnabled : false,
        thankYouEnabled: config.thankYouEnabled !== undefined ? config.thankYouEnabled : false,
        refillReminderEnabled: config.refillReminderEnabled !== undefined ? config.refillReminderEnabled : false,
        promotionsEnabled: config.promotionsEnabled !== undefined ? config.promotionsEnabled : false,
        lowStockEnabled: config.lowStockEnabled !== undefined ? config.lowStockEnabled : false,
        expiryEnabled: config.expiryEnabled !== undefined ? config.expiryEnabled : false,
        refillBufferDays: config.refillBufferDays || 2,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /connect
 */
export const connectStore = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    
    // Asynchronously connect so client doesn't time out
    WhatsappService.connectStore(storeId).catch((err) => {
      console.error(`[Controller] Connection runner failed for store ${storeId}:`, err);
    });

    res.status(200).json({
      success: true,
      message: "WhatsApp connection sequence initialized."
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /qr
 */
export const getQR = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const qr = WhatsappService.getQR(storeId);
    res.status(200).json({
      success: true,
      qr: qr || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /disconnect
 */
export const disconnectStore = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    await WhatsappService.disconnectStore(storeId);
    res.status(200).json({
      success: true,
      message: "WhatsApp disconnected successfully."
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reconnect
 */
export const reconnectStore = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    
    WhatsappService.reconnectStore(storeId).catch((err) => {
      console.error(`[Controller] Reconnection runner failed for store ${storeId}:`, err);
    });

    res.status(200).json({
      success: true,
      message: "WhatsApp reconnection sequence initialized."
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /send
 */
export const sendManualMessage = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
      return res.status(400).json({ success: false, message: "PhoneNumber and message are required" });
    }

    await WhatsappService.sendMessage(storeId, phoneNumber, message);
    
    // Log manual messages to WhatsAppMessage collection
    await WhatsAppMessage.create({
      medicalStoreId: storeId,
      recipientName: "Customer / Manual",
      recipientPhone: phoneNumber,
      messageType: "PROMOTION",
      content: message,
      status: "SENT",
      sentAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /health
 */
export const getHealth = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const status = await WhatsappService.getStatus(storeId);
    res.status(200).json({
      success: true,
      data: {
        activeSession: status.connected,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const { dailyReportEnabled, thankYouEnabled, refillReminderEnabled, promotionsEnabled, lowStockEnabled, expiryEnabled, refillBufferDays } = req.body;

    const store = await MedicalStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    store.whatsappConfig = {
      ...store.whatsappConfig,
      dailyReportEnabled: dailyReportEnabled !== undefined ? dailyReportEnabled : store.whatsappConfig.dailyReportEnabled,
      thankYouEnabled: thankYouEnabled !== undefined ? thankYouEnabled : store.whatsappConfig.thankYouEnabled,
      refillReminderEnabled: refillReminderEnabled !== undefined ? refillReminderEnabled : store.whatsappConfig.refillReminderEnabled,
      promotionsEnabled: promotionsEnabled !== undefined ? promotionsEnabled : store.whatsappConfig.promotionsEnabled,
      lowStockEnabled: lowStockEnabled !== undefined ? lowStockEnabled : store.whatsappConfig.lowStockEnabled,
      expiryEnabled: expiryEnabled !== undefined ? expiryEnabled : store.whatsappConfig.expiryEnabled,
      refillBufferDays: refillBufferDays !== undefined ? refillBufferDays : store.whatsappConfig.refillBufferDays,
    };

    await store.save();

    res.status(200).json({
      success: true,
      message: "WhatsApp preferences updated successfully",
      data: {
        dailyReportEnabled: store.whatsappConfig.dailyReportEnabled,
        thankYouEnabled: store.whatsappConfig.thankYouEnabled,
        refillReminderEnabled: store.whatsappConfig.refillReminderEnabled,
        promotionsEnabled: store.whatsappConfig.promotionsEnabled,
        lowStockEnabled: store.whatsappConfig.lowStockEnabled,
        expiryEnabled: store.whatsappConfig.expiryEnabled,
        refillBufferDays: store.whatsappConfig.refillBufferDays,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /logs
 */
export const getLogs = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const limit = parseInt(req.query.limit) || 10;
    const logs = await WhatsAppMessage.find({ medicalStoreId: storeId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /status-sse
 */
export const getStatusSse = async (req, res) => {
  const storeId = req.user.medicalStoreId.toString();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  registerClient(storeId, res);

  // Connection ACK ping
  res.write("event: ping\ndata: connected\n\n");

  // Send current connection status immediately so the UI does not wait
  try {
    const status = await WhatsappService.getStatus(req.user.medicalStoreId);
    let state = "Disconnected";
    if (status.connected) {
      state = status.status === "CONNECTED" ? "Connected" : "Connecting";
    }

    const payload = {
      state,
      phone: status.phoneNumber || "",
      name: status.displayName || "",
      connectedAt: status.connectedAt || null,
    };
    res.write(`event: status\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch (err) {
    console.error("[SSE] Failed to send initial status update:", err);
  }

  req.on("close", () => {
    unregisterClient(storeId, res);
  });
};

/**
 * POST /test-daily-report
 */
export const testDailyReport = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    // Import WhatsappService from backend top-level services
    const { default: TopLevelWhatsappService } = await import("../../../services/whatsapp.service.js");
    const result = await TopLevelWhatsappService.sendDailyReport(storeId);
    
    res.status(200).json({
      success: true,
      message: "Daily report tested",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /test-refill-reminders
 */
export const testRefillReminders = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const { default: TopLevelWhatsappService } = await import("../../../services/whatsapp.service.js");
    const result = await TopLevelWhatsappService.sendRefillReminders(storeId);
    
    res.status(200).json({
      success: true,
      message: "Refill reminders tested",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /promotions
 */
export const sendPromotionCampaign = async (req, res, next) => {
  try {
    const storeId = req.user.medicalStoreId;
    const { cohort, messageText } = req.body;
    
    if (!messageText) {
      return res.status(400).json({ success: false, message: "messageText is required" });
    }

    const Customer = (await import("../../../models/Customer.js")).default;
    const { default: TopLevelWhatsappService } = await import("../../../services/whatsapp.service.js");
    
    // Fetch customers based on cohort
    let query = { medicalStoreId: storeId, isActive: true, phone: { $exists: true, $ne: "" } };
    if (cohort === 'VIP') {
      query.loyaltyCategory = 'VIP';
    } else if (cohort === 'REPEAT') {
      query.isRepeatBuyer = true;
    } else if (cohort === 'DORMANT') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      query.lastVisitDate = { $lt: ninetyDaysAgo };
    }

    const customers = await Customer.find(query);
    
    let sentCount = 0;
    // For large campaigns, consider a queue. For now we will loop asynchronously
    // We shouldn't block the request if it takes too long, but we'll await them here for simplicity since cohort size might be small
    
    // Send in background to avoid blocking the HTTP response
    (async () => {
      for (const customer of customers) {
        try {
          if (customer.phone) {
            await TopLevelWhatsappService.sendMessage(storeId, customer.name || "Customer", customer.phone, "PROMOTION", messageText);
            sentCount++;
          }
        } catch (err) {
          console.error(`Failed to send promo to ${customer.name}:`, err.message);
        }
      }
    })();
    
    res.status(200).json({
      success: true,
      message: `Campaign started for ${customers.length} customers in cohort: ${cohort || 'ALL'}`,
    });
  } catch (error) {
    next(error);
  }
};
