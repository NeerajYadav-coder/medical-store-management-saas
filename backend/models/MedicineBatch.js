/**
 * models/MedicineBatch.js
 * 
 * Represents physical stock - the MOST important model.
 * Each batch has different expiry, price, and profit.
 * Future value: Manufacturing date tracking for own-label transition.
 */

import mongoose from 'mongoose';

const medicineBatchSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: [true, 'Medical store reference is required'],
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine reference is required'],
      index: true,
    },
    // For quick display without populating
    medicineName: {
      type: String,
      trim: true,
    },
    
    // === BATCH IDENTITY ===
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      uppercase: true,
    },
    
    // ======= SMART FIELDS (Future own-label ready) =======
    
    // Manufacturing date - even for third-party purchases
    // When own-label launches, this data flows without a blink
    manufacturingDate: {
      type: Date,
    },
    // Expiry date - critical for FIFO and alerts
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    // Marketing Authorization Holder (for regulatory)
    mahName: {
      type: String,
      trim: true,
    },
    
    // ======= END SMART FIELDS =======
    
    // === PRICING ===
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
    // Margin percentage for this batch
    marginPercentage: {
      type: Number,
      default: 0,
    },
    
    // === QUANTITY ===
    quantityReceived: {
      type: Number,
      required: true,
      min: 0,
    },
    quantitySold: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityReturned: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityDamaged: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    // Free quantity (bonus from supplier)
    freeQuantity: {
      type: Number,
      default: 0,
    },
    
    // === REFERENCES ===
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
      trim: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    purchaseItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseItem',
    },
    
    // === DATES ===
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // === STATUS ===
    status: {
      type: String,
      enum: ['ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'NEAR_EXPIRY', 'RETURNED'],
      default: 'ACTIVE',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Reason if deactivated
    deactivationReason: {
      type: String,
      trim: true,
    },
    deactivatedAt: Date,
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
medicineBatchSchema.index({ medicalStoreId: 1, medicineId: 1, expiryDate: 1 });
medicineBatchSchema.index({ medicalStoreId: 1, batchNumber: 1 });
medicineBatchSchema.index({ medicalStoreId: 1, status: 1 });
medicineBatchSchema.index({ medicalStoreId: 1, expiryDate: 1, quantityRemaining: 1 });
medicineBatchSchema.index({ medicalStoreId: 1, supplierId: 1 });

// Pre-save validations and calculations
medicineBatchSchema.pre('save', function() {
  // Quantity remaining cannot exceed received
  const effectiveReceived = this.quantityReceived + this.freeQuantity + this.quantityReturned;
  const effectiveUsed = this.quantitySold + this.quantityDamaged;
  this.quantityRemaining = effectiveReceived - effectiveUsed;
  // Price validations removed to allow selling price to be less than purchase price (e.g. for promotions, discounts)

  // Expiry validation (Only for new batches)
  if (this.isNew && this.expiryDate && this.expiryDate < new Date()) {
    throw new Error('Expiry date must be in the future for new stock');
  }

  if (this.quantityRemaining < 0) {
    throw new Error('Quantity remaining cannot be negative');
  }
  
  // Calculate margin percentage
  if (this.purchasePrice > 0) {
    this.marginPercentage = ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
  }
  
  // Auto-update status
  if (this.quantityRemaining === 0) {
    this.status = 'OUT_OF_STOCK';
  } else if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'EXPIRED';
    this.isActive = false;
  } else if (this.expiryDate) {
    const daysToExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry <= 30) {
      this.status = 'NEAR_EXPIRY';
    } else if (this.quantityRemaining <= 10) {
      this.status = 'LOW_STOCK';
    } else {
      this.status = 'ACTIVE';
    }
  }
});

