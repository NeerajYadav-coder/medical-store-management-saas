/**
 * Calculate profit for a sale item or multiple batches
 * @param {Array} batchDetails - [{ purchasePricePerUnit, sellingPricePerUnit, quantity }]
 * @returns {Number} total profit
 */
export const calculateProfit = (batchDetails) => {
  let totalProfit = 0;

  for (const batch of batchDetails) {
    const { purchasePricePerUnit, sellingPricePerUnit, quantity } = batch;

    if (
      purchasePricePerUnit === undefined ||
      sellingPricePerUnit === undefined ||
      quantity === undefined
    ) {
      throw new Error("Invalid batch details for profit calculation");
    }

    totalProfit += (sellingPricePerUnit - purchasePricePerUnit) * quantity;
  }

  return totalProfit;
};
