import DiscountRule from "../models/DiscountRule.js";

/**
 * Calculate auto discount for a customer
 * @param {String} customerCategory - NORMAL | REGULAR | VIP
 * @param {Number} expectedProfit - projected profit for this sale
 * @param {String} medicalStoreId - store context
 * @returns {Number} discountAmount
 */
export const calculateAutoDiscount = async (
  customerCategory,
  expectedProfit,
  medicalStoreId
) => {
  // Find active rules for this customer category
  const rules = await DiscountRule.find({
    medicalStoreId,
    customerCategory,
    isActive: true,
  });

  if (!rules.length) return 0;

  // Find the rule where expected profit meets the target
  const applicableRule = rules.find((rule) => expectedProfit >= rule.profitTarget);

  return applicableRule ? applicableRule.discountAmount : 0;
};
