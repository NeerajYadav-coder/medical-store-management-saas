/**
 * models/Medicine.js
 * 
 * Master catalog of medicines (NOT stock).
 * Future value: Symptom mapping for own-label positioning,
 * therapeutic class for strategic decisions.
 */

import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: [true, 'Medical store reference is required'],
      index: true,
    },
    
    // === IDENTITY ===
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    // Salt/composition (e.g., Paracetamol, Cetirizine)
    genericName: {
      type: String,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true, // e.g., 500mg, 10ml, 100mg/5ml
    },
    form: {
      type: String,
      enum: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'POWDER', 'GEL', 'SPRAY', 'INHALER', 'SUPPOSITORY', 'PATCH', 'SUSPENSION', 'LOTION', 'OTHER'],
      required: true,
    },
    unitType: {
      type: String,
      enum: ['STRIP', 'BOTTLE', 'VIAL', 'TUBE', 'BOX', 'PIECE', 'SACHET', 'AMPOULE', 'CARTRIDGE'],
      required: true,
    },
    // Units per pack (e.g., 10 tablets per strip)
    unitsPerPack: {
      type: Number,
      default: 1,
    },
    // For bulk tablets/capsules (Box -> Strips -> Tablets)
    stripsPerBox: {
      type: Number,
      default: 1,
    },
    totalUnitsPerBox: {
        type: Number,
        default: 1,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    isPrescriptionRequired: {
        type: Boolean,
        default: false,
    },
    
    // === REGULATORY ===
    hsnCode: {
      type: String,
      trim: true,
    },
    gstRate: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 12,
    },
    // Drug schedule (determines prescription requirements)
    schedule: {
      type: String,
      enum: ['H', 'H1', 'X', 'G', 'OTC', 'AYUSH', 'NONE'],
      default: 'OTC',
    },
    
    // === PRICING (Reference, actual may vary by batch) ===
    defaultMRP: {
      type: Number,
      required: true,
    },
    defaultSellingPrice: {
      type: Number,
      required: true,
    },
    defaultPurchasePrice: {
      type: Number,
    },
    
    // === INVENTORY ===
    reorderLevel: {
      type: Number,
      default: 10,
    },
    
    // ======= SMART FIELDS (Intelligence from Day 1) =======
    
    // What symptoms is this medicine for?
    // Future: Know which painkiller to push when own-label launches
    symptomCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SymptomCategory',
    }],
    symptomNames: [{
      type: String,
      trim: true,
    }],
    
    // Therapeutic class (e.g., Analgesic, Antibiotic, Antacid)
    therapeuticClass: {
      type: String,
      trim: true,
    },
    
    // Substitutes (similar medicines - same salt, different brand)
    substitutes: [{
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
      },
      medicineName: String,
    }],
    
    // Sales analytics
    totalUnitsSold: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    
    // Prescription vs OTC ratio for this medicine
    prescriptionRatio: {
      type: Number,
      default: 0, // 0-100
    },
    
    // ======= END SMART FIELDS =======
    
    // For search
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    description: {
      type: String,
      trim: true,
    },
    sideEffects: {
      type: String,
      trim: true,
    },
    // Storage instructions
    storageCondition: {
      type: String,
      enum: ['ROOM_TEMP', 'REFRIGERATED', 'COOL_DRY', 'PROTECT_LIGHT'],
      default: 'ROOM_TEMP',
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
medicineSchema.index({ medicalStoreId: 1, name: 1, dosage: 1, form: 1 }, { unique: true });
medicineSchema.index({ medicalStoreId: 1, genericName: 1 });
medicineSchema.index({ medicalStoreId: 1, therapeuticClass: 1 });
medicineSchema.index({ medicalStoreId: 1, symptomCategories: 1 });
medicineSchema.index({ medicalStoreId: 1, totalUnitsSold: -1 });
medicineSchema.index({ medicalStoreId: 1, isActive: 1 });
medicineSchema.index({ medicalStoreId: 1, tags: 1 });

// Text index for search
medicineSchema.index({ 
  name: 'text', 
  genericName: 'text', 
  manufacturer: 'text',
  tags: 'text' 
});

// Pre-save: auto-generate tags and handle unit calculations
medicineSchema.pre('save', function() {
  // 1. Calculate units per box
  if (['TABLET', 'CAPSULE'].includes(this.form)) {
     this.totalUnitsPerBox = (this.unitsPerPack || 1) * (this.stripsPerBox || 1);
  } else {
     this.totalUnitsPerBox = this.unitsPerPack || 1;
  }

  // 2. Set prescription flag
  if (['H', 'H1', 'X', 'G'].includes(this.schedule)) {
    this.isPrescriptionRequired = true;
  }

  // 3. Generate tags
  if (this.isModified('name') || this.isModified('genericName') || this.isNew) {
    const tags = new Set();
    
    // Add name words
    if (this.name) {
      this.name.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) tags.add(word);
      });
    }
    // Add generic name words
    if (this.genericName) {
      this.genericName.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) tags.add(word);
      });
    }
    // Add form
    if (this.form) tags.add(this.form.toLowerCase());
    // Add manufacturer
    if (this.manufacturer) tags.add(this.manufacturer.toLowerCase());
    
    this.tags = Array.from(tags);
  }
});

// Method to update sales stats
medicineSchema.methods.updateSalesStats = async function(unitsSold, revenue, profit, isPrescribed = false) {
  this.totalUnitsSold += unitsSold;
  this.totalRevenue += revenue;
  this.totalProfit += profit;
  
  // Update prescription ratio
  const totalSales = this.totalUnitsSold;
  const prescribedSales = Math.round(this.prescriptionRatio * (totalSales - unitsSold) / 100);
  const newPrescribed = isPrescribed ? prescribedSales + unitsSold : prescribedSales;
  this.prescriptionRatio = (newPrescribed / totalSales) * 100;
  
  await this.save();
};

// Static method to get top-selling medicines
medicineSchema.statics.getTopSelling = function(storeId, limit = 20) {
  return this.find({ medicalStoreId: storeId, isActive: true })
    .sort({ totalUnitsSold: -1 })
    .limit(limit)
    .select('name genericName dosage form totalUnitsSold totalRevenue totalProfit');
};

// Static method to get medicines by symptom
medicineSchema.statics.getBySymptom = function(storeId, symptomId) {
  return this.find({ 
    medicalStoreId: storeId, 
    symptomCategories: symptomId,
    isActive: true 
  })
    .sort({ totalUnitsSold: -1 })
    .select('name genericName dosage form defaultMRP defaultSellingPrice');
};

// Static method to search medicines
medicineSchema.statics.searchMedicines = function(storeId, searchTerm, limit = 20) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    medicalStoreId: storeId,
    isActive: true,
    $or: [
      { name: regex },
      { genericName: regex },
      { manufacturer: regex },
      { tags: regex }
    ]
  })
    .sort({ totalUnitsSold: -1 })
    .limit(limit)
    .select('name genericName dosage form defaultMRP defaultSellingPrice manufacturer');
};

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