// Post-save hook to manage StockAlerts
medicineBatchSchema.post('save', async function(doc) {
  try {
    // Dynamic import to avoid circular dependency
    const StockAlert = (await import('./StockAlert.js')).default;

    // If status indicates an alert condition
    if (['LOW_STOCK', 'NEAR_EXPIRY', 'EXPIRED'].includes(doc.status)) {
      await StockAlert.findOneAndUpdate(
        { 
          medicalStoreId: doc.medicalStoreId,
          batchId: doc._id,
          type: doc.status,
          isResolved: false
        },
        {
          medicalStoreId: doc.medicalStoreId,
          batchId: doc._id,
          medicineId: doc.medicineId,
          medicineName: doc.medicineName,
          type: doc.status,
          priority: doc.status === 'EXPIRED' ? 'CRITICAL' : (doc.status === 'NEAR_EXPIRY' ? 'HIGH' : 'MEDIUM'),
          message: `${doc.medicineName} batch ${doc.batchNumber} is ${doc.status.replace('_', ' ')}`,
          isResolved: false,
        },
        { upsert: true, new: true }
      );
    } else if (doc.status === 'ACTIVE' || doc.status === 'OUT_OF_STOCK') {
      await StockAlert.updateMany(
        { 
          medicalStoreId: doc.medicalStoreId,
          batchId: doc._id,
          isResolved: false 
        },
        { 
          isResolved: true,
          resolvedAt: new Date(),
          resolutionNote: `Status changed to ${doc.status}`
        }
      );
    }
  } catch (error) {
    console.error('Error auto-managing StockAlert:', error);
  }
});

// Method to sell from this batch
medicineBatchSchema.methods.sell = async function(quantity) {
  if (this.quantityRemaining < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.quantityRemaining}, Requested: ${quantity}`);
  }
  
  this.quantitySold += quantity;
  this.quantityRemaining -= quantity;
  
  // Update status
  if (this.quantityRemaining === 0) {
    this.status = 'OUT_OF_STOCK';
  }
  
  await this.save();
  return this;
};

// Method to return to this batch
medicineBatchSchema.methods.returnStock = async function(quantity) {
  this.quantityReturned += quantity;
  this.quantitySold -= quantity;
  this.quantityRemaining += quantity;
  
  if (this.quantityRemaining > 0 && this.status === 'OUT_OF_STOCK') {
    this.status = 'ACTIVE';
  }
  
  await this.save();
  return this;
};

// Static: Get FIFO batch for selling (oldest non-expired first)
medicineBatchSchema.statics.getFIFOBatch = function(storeId, medicineId, quantity) {
  return this.findOne({
    medicalStoreId: storeId,
    medicineId: medicineId,
    quantityRemaining: { $gte: quantity },
    expiryDate: { $gt: new Date() },
    isActive: true,
    status: { $in: ['ACTIVE', 'LOW_STOCK', 'NEAR_EXPIRY'] }
  })
    .sort({ expiryDate: 1, receivedAt: 1 })
    .select('batchNumber expiryDate quantityRemaining sellingPrice purchasePrice mrp marginPercentage');
};

// Static: Get all available batches for a medicine
medicineBatchSchema.statics.getAvailableBatches = function(storeId, medicineId) {
  return this.find({
    medicalStoreId: storeId,
    medicineId: medicineId,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $gt: new Date() },
    isActive: true
  })
    .sort({ expiryDate: 1 })
    .select('batchNumber manufacturingDate expiryDate quantityRemaining sellingPrice mrp status');
};

// Static: Get near-expiry batches
medicineBatchSchema.statics.getNearExpiryBatches = function(storeId, daysThreshold = 30) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return this.find({
    medicalStoreId: storeId,
    expiryDate: { $lte: thresholdDate, $gt: new Date() },
    quantityRemaining: { $gt: 0 },
    isActive: true
  })
    .sort({ expiryDate: 1 })
    .populate('medicineId', 'name dosage form')
    .select('medicineName batchNumber expiryDate quantityRemaining sellingPrice');
};

// Static: Get total stock value
medicineBatchSchema.statics.getTotalStockValue = async function(storeId) {
  const result = await this.aggregate([
    { $match: { medicalStoreId: new mongoose.Types.ObjectId(storeId), isActive: true, quantityRemaining: { $gt: 0 } } },
    { $group: {
      _id: null,
      totalPurchaseValue: { $sum: { $multiply: ['$quantityRemaining', '$purchasePrice'] } },
      totalMRPValue: { $sum: { $multiply: ['$quantityRemaining', '$mrp'] } },
      totalSellingValue: { $sum: { $multiply: ['$quantityRemaining', '$sellingPrice'] } },
      totalUnits: { $sum: '$quantityRemaining' }
    }}
  ]);
  
  return result[0] || { totalPurchaseValue: 0, totalMRPValue: 0, totalSellingValue: 0, totalUnits: 0 };
};

const MedicineBatch = mongoose.model('MedicineBatch', medicineBatchSchema);

export default MedicineBatch;
