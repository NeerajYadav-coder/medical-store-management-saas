import whatsappService from "../services/whatsapp.service.js";
import MedicalStore from "../models/MedicalStore.js";

// Keep track of the last run day to prevent multiple executions within the same hour window
let lastDailyReportRunDay = -1;
let lastRefillReminderRunDay = -1;

const checkAndRunTasks = async () => {
  try {
    const now = new Date();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // At 16:53 (4:53 PM) for testing, or 21:00 (9:00 PM) for production daily reports
    const isTestTime = (currentHour === 16 && currentMinute === 53);
    const isProdTime = (currentHour === 21 && currentMinute === 0);

    if ((isTestTime || isProdTime) && lastDailyReportRunDay !== currentDay) {
      console.log(`[Scheduler] Triggered daily WhatsApp reports job at ${now.toLocaleTimeString()}`);
      const stores = await MedicalStore.find({ isActive: true });
      console.log(`[Scheduler] Found ${stores.length} active stores`);
      for (const store of stores) {
        console.log(`[Scheduler] Store: ${store.name}, dailyReportEnabled: ${store.whatsappConfig?.dailyReportEnabled}`);
        if (store.whatsappConfig?.dailyReportEnabled) {
          try {
            await whatsappService.sendDailyReport(store._id);
            console.log(`[Scheduler] Sent daily report successfully for ${store.name}`);
          } catch (err) {
            console.error(`Failed to send daily report for store ${store.name}:`, err);
          }
        }
      }
      lastDailyReportRunDay = currentDay;
    }

    // At 10:00 (10:00 AM), trigger refill reminders
    if (currentHour === 10 && lastRefillReminderRunDay !== currentDay) {
      console.log("[Scheduler] Running daily refill reminders job...");
      try {
        await whatsappService.sendRefillReminders();
      } catch (err) {
        console.error("Failed to run scheduled refill reminders:", err);
      }
      lastRefillReminderRunDay = currentDay;
    }
  } catch (error) {
    console.error("[Scheduler Error]:", error);
  }
};

export const startScheduler = () => {
  console.log("[Scheduler] Initializing lightweight task scheduler...");
  
  // Run checks immediately, and check every 15 seconds (15000 ms) for precision
  checkAndRunTasks();
  setInterval(checkAndRunTasks, 15 * 1000); 
};
