import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    // Who we bought from
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentType: {
      type: String,
      enum: ["CASH", "CREDIT"],
      required: true,
    },

    paymentDueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["PAID", "UNPAID", "PARTIAL"],
      default: "UNPAID",
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Indexes for performance & reports
purchaseSchema.index({
  medicalStoreId: 1,
  createdAt: -1,
});

purchaseSchema.index({
  medicalStoreId: 1,
  supplierId: 1,
});

// 🧠 Business safety: CREDIT must have due date
purchaseSchema.pre("save", function (next) {
  if (this.paymentType === "CREDIT" && !this.paymentDueDate) {
    return next(
      new Error("Payment due date is required for CREDIT purchases")
    );
  }
  next();
});

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
