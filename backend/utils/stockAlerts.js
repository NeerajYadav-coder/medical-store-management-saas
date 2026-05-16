import MedicineBatch from "../models/MedicineBatch.js";
import StockAlert from "../models/StockAlert.js";

/**
 * Generate stock alerts for low-stock and expiry
 * @param {String} medicalStoreId
 * @param {Number} lowStockThreshold - default 10 units
 * @param {Number} expiryDaysThreshold - default 30 days
 */
export const generateStockAlerts = async (
  medicalStoreId,
  lowStockThreshold = 10,
  expiryDaysThreshold = 30
) => {
  const today = new Date();
  const expiryLimit = new Date(today);
  expiryLimit.setDate(today.getDate() + expiryDaysThreshold);

  // Fetch all batches for this store
  const batches = await MedicineBatch.find({ medicalStoreId });

  for (const batch of batches) {
    // LOW STOCK ALERT
    if (batch.quantityRemaining <= lowStockThreshold) {
      const exists = await StockAlert.findOne({
        medicalStoreId,
        batchId: batch._id,
        alertType: "LOW_STOCK",
        isResolved: false,
      });
      if (!exists) {
        await StockAlert.create({
          medicalStoreId,
          medicineId: batch.medicineId,
          batchId: batch._id,
          alertType: "LOW_STOCK",
          message: `Low stock: ${batch.quantityRemaining} units remaining for batch ${batch.batchNumber}`,
          isResolved: false,
        });
      }
    }

    // EXPIRY ALERT
    if (batch.expiryDate <= expiryLimit) {
      const exists = await StockAlert.findOne({
        medicalStoreId,
        batchId: batch._id,
        alertType: "EXPIRY",
        isResolved: false,
      });
      if (!exists) {
        await StockAlert.create({
          medicalStoreId,
          medicineId: batch.medicineId,
          batchId: batch._id,
          alertType: "EXPIRY",
          message: `Batch ${batch.batchNumber} expiring on ${batch.expiryDate.toDateString()}`,
          isResolved: false,
        });
      }
    }
  }
};
