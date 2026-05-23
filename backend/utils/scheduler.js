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

    // At 21:00 (9:00 PM), trigger daily reports for all stores
    if (currentHour === 21 && lastDailyReportRunDay !== currentDay) {
      console.log("[Scheduler] Running daily WhatsApp reports job...");
      const stores = await MedicalStore.find({ isActive: true });
      for (const store of stores) {
        if (store.whatsappConfig?.dailyReportEnabled) {
          try {
            await whatsappService.sendDailyReport(store._id);
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
  
  // Run checks immediately, and check every 5 minutes (300000 ms) for precision
  checkAndRunTasks();
  setInterval(checkAndRunTasks, 5 * 60 * 1000); 
};
