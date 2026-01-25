import mongoose from "mongoose";

const medicineBatchSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    // Medicine identity (what it is)
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },

    // Batch identity
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Purchase reference (where it came from)
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },

    purchasePricePerUnit: {
      type: Number,
      required: true,
    },

    sellingPricePerUnit: {
      type: Number,
      required: true,
    },

    quantityReceived: {
      type: Number,
      required: true,
      min: 0,
    },

    quantityRemaining: {
      type: Number,
      required: true,
      min: 0,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Critical indexes for performance + FIFO
medicineBatchSchema.index({
  medicalStoreId: 1,
  medicineId: 1,
  expiryDate: 1,
});

medicineBatchSchema.index({
  medicalStoreId: 1,
  batchNumber: 1,
});

// Safety: remaining quantity can never exceed received
medicineBatchSchema.pre("save", function (next) {
  if (this.quantityRemaining > this.quantityReceived) {
    return next(
      new Error("Quantity remaining cannot exceed quantity received")
    );
  }
  next();
});

const MedicineBatch = mongoose.model(
  "MedicineBatch",
  medicineBatchSchema
);

export default MedicineBatch;
