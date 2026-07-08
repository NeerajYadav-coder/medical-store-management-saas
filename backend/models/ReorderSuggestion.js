import mongoose from 'mongoose';

const reorderSuggestionSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    forecastWindowDays: {
      type: Number,
      required: true,
    },
    predictedDemand: {
      type: Number,
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    suggestedReorderQty: {
      type: Number,
      required: true,
    },
    daysOfStockRemaining: {
      type: Number,
      required: true,
    },
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    reasoning: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'actioned', 'dismissed'],
      default: 'pending',
    },
    actionedPurchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder', // Or 'Purchase' depending on existing models
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reorderSuggestionSchema.index({ medicalStoreId: 1, status: 1, urgency: 1 });

const ReorderSuggestion = mongoose.model('ReorderSuggestion', reorderSuggestionSchema);

export default ReorderSuggestion;
