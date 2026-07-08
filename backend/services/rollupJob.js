import cron from 'node-cron';
import mongoose from 'mongoose';
import MedicalStore from '../models/MedicalStore.js';
import Medicine from '../models/Medicine.js';
import MedicineBatch from '../models/MedicineBatch.js';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import SalesVelocitySnapshot from '../models/SalesVelocitySnapshot.js';
import ReorderSuggestion from '../models/ReorderSuggestion.js';
import AuditLog from '../models/AuditLog.js';
import { forecastDemand } from './forecastEngine.js';

/**
 * Perform nightly rollup for a specific store and date.
 * If targetDate is not provided, defaults to yesterday.
 */
export async function runRollupForStore(storeId, targetDate = null) {
  const dateToProcess = targetDate ? new Date(targetDate) : new Date(Date.now() - 86400000);
  dateToProcess.setUTCHours(0, 0, 0, 0); // UTC midnight

  const nextDay = new Date(dateToProcess);
  nextDay.setDate(nextDay.getDate() + 1);

  const startTime = Date.now();
  let success = true;
  let errorMsg = '';

  try {
    // 1. Get all active medicines with sales in the last 90 days
    const ninetyDaysAgo = new Date(dateToProcess);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeSaleItems = await SaleItem.aggregate([
      {
        $match: {
          medicalStoreId: new mongoose.Types.ObjectId(storeId),
          createdAt: { $gte: ninetyDaysAgo, $lte: nextDay }
        }
      },
      {
        $group: {
          _id: '$medicineId'
        }
      }
    ]);

    const activeMedicineIds = activeSaleItems.map(item => item._id);

    // 2. Fetch stock totals and sales for the target day
    for (const medicineId of activeMedicineIds) {
      // Calculate units sold that day
      const dailySales = await SaleItem.aggregate([
        {
          $match: {
            medicalStoreId: new mongoose.Types.ObjectId(storeId),
            medicineId: new mongoose.Types.ObjectId(medicineId),
            createdAt: { $gte: dateToProcess, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$quantity' },
            totalReturned: { $sum: '$quantityReturned' }
          }
        }
      ]);

      const unitsSold = dailySales.length > 0 ? dailySales[0].totalSold : 0;
      const unitsReturned = dailySales.length > 0 ? dailySales[0].totalReturned : 0;

      // Calculate stock on hand
      const batches = await MedicineBatch.find({
        medicalStoreId: storeId,
        medicineId: medicineId,
        isActive: true
      });

      const stockOnHandEnd = batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
      const wasStockedOut = stockOnHandEnd === 0;

      // Upsert SalesVelocitySnapshot
      await SalesVelocitySnapshot.findOneAndUpdate(
        {
          medicalStoreId: storeId,
          medicineId: medicineId,
          date: dateToProcess
        },
        {
          $set: {
            unitsSold,
            unitsReturned,
            stockOnHandEnd,
            wasStockedOut
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    success = false;
    errorMsg = err.message;
    console.error(`Rollup error for store ${storeId}:`, err);
  } finally {
    // Log job duration and failures
    await AuditLog.create({
      medicalStoreId: storeId,
      action: 'NIGHTLY_ROLLUP',
      entity: 'ForecastEngine',
      details: {
        targetDate: dateToProcess,
        durationMs: Date.now() - startTime,
        success,
        error: errorMsg
      },
      performedBy: 'SYSTEM'
    }).catch(() => {}); // ignore audit log failure
  }
}

/**
 * Generate reorder suggestions for a specific store.
 * Reads the last 90 days of SalesVelocitySnapshot.
 */
export async function generateSuggestionsForStore(storeId) {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    // Get all snapshots for the last 90 days for this store
    const snapshots = await SalesVelocitySnapshot.find({
      medicalStoreId: storeId,
      date: { $gte: ninetyDaysAgo }
    }).sort({ date: 1 });

    // Group snapshots by medicineId
    const historyByMedicine = {};
    for (const snap of snapshots) {
      const mId = snap.medicineId.toString();
      if (!historyByMedicine[mId]) {
        historyByMedicine[mId] = [];
      }
      historyByMedicine[mId].push({
        date: snap.date,
        unitsSold: snap.unitsSold - snap.unitsReturned, // Net sales
        wasStockedOut: snap.wasStockedOut
      });
    }

    // Symptom-trend signal logic
    // Calculate symptom trend (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const symptomSales = await Sale.aggregate([
      {
        $match: {
          medicalStoreId: new mongoose.Types.ObjectId(storeId),
          billDate: { $gte: fourteenDaysAgo },
          status: { $ne: 'VOID' }
        }
      },
      { $unwind: '$symptoms' },
      {
        $group: {
          _id: {
            symptomName: '$symptoms.symptomName',
            period: {
              $cond: [{ $gte: ['$billDate', sevenDaysAgo] }, 'recent', 'older']
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const symptomTrend = {}; // symptomName -> multiplier (e.g. 1.2 for +20%)
    const counts = {};
    symptomSales.forEach(s => {
      const name = s._id.symptomName;
      const period = s._id.period;
      if (!counts[name]) counts[name] = { recent: 0, older: 0 };
      counts[name][period] = s.count;
    });

    for (const [name, countData] of Object.entries(counts)) {
      if (countData.older > 0) {
        const growth = (countData.recent - countData.older) / countData.older;
        if (growth > 0.2) { // 20% growth threshold
           symptomTrend[name] = 1 + Math.min(growth, 0.5); // Cap multiplier at 1.5
        }
      }
    }

    // Forecast settings (mocked/default if store settings not available)
    // Assume store has settings or use defaults
    const storeSettings = {
      forecastWindowDays: 14,
      safetyStockBufferPct: 20,
      symptomSignalEnabled: true
    };

    const medicines = await Medicine.find({ _id: { $in: Object.keys(historyByMedicine) }});
    const medicineMap = medicines.reduce((acc, med) => {
      acc[med._id.toString()] = med;
      return acc;
    }, {});

    for (const [medicineId, salesHistory] of Object.entries(historyByMedicine)) {
      const medicine = medicineMap[medicineId];
      if (!medicine) continue;

      let symptomMultiplier = 1;
      let trendingSymptom = null;
      if (storeSettings.symptomSignalEnabled && medicine.symptomNames && medicine.symptomNames.length > 0) {
         for (const sym of medicine.symptomNames) {
           if (symptomTrend[sym]) {
             symptomMultiplier = Math.max(symptomMultiplier, symptomTrend[sym]);
             trendingSymptom = sym;
           }
         }
      }

      const options = {
        windowDays: storeSettings.forecastWindowDays,
        seasonalityEnabled: false, // Skipping for now, add logic if 12m data available
        symptomSignalMultiplier: symptomMultiplier
      };

      const forecast = forecastDemand(salesHistory, options);

      if (forecast.confidence === 'low' && forecast.predictedDemand === 0) continue;

      // Current stock
      const batches = await MedicineBatch.find({ medicalStoreId: storeId, medicineId, isActive: true });
      const currentStock = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);

      const daysOfStockRemaining = forecast.avgDailyDemand > 0 ? Math.floor(currentStock / forecast.avgDailyDemand) : 999;
      
      const safetyStockBuffer = (storeSettings.safetyStockBufferPct / 100) * forecast.predictedDemand;
      let suggestedReorderQty = Math.max(0, forecast.predictedDemand - currentStock + safetyStockBuffer);

      // Round to pack size
      const unitsPerPack = medicine.totalUnitsPerBox || 1;
      if (suggestedReorderQty > 0) {
        suggestedReorderQty = Math.ceil(suggestedReorderQty / unitsPerPack) * unitsPerPack;
      }

      let urgency = 'low';
      if (daysOfStockRemaining <= 3) urgency = 'critical';
      else if (daysOfStockRemaining <= 7) urgency = 'high';
      else if (daysOfStockRemaining <= 14) urgency = 'medium';

      if (urgency === 'low' || suggestedReorderQty === 0) continue; // Skip informational

      // Reasoning
      let reasoning = `Sold ~${forecast.avgDailyDemand.toFixed(1)} units/day over the last 28 non-stockout days. `;
      if (forecast.trend !== 0) {
        const direction = forecast.trend > 0 ? 'up' : 'down';
        reasoning += `(Trend: ${direction} ${Math.abs(forecast.trend).toFixed(0)}% from prior period). `;
      }
      reasoning += `${daysOfStockRemaining} days of stock remaining at current pace. `;
      if (trendingSymptom && symptomMultiplier > 1) {
        const growthPct = Math.round((symptomMultiplier - 1) * 100);
        reasoning += `Symptom tag '${trendingSymptom}' is up ${growthPct}% recently - demand may be higher than base trend. `;
      }
      if (medicine.schedule && ['H', 'H1', 'X'].includes(medicine.schedule)) {
        reasoning += `[Restricted Schedule ${medicine.schedule} medicine - requires explicit authorization.]`;
      }

      await ReorderSuggestion.findOneAndUpdate(
        {
          medicalStoreId: storeId,
          medicineId: medicineId,
          status: 'pending' // Update existing pending suggestion if it exists
        },
        {
          $set: {
            generatedAt: new Date(),
            forecastWindowDays: storeSettings.forecastWindowDays,
            predictedDemand: forecast.predictedDemand,
            currentStock,
            suggestedReorderQty,
            daysOfStockRemaining,
            urgency,
            confidence: forecast.confidence,
            reasoning
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error(`Suggest generation error for store ${storeId}:`, err);
  }
}

/**
 * Main cron job runner
 */
export const startNightlyJob = () => {
  // Run daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Starting nightly forecasting job...');
    const stores = await MedicalStore.find({ isActive: true });
    
    for (const store of stores) {
      await runRollupForStore(store._id);
      await generateSuggestionsForStore(store._id);
    }
    console.log('Nightly forecasting job completed.');
  });
};
