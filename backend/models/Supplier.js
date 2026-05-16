/**
 * models/Supplier.js
 * 
 * Represents vendors/distributors who supply medicines.
 * Future value: Vendor codes for quick identification,
 * margin tracking for best supplier selection when own-label launches.
 */

import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: [true, 'Medical store reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    drugLicenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    
    // ======= SMART FIELDS (Intelligence from Day 1) =======
    
    // Unique vendor code for quick identification
    // When own-label launches, call best margin suppliers first
    vendorCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    // Margin category for quick filtering
    marginCategory: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    // Average margin percentage from this supplier
    avgMarginPercentage: {
      type: Number,
      default: 0,
    },
    // Total purchase value from this supplier
    totalPurchaseValue: {
      type: Number,
      default: 0,
    },
    // Total number of invoices
    totalInvoices: {
      type: Number,
      default: 0,
    },
    // Rating (1-5) based on quality, delivery, etc.
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    // Categories this supplier specializes in
    specializesIn: [{
      type: String,
      trim: true,
    }],
    
    // ======= END SMART FIELDS =======
    
    // Payment terms (days)
    paymentTerms: {
      type: Number,
      default: 30,
    },
    // Credit limit allowed by supplier
    creditLimit: {
      type: Number,
      default: 0,
    },
    // Current outstanding amount
    currentCredit: {
      type: Number,
      default: 0,
    },
    // Bank details for payment
    bankDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      upiId: { type: String, trim: true },
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supplierSchema.index({ medicalStoreId: 1, name: 1 });
supplierSchema.index({ medicalStoreId: 1, vendorCode: 1 });
supplierSchema.index({ medicalStoreId: 1, marginCategory: 1 });
supplierSchema.index({ medicalStoreId: 1, avgMarginPercentage: -1 });
supplierSchema.index({ medicalStoreId: 1, isActive: 1 });

// Generate vendor code if not provided
supplierSchema.pre('save', async function() {
  if (!this.vendorCode && this.isNew) {
    // Generate unique vendor code: First 3 letters of name + random 3 digits
    const prefix = this.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    const suffix = Math.floor(100 + Math.random() * 900);
    this.vendorCode = `${prefix}${suffix}`;
  }
});

// Method to update stats after purchase
supplierSchema.methods.updateStatsAfterPurchase = async function(purchaseTotal, marginPercentage) {
  const newTotal = this.totalPurchaseValue + purchaseTotal;
  const oldWeightedMargin = this.avgMarginPercentage * this.totalInvoices;
  
  this.totalInvoices += 1;
  this.totalPurchaseValue = newTotal;
  this.avgMarginPercentage = (oldWeightedMargin + marginPercentage) / this.totalInvoices;
  
  // Auto-categorize margin
  if (this.avgMarginPercentage >= 20) {
    this.marginCategory = 'HIGH';
  } else if (this.avgMarginPercentage >= 10) {
    this.marginCategory = 'MEDIUM';
  } else {
    this.marginCategory = 'LOW';
  }
  
  await this.save();
};

// Static method to get best margin suppliers
supplierSchema.statics.getBestMarginSuppliers = function(storeId, limit = 10) {
  return this.find({ 
    medicalStoreId: storeId, 
    isActive: true,
    marginCategory: { $in: ['HIGH', 'MEDIUM'] }
  })
    .sort({ avgMarginPercentage: -1 })
    .limit(limit)
    .select('name vendorCode avgMarginPercentage marginCategory rating totalPurchaseValue');
};

// Virtual for available credit
supplierSchema.virtual('availableCredit').get(function() {
  return this.creditLimit - this.currentCredit;
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
