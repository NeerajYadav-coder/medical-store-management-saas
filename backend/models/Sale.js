/**
 * models/Sale.js
 * 
 * Represents one sale/bill transaction.
 * Future value: Symptom tracking for own-label positioning,
 * doctor reference for ROI and prescription analysis.
 */

import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: [true, 'Medical store reference is required'],
      index: true,
    },
    
    // Auto-generated bill number
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // Customer (optional for walk-in)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    
    // ======= SMART FIELDS (Intelligence from Day 1) =======
    
    // Doctor who prescribed (for prescription tracking)
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    doctorName: {
      type: String,
      trim: true,
    },
    // Is this a doctor-prescribed purchase?
    // Future: Know salt vs brand loyalty
    isPrescribed: {
      type: Boolean,
      default: false,
    },
    // What symptoms is the customer buying for?
    // Future: Know which painkiller to push when own-label launches
    symptoms: [{
      symptomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SymptomCategory',
      },
      symptomName: String,
    }],
    // Is this a repeat buyer?
    isRepeatCustomer: {
      type: Boolean,
      default: false,
    },
    
    // ======= END SMART FIELDS =======
    
    // === BILLING ===
    totalItems: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    // Discount
    discountType: {
      type: String,
      enum: ['NONE', 'PERCENTAGE', 'FLAT', 'AUTO_RULE', 'MANUAL'],
      default: 'NONE',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscountRule',
    },
    discountReason: {
      type: String,
      trim: true,
    },
    // Tax
    taxableAmount: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    totalGst: {
      type: Number,
      default: 0,
    },
    // Rounding
    roundOff: {
      type: Number,
      default: 0,
    },
    // Final amount
    grandTotal: {
      type: Number,
      required: true,
    },
    
    // === PAYMENT ===
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'CREDIT', 'MIXED'],
      default: 'CASH',
    },
    paymentDetails: {
      cash: { type: Number, default: 0 },
      upi: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'CREDIT', 'VOID'],
      default: 'PAID',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    
    // === PROFIT ===
    totalCost: {
      type: Number,
      default: 0,
    },
    grossProfit: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0, // After discount
    },
    
    // === STAFF ===
    billedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    billedByName: {
      type: String,
      trim: true,
    },
    
    // === STATUS ===
    status: {
      type: String,
      enum: ['COMPLETED', 'VOID', 'RETURNED', 'PARTIAL_RETURN'],
      default: 'COMPLETED',
    },
    voidReason: {
      type: String,
      trim: true,
    },
    voidedAt: Date,
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
saleSchema.index({ medicalStoreId: 1, billNumber: 1 });
saleSchema.index({ medicalStoreId: 1, billDate: -1 });
saleSchema.index({ medicalStoreId: 1, customerId: 1 });
saleSchema.index({ medicalStoreId: 1, doctorId: 1 });
saleSchema.index({ medicalStoreId: 1, isPrescribed: 1 });
saleSchema.index({ medicalStoreId: 1, billedBy: 1 });
saleSchema.index({ medicalStoreId: 1, status: 1 });
saleSchema.index({ medicalStoreId: 1, paymentStatus: 1 });

// Pre-save: Calculate net profit
saleSchema.pre('save', function() {
  this.netProfit = this.grossProfit - this.discountAmount;
});

// Static: Generate bill number
saleSchema.statics.generateBillNumber = async function(storeId) {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastSale = await this.findOne({
    medicalStoreId: storeId,
    billNumber: new RegExp(`^${datePrefix}`)
  }).sort({ billNumber: -1 });
  
  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.billNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${datePrefix}${sequence.toString().padStart(4, '0')}`;
};

// Static: Get daily sales summary
saleSchema.statics.getDailySummary = async function(storeId, date = new Date()) {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const result = await this.aggregate([
    { 
      $match: { 
        medicalStoreId: new mongoose.Types.ObjectId(storeId),
        billDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'VOID' }
      } 
    },
    { 
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalRevenue: { $sum: '$grandTotal' },
        totalCost: { $sum: '$totalCost' },
        totalDiscount: { $sum: '$discountAmount' },
        grossProfit: { $sum: '$grossProfit' },
        netProfit: { $sum: '$netProfit' },
        cashSales: { $sum: '$paymentDetails.cash' },
        upiSales: { $sum: '$paymentDetails.upi' },
        cardSales: { $sum: '$paymentDetails.card' },
        creditSales: { $sum: '$paymentDetails.credit' },
        prescribedCount: { $sum: { $cond: ['$isPrescribed', 1, 0] } },
        repeatCustomerCount: { $sum: { $cond: ['$isRepeatCustomer', 1, 0] } }
      }
    }
  ]);
  
  return result[0] || {
    totalBills: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalDiscount: 0,
    grossProfit: 0,
    netProfit: 0,
    cashSales: 0,
    upiSales: 0,
    cardSales: 0,
    creditSales: 0,
    prescribedCount: 0,
    repeatCustomerCount: 0
  };
};

// Static: Get symptom-wise sales analysis
saleSchema.statics.getSymptomAnalysis = async function(storeId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        medicalStoreId: new mongoose.Types.ObjectId(storeId),
        billDate: { $gte: startDate, $lte: endDate },
        'symptoms.0': { $exists: true },
        status: { $ne: 'VOID' }
      }
    },
    { $unwind: '$symptoms' },
    {
      $group: {
        _id: '$symptoms.symptomName',
        count: { $sum: 1 },
        revenue: { $sum: '$grandTotal' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
