import cron from 'node-cron';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import StoreAnalytics from '../models/StoreAnalytics.js';
import MedicalStore from '../models/MedicalStore.js';

// Run every night at 1:00 AM
export const initAnalyticsCron = () => {
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Starting Nightly Analytics Rollup...');
    try {
      // Get yesterday's date bounds
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

      const stores = await MedicalStore.find({ isActive: true }).select('_id');

      for (const store of stores) {
        const storeId = store._id;
        
        // Compute daily summary
        const summary = await Sale.getDailySummary(storeId, startOfDay);

        // Upsert into StoreAnalytics
        await StoreAnalytics.findOneAndUpdate(
          {
            medicalStoreId: storeId,
            period: 'DAILY',
            date: startOfDay
          },
          {
            $set: {
              totalSales: summary.totalRevenue || 0,
              totalProfit: summary.netProfit || 0,
              totalBills: summary.totalBills || 0,
              cashSales: summary.cashSales || 0,
              upiSales: summary.upiSales || 0,
              cardSales: summary.cardSales || 0,
              creditSales: summary.creditSales || 0,
              prescribedCount: summary.prescribedCount || 0,
              repeatCustomerCount: summary.repeatCustomerCount || 0
            }
          },
          { upsert: true, new: true }
        );
      }
      console.log('[Cron] Nightly Analytics Rollup Completed Successfully.');
    } catch (error) {
      console.error('[Cron] Nightly Analytics Rollup Failed:', error);
    }
  });
};
