/**
 * Purchase.js
 * Purchase invoice model
 * Tracks incoming stock from suppliers
 */

import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    // Supplier Information
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    supplierBillNumber: {
      type: String,
      required: true,
    },
    supplierBillDate: {
      type: Date,
      required: true,
    },
    // Financials
    totalItems: {
      type: Number,
      required: true,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalGst: {
      type: Number,
      required: true,
      default: 0,
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
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'],
      default: 'PENDING',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
    },
    // Metadata
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedByName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'DRAFT', 'CANCELLED'],
      default: 'COMPLETED',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
purchaseSchema.index({ medicalStoreId: 1, supplierBillDate: -1 });
purchaseSchema.index({ medicalStoreId: 1, supplierId: 1 });
purchaseSchema.index({ medicalStoreId: 1, paymentStatus: 1 });

// Static methods
purchaseSchema.statics.getPendingPayments = async function(medicalStoreId) {
  return this.aggregate([
    {
      $match: {
        medicalStoreId: new mongoose.Types.ObjectId(medicalStoreId),
        paymentStatus: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: null,
        totalPending: { $sum: '$balanceAmount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
