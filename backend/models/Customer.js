/**
 * models/Customer.js
 * 
 * Represents customers who buy medicines.
 * Future value: Repeat buyer tracking, loyalty analysis,
 * doctor referral patterns, symptom preferences.
 */

import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: [true, 'Medical store reference is required'],
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Walk-in Customer',
    },
    phone: {
      type: String,
      trim: true,
      index: true,
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
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    // Used to group family members under one account
    familyGroupId: {
      type: String,
      trim: true,
    },
    
    // ======= SMART FIELDS (Intelligence from Day 1) =======
    
    // Auto-calculated after 2nd purchase
    isRepeatBuyer: {
      type: Boolean,
      default: false,
    },
    // Total number of purchases
    totalPurchases: {
      type: Number,
      default: 0,
    },
    // Total amount spent
    totalSpent: {
      type: Number,
      default: 0,
    },
    // Total profit generated from this customer
    totalProfitGenerated: {
      type: Number,
      default: 0,
    },
    // Average order value
    avgOrderValue: {
      type: Number,
      default: 0,
    },
    // Last visit date
    lastVisitDate: {
      type: Date,
    },
    // Loyalty category (auto-upgraded based on spending)
    loyaltyCategory: {
      type: String,
      enum: ['NEW', 'REGULAR', 'VIP', 'BULK'],
      default: 'NEW',
    },
    // Preferred doctor (who usually prescribes to this customer)
    preferredDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    preferredDoctorName: {
      type: String,
      trim: true,
    },
    // Most common symptoms this customer buys medicines for
    frequentSymptoms: [{
      symptomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SymptomCategory',
      },
      symptomName: String,
      count: Number,
    }],
    // Top medicines this customer buys
    topMedicines: [{
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
      },
      medicineName: String,
      count: Number,
    }],
    // Prescription vs self-medication ratio
    prescriptionRatio: {
      type: Number,
      default: 0, // 0-100, higher = more doctor-prescribed
    },
    
    // ======= END SMART FIELDS =======
    
    // Credit management
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentCredit: {
      type: Number,
      default: 0,
    },
    // Auto discount percentage for this customer
    autoDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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
customerSchema.index({ medicalStoreId: 1, phone: 1 });
customerSchema.index({ medicalStoreId: 1, name: 1 });
customerSchema.index({ medicalStoreId: 1, isRepeatBuyer: 1 });
customerSchema.index({ medicalStoreId: 1, loyaltyCategory: 1 });
customerSchema.index({ medicalStoreId: 1, totalSpent: -1 });
customerSchema.index({ medicalStoreId: 1, lastVisitDate: -1 });

// Method to update stats after a sale
customerSchema.methods.updateStatsAfterSale = async function(saleTotal, profit, isPrescribed = false) {
  this.totalPurchases += 1;
  this.totalSpent += saleTotal;
  this.totalProfitGenerated += profit;
  this.avgOrderValue = this.totalSpent / this.totalPurchases;
  this.lastVisitDate = new Date();
  
  // Mark as repeat buyer after 4th purchase
  if (this.totalPurchases >= 4 && !this.isRepeatBuyer) {
    this.isRepeatBuyer = true;
  }
  
  // Update prescription ratio
  if (isPrescribed) {
    const prescribedCount = Math.round(this.prescriptionRatio * (this.totalPurchases - 1) / 100);
    this.prescriptionRatio = ((prescribedCount + 1) / this.totalPurchases) * 100;
  }
  
  // Auto-upgrade loyalty category based on spending
  if (this.totalSpent >= 50000) {
    this.loyaltyCategory = 'VIP';
  } else if (this.totalSpent >= 10000) {
    this.loyaltyCategory = 'REGULAR';
  }
  
  await this.save();
};

// Static method to get repeat buyers
customerSchema.statics.getRepeatBuyers = function(storeId, limit = 50) {
  return this.find({ 
    medicalStoreId: storeId, 
    isRepeatBuyer: true,
    isActive: true 
  })
    .sort({ totalSpent: -1 })
    .limit(limit)
    .select('name phone totalPurchases totalSpent loyaltyCategory lastVisitDate');
};

// Static method to get VIP customers
customerSchema.statics.getVIPCustomers = function(storeId) {
  return this.find({ 
    medicalStoreId: storeId, 
    loyaltyCategory: 'VIP',
    isActive: true 
  })
    .sort({ totalSpent: -1 })
    .select('name phone totalPurchases totalSpent avgOrderValue lastVisitDate preferredDoctorName');
};

// Virtual for available credit
customerSchema.virtual('availableCredit').get(function() {
  return this.creditLimit - this.currentCredit;
});

// Virtual to check if customer is dormant (no visit in 90 days)
customerSchema.virtual('isDormant').get(function() {
  if (!this.lastVisitDate) return false;
  const daysSinceLastVisit = (Date.now() - this.lastVisitDate) / (1000 * 60 * 60 * 24);
  return daysSinceLastVisit > 90;
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
