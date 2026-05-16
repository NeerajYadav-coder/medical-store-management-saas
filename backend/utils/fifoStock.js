import MedicineBatch from "../models/MedicineBatch.js";

/**
 * Deduct quantity from batches using FIFO logic
 * @param {String} medicineId - ID of the medicine being sold
 * @param {Number} quantity - total quantity to deduct
 * @param {String} medicalStoreId - store context
 * @returns {Array} - list of batches updated with quantity deducted
 */
export const deductStockFIFO = async (medicineId, quantity, medicalStoreId) => {
  // Get batches sorted by earliest expiry and then earliest received
  const batches = await MedicineBatch.find({
    medicineId,
    medicalStoreId,
    quantityRemaining: { $gt: 0 },
  }).sort({ expiryDate: 1, receivedAt: 1 });

  let remainingToDeduct = quantity;
  const updatedBatches = [];

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;

    const deductQty = Math.min(batch.quantityRemaining, remainingToDeduct);
    batch.quantityRemaining -= deductQty;
    remainingToDeduct -= deductQty;

    await batch.save();
    updatedBatches.push({ batchId: batch._id, deductedQuantity: deductQty });
  }

  if (remainingToDeduct > 0) {
    throw new Error(
      `Insufficient stock for medicine ${medicineId}. ${remainingToDeduct} units could not be fulfilled.`
    );
  }

  return updatedBatches;
};
