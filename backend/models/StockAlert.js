import mongoose from "mongoose";

const stockAlertSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineBatch",
      required: true,
      index: true,
    },

    // For quick display
    medicineName: {
      type: String,
      trim: true
    },

    type: {
      type: String,
      enum: ["LOW_STOCK", "NEAR_EXPIRY", "EXPIRED", "OUT_OF_STOCK"],
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
      index: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    resolvedAt: Date,
    resolutionNote: String
  },
  {
    timestamps: true,
  }
);

// 🔒 Prevent duplicate active alerts for same batch & type
stockAlertSchema.index(
  {
    medicalStoreId: 1,
    batchId: 1,
    type: 1,
    isResolved: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isResolved: false },
  }
);

const StockAlert = mongoose.model(
  "StockAlert",
  stockAlertSchema
);

export default StockAlert;
