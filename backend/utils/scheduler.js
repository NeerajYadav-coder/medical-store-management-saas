import whatsappService from "../services/whatsapp.service.js";
import MedicalStore from "../models/MedicalStore.js";
import cron from 'node-cron';

export const startScheduler = () => {
  console.log("[Scheduler] Initializing lightweight task scheduler via cron...");
  
  // 9:00 PM (21:00) - Daily Reports
  cron.schedule('0 21 * * *', async () => {
    console.log(`[Scheduler] Triggered daily WhatsApp reports job at ${new Date().toLocaleTimeString()}`);
    try {
      const stores = await MedicalStore.find({ isActive: true });
      console.log(`[Scheduler] Found ${stores.length} active stores`);
      for (const store of stores) {
        if (store.whatsappConfig?.dailyReportEnabled) {
          try {
            await whatsappService.sendDailyReport(store._id);
            console.log(`[Scheduler] Sent daily report successfully for ${store.name}`);
          } catch (err) {
            console.error(`Failed to send daily report for store ${store.name}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("[Scheduler Error]:", err);
    }
  });

  // 10:00 AM - Refill Reminders
  cron.schedule('0 10 * * *', async () => {
    console.log("[Scheduler] Running daily refill reminders job...");
    try {
      await whatsappService.sendRefillReminders();
    } catch (err) {
      console.error("Failed to run scheduled refill reminders:", err);
    }
  });
};
