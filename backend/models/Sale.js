import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    // Optional – walk-in customers allowed
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    discountApplied: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountType: {
      type: String,
      enum: ["MANUAL", "AUTO", "NONE"],
      default: "NONE",
    },

    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["CASH", "UPI", "CARD"],
      required: true,
    },

    profitAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Indexes for billing speed & dashboard
saleSchema.index({
  medicalStoreId: 1,
  createdAt: -1,
});

saleSchema.index({
  medicalStoreId: 1,
  customerId: 1,
});

// 🧠 Safety: final amount validation
saleSchema.pre("save", function (next) {
  if (this.finalAmount > this.totalAmount) {
    return next(
      new Error("Final amount cannot exceed total amount")
    );
  }
  next();
});

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
