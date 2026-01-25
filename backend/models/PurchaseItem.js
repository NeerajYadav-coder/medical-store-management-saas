import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    // Parent invoice
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      index: true,
    },

    // Medicine identity
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },

    // Batch created from this purchase line
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineBatch",
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    purchasePricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Index for fast invoice reconstruction
purchaseItemSchema.index({
  purchaseId: 1,
});

// 🧠 Safety rule: quantity must be positive
purchaseItemSchema.pre("save", function (next) {
  if (this.quantity <= 0) {
    return next(new Error("Purchase item quantity must be greater than zero"));
  }
  next();
});

const PurchaseItem = mongoose.model("PurchaseItem", purchaseItemSchema);

export default PurchaseItem;
