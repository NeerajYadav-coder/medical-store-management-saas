import MedicalStore from "../models/MedicalStore.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import StockAlert from "../models/StockAlert.js";
import mongoose from "mongoose";

class WhatsAppService {
  /**
   * Helper to format Indian phone numbers to international WhatsApp format (e.g. +91XXXXXXXXXX)
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      return `+91${clean}`;
    }
    if (clean.length === 12 && clean.startsWith("91")) {
      return `+${clean}`;
    }
    return `+${clean}`;
  }

  /**
   * Parse dosage string (e.g., "1-0-1", "1-1-1", "once daily") to estimate daily quantity
   */
  parseDosage(dosageStr) {
    if (!dosageStr) return 1; // Default to 1 tablet/day if not specified
    
    const clean = dosageStr.toLowerCase().trim();
    
    // Check patterns like 1-0-1, 1-1-1, etc.
    const patternMatch = clean.match(/^([0-9\.]+)-([0-9\.]+)-([0-9\.]+)$/);
    if (patternMatch) {
      const morning = parseFloat(patternMatch[1]) || 0;
      const afternoon = parseFloat(patternMatch[2]) || 0;
      const evening = parseFloat(patternMatch[3]) || 0;
      return morning + afternoon + evening;
    }
    
    // Check patterns like 1-0-1-1
    const patternMatch4 = clean.match(/^([0-9\.]+)-([0-9\.]+)-([0-9\.]+)-([0-9\.]+)$/);
    if (patternMatch4) {
      const morning = parseFloat(patternMatch4[1]) || 0;
      const afternoon = parseFloat(patternMatch4[2]) || 0;
      const evening = parseFloat(patternMatch4[3]) || 0;
      const night = parseFloat(patternMatch4[4]) || 0;
      return morning + afternoon + evening + night;
    }

    if (clean.includes("once") || clean.includes("daily") || clean.includes("od")) {
      return 1;
    }
    if (clean.includes("twice") || clean.includes("bid") || clean.includes("bd")) {
      return 2;
    }
    if (clean.includes("thrice") || clean.includes("tid") || clean.includes("td")) {
      return 3;
    }
    if (clean.includes("four") || clean.includes("qd")) {
      return 4;
    }

    // Try extracting first number
    const numMatch = clean.match(/(\d+)/);
    if (numMatch) {
      return parseInt(numMatch[0]) || 1;
    }

    return 1;
  }

