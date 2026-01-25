import mongoose from "mongoose";

const discountRuleSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    // Which customer category this rule applies to
    customerCategory: {
      type: String,
      enum: ["NORMAL", "REGULAR", "VIP"],
      required: true,
      index: true,
    },

    // Minimum profit required to allow discount
    profitTarget: {
      type: Number,
      required: true,
      min: 0,
    },

    // Flat discount amount
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // How often it can be applied
    frequencyLimit: {
      type: String,
      enum: ["MONTHLY", "OCCASIONAL"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Prevent duplicate active rules per category per store
discountRuleSchema.index(
  {
    medicalStoreId: 1,
    customerCategory: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

const DiscountRule = mongoose.model(
  "DiscountRule",
  discountRuleSchema
);

export default DiscountRule;
