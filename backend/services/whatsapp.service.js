import MedicalStore from "../models/MedicalStore.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import StockAlert from "../models/StockAlert.js";
import mongoose from "mongoose";
import { WhatsappService } from "../modules/whatsapp/services/whatsapp.service.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import fs from "fs";
import path from "path";

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
  async sendMessage(medicalStoreId, recipientName, recipientPhone, messageType, content, mediaOptions = null) {
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

      // Check if store's WhatsApp session is active/connected
      const isConnected = await WhatsappService.isConnected(medicalStoreId);

      if (isConnected) {
        try {
          if (mediaOptions && mediaOptions.fileBuffer) {
            await WhatsappService.sendDocument(
              medicalStoreId,
              formattedPhone,
              mediaOptions.fileBuffer,
              mediaOptions.fileName,
              content
            );
          } else {
            await WhatsappService.sendMessage(medicalStoreId, formattedPhone, content);
          }
          status = "SENT";
        } catch (err) {
          status = "FAILED";
          errorMessage = err.message || "Failed to dispatch via WhatsApp client";
        }
      } else if (isEnabled && config.apiKey) {
        // Fallback or legacy Meta/Twilio HTTP Gateway if credentials are set manually
        try {
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
      if (!store || !store.whatsappConfig?.dailyReportEnabled) {
        return { success: false, reason: "WhatsApp daily report not enabled" };
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
      const recipientPhone = store.whatsappConfig.businessPhone || store.phone;

      if (!recipientPhone) {
        return { success: false, reason: "No recipient phone number available" };
      }

      return await this.sendMessage(medicalStoreId, recipientName, recipientPhone, "DAILY_REPORT", content);
    } catch (error) {
      console.error("Failed to generate and send daily report:", error);
      throw error;
    }
  }

  /**
   * Send Purchase Thank You to Customer
   */
  async sendPurchaseReceipt(saleId, retries = 3) {
    try {
      let sale = null;
      for (let i = 0; i < retries; i++) {
        sale = await Sale.findById(saleId);
        if (sale) break;
        // Wait 500ms before retrying to allow transaction commit to fully propagate
        await new Promise(res => setTimeout(res, 500));
      }
      if (!sale) throw new Error("Sale bill not found after retries");

      const store = await MedicalStore.findById(sale.medicalStoreId);
      if (!store || !sale.customerPhone) {
        return { success: false, reason: "Store not found or no customer phone number" };
      }

      const config = store.whatsappConfig || {};
      if (!config.isEnabled && !config.connected) {
        return { success: false, reason: "WhatsApp is not enabled or connected for this store" };
      }

      // Fetch items in the bill
      const items = await SaleItem.find({ saleId });
      if (!items || items.length === 0) return { success: false, reason: "No items in sale" };

      let itemsText = "";
      items.forEach(item => {
        itemsText += `- ${item.medicineName} x ${item.quantity} ${item.medicineForm || "units"}\n`;
      });

      // Calculate visit count based on database records
      let visitCount = 1;
      if (sale.customerPhone) {
        visitCount = await Sale.countDocuments({
          medicalStoreId: sale.medicalStoreId,
          customerPhone: sale.customerPhone,
          status: { $ne: "VOID" }
        });
      }

      const getOrdinal = (num) => {
        const lastDigit = num % 10;
        const lastTwoDigits = num % 100;
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
          return `${num}ᵗʰ`;
        }
        switch (lastDigit) {
          case 1: return `${num}ˢᵗ`;
          case 2: return `${num}ⁿᵈ`;
          case 3: return `${num}ʳᵈ`;
          default: return `${num}ᵗʰ`;
        }
      };

      const customerName = sale.customerName || "Customer";
      const storeName = store.name;
      let content = "";

      if (visitCount === 1) {
        content = 
`Dear ${customerName},

Welcome to ${storeName}! 🌸

Thank you for trusting us with your healthcare needs. We're delighted to serve you.

📎 Your invoice is attached with this message.

नमस्कार ${customerName} जी,

${storeName} में आपका हार्दिक स्वागत है। पहली बार हम पर विश्वास करने के लिए आपका धन्यवाद।

📎 आपका बिल (Invoice) इस संदेश के साथ संलग्न है।

आपके उत्तम स्वास्थ्य की शुभकामनाएँ।

— Team ${storeName}
💚 Your Health, Our Priority.
💚 आपकी सेहत, हमारी प्राथमिकता।`;
      } else if (visitCount === 2) {
        content = 
`Dear ${customerName},

Thank you for visiting ${storeName} again. Your continued trust means a lot to us.

📎 Your invoice is attached.

नमस्कार ${customerName} जी,

एक बार फिर ${storeName} आने और हम पर अपना विश्वास बनाए रखने के लिए आपका हार्दिक धन्यवाद। 🙏

📎 आपका बिल (Invoice) इस संदेश के साथ संलग्न है।

हमेशा स्वस्थ रहें, यही हमारी शुभकामना है।

— Team ${storeName}
💚 Caring Beyond Medicines.
💚 दवाइयों से आगे, आपकी देखभाल।`;
      } else if (visitCount === 3 || visitCount === 4) {
        content = 
`Dear ${customerName},

Thank you for choosing ${storeName} once again. We're grateful to be a part of your healthcare journey.

📎 Your invoice is attached.

नमस्कार ${customerName} जी,

बार-बार ${storeName} को चुनने के लिए आपका दिल से धन्यवाद। आपका विश्वास हमें बेहतर सेवा देने की प्रेरणा देता है।

📎 आपका बिल (Invoice) इस संदेश के साथ संलग्न है।

आपका भरोसा हमारे लिए सबसे बड़ा सम्मान है।

— Team ${storeName}
💚 Trusted Care. Genuine Medicines.
💚 भरोसेमंद सेवा। असली दवाइयाँ।`;
      } else {
        const visitCountStr = getOrdinal(visitCount);
        content = 
`Dear ${customerName},

This is your ${visitCountStr} visit to ${storeName}. Thank you for your continued trust—we're honored to serve you.

📎 Your invoice is attached.

नमस्कार ${customerName} जी,

आज आपकी ${visitCount}वीं यात्रा ${storeName} में है। बार-बार हम पर विश्वास करने के लिए आपका हृदय से धन्यवाद। ❤️

📎 आपका बिल (Invoice) इस संदेश के साथ संलग्न है।

आपका विश्वास ही हमारी सबसे बड़ी पूंजी है।

— Team ${storeName}
💚 Together for Better Health.
💚 बेहतर स्वास्थ्य की ओर, साथ मिलकर।`;
      }

      let tempPdfPath = null;
      try {
        const tempPdfDir = path.join(process.cwd(), "temp_invoices");
        if (!fs.existsSync(tempPdfDir)) {
          fs.mkdirSync(tempPdfDir, { recursive: true });
        }
        tempPdfPath = path.join(tempPdfDir, `Invoice_${sale.billNumber}_${Date.now()}.pdf`);
        await generateInvoicePDF(sale, store, items, tempPdfPath);
        
        const pdfBuffer = fs.readFileSync(tempPdfPath);
        const mediaOptions = {
          fileBuffer: pdfBuffer,
          fileName: `Invoice_${sale.billNumber}.pdf`
        };

        return await this.sendMessage(
          sale.medicalStoreId,
          customerName,
          sale.customerPhone,
          "PURCHASE_RECEIPT",
          content,
          mediaOptions
        );
      } finally {
        if (tempPdfPath && fs.existsSync(tempPdfPath)) {
          try {
            fs.unlinkSync(tempPdfPath);
          } catch (err) {
            console.error("Failed to delete temp invoice PDF:", err);
          }
        }
      }
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