  /**
   * Core Send/Simulate function
   */
  async sendMessage(medicalStoreId, recipientName, recipientPhone, messageType, content) {
    try {
      const store = await MedicalStore.findById(medicalStoreId);
      if (!store) {
        throw new Error("Medical store not found");
      }

      const config = store.whatsappConfig || {};
      const isEnabled = config.isEnabled;
      const formattedPhone = this.formatPhoneNumber(recipientPhone);

      if (!formattedPhone) {
        throw new Error("Invalid recipient phone number");
      }

      let status = "SIMULATED";
      let errorMessage = null;

      // If configuration is enabled and has keys, we trigger a real fetch call
      if (isEnabled && config.apiKey) {
        try {
          // Standard post request to WhatsApp Gateway (such as Twilio, Meta Cloud API, or a Webhook URL)
          const response = await fetch("https://api.whatsapp.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: formattedPhone,
              type: "text",
              text: { body: content }
            })
          });

          if (response.ok) {
            status = "SENT";
          } else {
            const errBody = await response.text();
            status = "FAILED";
            errorMessage = `Gateway Error: ${response.status} - ${errBody}`;
          }
        } catch (err) {
          status = "FAILED";
          errorMessage = err.message || "Network error sending to WhatsApp API";
        }
      }

      // Log the message in the database for tracking & history
      const loggedMessage = await WhatsAppMessage.create({
        medicalStoreId,
        recipientName,
        recipientPhone: formattedPhone,
        messageType,
        content,
        status,
        errorMessage,
        sentAt: new Date()
      });

      console.log(`[WhatsApp ${status}] Sent to ${recipientName} (${formattedPhone}): ${content.slice(0, 50)}...`);
      return loggedMessage;
    } catch (error) {
      console.error("WhatsApp Message Dispatch Error:", error);
      throw error;
    }
  }

  /**
   * Send Daily Stats Report to the Owner
   */
  async sendDailyReport(medicalStoreId) {
    try {
      const store = await MedicalStore.findById(medicalStoreId);
      if (!store || !store.whatsappConfig?.dailyReportEnabled || !store.whatsappConfig?.phoneNumber) {
        return { success: false, reason: "WhatsApp daily report not enabled or phone missing" };
      }

      const today = new Date();
      // Fetch daily sales summary
      const summary = await Sale.getDailySummary(medicalStoreId, today);
      
      // Fetch alerts (Low Stock, Expiries)
      const lowStockCount = await StockAlert.countDocuments({
        medicalStoreId,
        type: "LOW_STOCK",
        isResolved: false
      });
      const expiringCount = await StockAlert.countDocuments({
        medicalStoreId,
        type: "EXPIRY",
        isResolved: false
      });

      // Active staff members
      const activeStaff = await User.countDocuments({
        medicalStoreId,
        role: "STAFF",
        isActive: true
      });

      const formattedDate = today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      // Format report content
      const content = 
`📊 *${store.name} - Daily Report (${formattedDate})*

🧾 *Total Bills:* ${summary.totalBills} transactions
💰 *Gross Sales:* ₹${summary.totalRevenue.toLocaleString("en-IN")}
📈 *Net Profit:* ₹${summary.netProfit.toLocaleString("en-IN")}
💸 *Discounts Offered:* ₹${summary.totalDiscount.toLocaleString("en-IN")}

💳 *Payment Breakdown:*
- Cash: ₹${summary.cashSales.toLocaleString("en-IN")}
- UPI: ₹${summary.upiSales.toLocaleString("en-IN")}
- Card: ₹${summary.cardSales.toLocaleString("en-IN")}
- Credit: ₹${summary.creditSales.toLocaleString("en-IN")}

⚠️ *Inventory Alerts:*
- Low Stock Items: ${lowStockCount}
- Expiring Soon: ${expiringCount}

👥 *Active Staff Count:* ${activeStaff} active staff members

_Generated automatically by Medical Store SaaS_`;

      const recipientName = store.ownerName || "Store Owner";
      const recipientPhone = store.whatsappConfig.phoneNumber;

      return await this.sendMessage(medicalStoreId, recipientName, recipientPhone, "DAILY_REPORT", content);
    } catch (error) {
      console.error("Failed to generate and send daily report:", error);
      throw error;
    }
  }

  /**
   * Send Purchase Thank You to Customer
   */
  async sendPurchaseReceipt(saleId) {
    try {
      const sale = await Sale.findById(saleId);
      if (!sale) throw new Error("Sale bill not found");

      const store = await MedicalStore.findById(sale.medicalStoreId);
      if (!store || !store.whatsappConfig?.thankYouEnabled || !sale.customerPhone) {
        return { success: false, reason: "Thank you message not enabled or no customer phone number" };
      }

      // Fetch items in the bill
      const items = await SaleItem.find({ saleId });
      if (!items || items.length === 0) return { success: false, reason: "No items in sale" };

      let itemsText = "";
      items.forEach(item => {
        itemsText += `- ${item.medicineName} x ${item.quantity} ${item.medicineForm || "units"}\n`;
      });

      const content = 
`🙏 *Thank you for your purchase at ${store.name}!*

🧾 *Bill Number:* #${sale.billNumber}
💵 *Amount Paid:* ₹${sale.grandTotal.toLocaleString("en-IN")}
💳 *Payment Mode:* ${sale.paymentMode}

💊 *Medicines Purchased:*
${itemsText}
We wish you a speedy recovery! Let us know if you need any refills or medicines in the future.

📞 *Contact Store:* ${store.phone}
📍 *Address:* ${store.address}`;

      return await this.sendMessage(
        sale.medicalStoreId,
        sale.customerName || "Customer",
        sale.customerPhone,
        "PURCHASE_RECEIPT",
        content
      );
    } catch (error) {
      console.error("Failed to send purchase thank you message:", error);
      throw error;
    }
  }

  /**
   * Process & Send Refill Reminders for All Active Stores
   */
  async sendRefillReminders(medicalStoreId = null) {
    try {
      const today = new Date();
      const query = { isActive: true };
      
      // If store ID is provided, filter specifically for it
      if (medicalStoreId) {
        query._id = medicalStoreId;
      }

      const activeStores = await MedicalStore.find(query);
      let sentCount = 0;

      for (const store of activeStores) {
        const config = store.whatsappConfig || {};
        if (!config.refillReminderEnabled) continue;

        const bufferDays = config.refillBufferDays || 2;

        // Fetch completed sale items from the last 90 days that have not been reminded yet
        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() - 90);

        const items = await SaleItem.find({
          medicalStoreId: store._id,
          createdAt: { $gte: cutoffDate },
          refillReminderSent: { $ne: true }
        }).populate("saleId");

        for (const item of items) {
          // If the sale is voided, skip
          if (!item.saleId || item.saleId.status === "VOID" || !item.saleId.customerPhone) {
            continue;
          }

          // Estimate usage
          const quantity = item.quantity || 0;
          const dosagePerDay = this.parseDosage(item.medicineDosage);
          const daysSupply = Math.ceil(quantity / dosagePerDay);

          // Calculate estimated end date
          const saleDate = new Date(item.createdAt);
          const refillReminderDate = new Date(saleDate);
          refillReminderDate.setDate(saleDate.getDate() + (daysSupply - bufferDays));

          // Check if reminder date is equal or past today, and we haven't sent it yet
          if (refillReminderDate <= today) {
            const customerName = item.saleId.customerName || "Customer";
            const customerPhone = item.saleId.customerPhone;
            const medicineName = item.medicineName;

            const content = 
`🔔 *Refill Reminder from ${store.name}*

Hi ${customerName},
It has been ${daysSupply} days since you purchased *${medicineName}*. Based on your dosage, your supply is likely running low in the next ${bufferDays} days.

Would you like us to prepare a refill for you? Reply to this message or call us at ${store.phone} to keep your medication schedule uninterrupted.

Wishing you good health!`;

            try {
              await this.sendMessage(store._id, customerName, customerPhone, "REFILL_REMINDER", content);
              
              // Mark the sale item as reminded
              item.refillReminderSent = true;
              await item.save();
              sentCount++;
            } catch (err) {
              console.error(`Failed to send refill reminder to customer ${customerName} for ${medicineName}:`, err);
            }
          }
        }
      }

      return { success: true, remindersSent: sentCount };
    } catch (error) {
      console.error("Failed to run refill reminders job:", error);
      throw error;
    }
  }
}

export default new WhatsAppService();
