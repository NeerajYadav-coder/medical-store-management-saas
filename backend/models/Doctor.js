/**
 * models/Doctor.js
 * 
 * Tracks doctors who prescribe to customers.
 * Future value: Know doctor ROI, prescription patterns, 
 * and salt vs brand loyalty.
 */

import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: [true, 'Medical store reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    clinic: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: 'General',
    },
    
    // ======= SMART FIELDS (Intelligence from Day 1) =======
    
    // Total prescriptions referred by this doctor
    totalPrescriptions: {
      type: Number,
      default: 0,
    },
    // Total revenue from this doctor's prescriptions
    totalRevenue: {
      type: Number,
      default: 0,
    },
    // Average prescription value
    avgPrescriptionValue: {
      type: Number,
      default: 0,
    },
    // Top medicines this doctor prescribes (updated periodically)
    topMedicines: [{
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
      },
      medicineName: String,
      count: Number,
    }],
    // Last prescription date
    lastPrescriptionDate: {
      type: Date,
    },
    
    // ======= END SMART FIELDS =======
    
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

// Compound index for store + name uniqueness
doctorSchema.index({ medicalStoreId: 1, name: 1 });
doctorSchema.index({ medicalStoreId: 1, isActive: 1 });
doctorSchema.index({ medicalStoreId: 1, totalRevenue: -1 });

// Method to update doctor stats after a sale
doctorSchema.methods.updateStatsAfterSale = async function(saleTotal) {
  this.totalPrescriptions += 1;
  this.totalRevenue += saleTotal;
  this.avgPrescriptionValue = this.totalRevenue / this.totalPrescriptions;
  this.lastPrescriptionDate = new Date();
  await this.save();
};

// Static method to get top doctors by revenue
doctorSchema.statics.getTopDoctors = function(storeId, limit = 10) {
  return this.find({ medicalStoreId: storeId, isActive: true })
    .sort({ totalRevenue: -1 })
    .limit(limit)
    .select('name specialization totalPrescriptions totalRevenue avgPrescriptionValue');
};

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
