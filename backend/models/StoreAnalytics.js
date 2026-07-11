import mongoose from 'mongoose';

const storeAnalyticsSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    // Type of rollup (DAILY, MONTHLY, QUARTERLY, YEARLY)
    period: {
      type: String,
      enum: ['DAILY', 'MONTHLY', 'YEARLY'],
      required: true,
    },
    totalSales: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    totalBills: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    upiSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    creditSales: { type: Number, default: 0 },
    prescribedCount: { type: Number, default: 0 },
    repeatCustomerCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookup
storeAnalyticsSchema.index({ medicalStoreId: 1, period: 1, date: -1 });

const StoreAnalytics = mongoose.model('StoreAnalytics', storeAnalyticsSchema);

export default StoreAnalytics;
