/**
 * models/SaleItem.js
 * 
 * Line items inside a sale bill.
 * Each item tracks batch, profit, and prescription status.
 */

import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
      index: true,
    },
    
    // Medicine reference
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    medicineDosage: {
      type: String,
      trim: true,
    },
    medicineForm: {
      type: String,
      trim: true,
    },
    
    // Batch reference (FIFO selected)
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineBatch',
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    
    // Quantity
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    
    // Pricing
    mrp: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    // Item-level discount
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    // GST
    gstRate: {
      type: Number,
      default: 12,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    
    // Totals
    subtotal: {
      type: Number,
      required: true, // quantity * sellingPrice
    },
    totalAmount: {
      type: Number,
      required: true, // After discount, before GST
    },
    
    // ======= SMART FIELDS =======
    
    // Profit calculation
    costAmount: {
      type: Number,
      required: true, // quantity * purchasePrice
    },
    profitAmount: {
      type: Number,
      required: true, // totalAmount - costAmount
    },
    profitPercentage: {
      type: Number,
      default: 0,
    },
    
    // ======= END SMART FIELDS =======
    
    // Return tracking
    quantityReturned: {
      type: Number,
      default: 0,
    },
    returnReason: {
      type: String,
      trim: true,
    },
    
    notes: {
      type: String,
      trim: true,
    },
    refillReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

saleItemSchema.index({ medicalStoreId: 1, medicineId: 1 });
saleItemSchema.index({ medicalStoreId: 1, batchId: 1 });

// Pre-save: Calculate profit
saleItemSchema.pre('save', function() {
  this.subtotal = this.quantity * this.sellingPrice;
  this.discountAmount = (this.subtotal * this.discountPercent) / 100;
  this.totalAmount = this.subtotal - this.discountAmount;
  this.costAmount = this.quantity * this.purchasePrice;
  this.profitAmount = this.totalAmount - this.costAmount;
  
  if (this.costAmount > 0) {
    this.profitPercentage = (this.profitAmount / this.costAmount) * 100;
  }
});

// Static: Get medicine-wise sales analysis
saleItemSchema.statics.getMedicineWiseAnalysis = async function(storeId, startDate, endDate, limit = 20) {
  return this.aggregate([
    {
      $match: {
        medicalStoreId: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$medicineId',
        medicineName: { $first: '$medicineName' },
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        totalCost: { $sum: '$costAmount' },
        totalProfit: { $sum: '$profitAmount' },
        avgProfitPercent: { $avg: '$profitPercentage' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ]);
};

// Static: Get batch-wise profit analysis
saleItemSchema.statics.getBatchProfitAnalysis = async function(storeId, medicineId) {
  return this.aggregate([
    {
      $match: {
        medicalStoreId: new mongoose.Types.ObjectId(storeId),
        medicineId: new mongoose.Types.ObjectId(medicineId)
      }
    },
    {
      $group: {
        _id: '$batchNumber',
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$profitAmount' },
        avgProfitPercent: { $avg: '$profitPercentage' }
      }
    },
    { $sort: { totalProfit: -1 } }
  ]);
};

const SaleItem = mongoose.model('SaleItem', saleItemSchema);

export default SaleItem;
