import MedicineBatch from "../models/MedicineBatch.js";

/**
 * Generate a new batch number for a medicine
 * @param {String} medicineId
 * @param {String} medicalStoreId
 * @returns {String} newBatchNumber
 */
export const generateBatchNumber = async (medicineId, medicalStoreId) => {
  // Find latest batch for this medicine
  const latestBatch = await MedicineBatch.findOne({ medicineId, medicalStoreId })
    .sort({ receivedAt: -1, _id: -1 })
    .select("batchNumber");

  let newBatchNumber = "";

  if (!latestBatch) {
    newBatchNumber = `BATCH-${medicineId.slice(-4)}-001`;
  } else {
    const lastNumberMatch = latestBatch.batchNumber.match(/(\d+)$/);
    const lastNumber = lastNumberMatch ? parseInt(lastNumberMatch[1], 10) : 0;
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
    newBatchNumber = latestBatch.batchNumber.replace(/(\d+)$/, nextNumber);
  }

  return newBatchNumber;
};
