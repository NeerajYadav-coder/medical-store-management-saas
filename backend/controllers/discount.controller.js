import DiscountRule from "../models/DiscountRule.js";

/**
 * CREATE DISCOUNT RULE
 * OWNER only
 */
export const createDiscountRule = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const { customerCategory, profitTarget, discountAmount, frequencyLimit, isActive } = req.body;

    if (!customerCategory || !profitTarget || !discountAmount) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const discountRule = await DiscountRule.create({
      medicalStoreId,
      customerCategory,
      profitTarget,
      discountAmount,
      frequencyLimit,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: discountRule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL DISCOUNT RULES
 */
export const getAllDiscountRules = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;

    const rules = await DiscountRule.find({ medicalStoreId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE DISCOUNT RULE
 */
export const getSingleDiscountRule = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const ruleId = req.params.id;

    const rule = await DiscountRule.findOne({ _id: ruleId, medicalStoreId });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Discount rule not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE DISCOUNT RULE
 * OWNER only
 */
export const updateDiscountRule = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const ruleId = req.params.id;

    const updatedRule = await DiscountRule.findOneAndUpdate(
      { _id: ruleId, medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return res.status(404).json({
        success: false,
        message: "Discount rule not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedRule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE DISCOUNT RULE
 * OWNER only
 */
export const deleteDiscountRule = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const ruleId = req.params.id;

    const deletedRule = await DiscountRule.findOneAndDelete({ _id: ruleId, medicalStoreId });

    if (!deletedRule) {
      return res.status(404).json({
        success: false,
        message: "Discount rule not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Discount rule deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
