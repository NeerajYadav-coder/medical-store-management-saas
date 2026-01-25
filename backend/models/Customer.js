import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      index: true,
    },

    // Used to group family members under one account
    familyGroupId: {
      type: String,
      trim: true,
    },

    totalPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProfitGenerated: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: ["NORMAL", "REGULAR", "VIP"],
      default: "NORMAL",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Indexes for fast lookup & analytics
customerSchema.index({
  medicalStoreId: 1,
  phone: 1,
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
