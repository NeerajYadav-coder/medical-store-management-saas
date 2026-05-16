/**
 * PurchaseItem.js
 * Line items for purchase invoices
 * Links to Medicine and Batch
 */

import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      index: true,
    },
    // Product Info
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineBatch',
      required: true, // Assuming batch is created with purchase item
    },
    batchNumber: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    manufacturingDate: {
      type: Date, // For future own-label tracking
    },
    // Quantities
    unitsPerPack: {
      type: Number,
      default: 1, // e.g. 10 tablets/strip
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    freeQuantity: {
      type: Number,
      default: 0,
    },
    totalQuantity: { // quantity + freeQuantity
      type: Number,
      required: true,
    },
    // Pricing
    mrp: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    gstRate: {
      type: Number,
      required: true, // 5, 12, 18, etc.
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    // Calculations
    subtotal: {
      type: Number, // qty * purchasePrice
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number, // subtotal + tax
      required: true,
    },
    margin: {
      type: Number, // Percentage margin
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
purchaseItemSchema.index({ medicalStoreId: 1, purchaseId: 1 });
purchaseItemSchema.index({ medicalStoreId: 1, medicineId: 1 });
purchaseItemSchema.index({ medicalStoreId: 1, batchId: 1 });

const PurchaseItem = mongoose.model('PurchaseItem', purchaseItemSchema);

export default PurchaseItem;
