import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    // Parent sale (bill)
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
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

    // Batch actually sold (FIFO decides this)
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

    sellingPricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Index for fast bill reconstruction
saleItemSchema.index({
  saleId: 1,
});

// 🧠 Safety check
saleItemSchema.pre("save", function (next) {
  if (this.totalPrice !== this.quantity * this.sellingPricePerUnit) {
    return next(
      new Error("Total price does not match quantity × selling price")
    );
  }
  next();
});

const SaleItem = mongoose.model("SaleItem", saleItemSchema);

export default SaleItem;
