/**
 * models/SymptomCategory.js
 * 
 * Master list of symptoms/conditions.
 * Used to track WHY customers are buying medicines.
 * Future value: Know which painkiller to push when own-label launches.
 */

import mongoose from 'mongoose';

const symptomCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Symptom name is required'],
      trim: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '💊',
    },
    description: {
      type: String,
      trim: true,
    },
    // Quick suggestions - medicines commonly used for this symptom
    commonMedicineCategories: [{
      type: String,
      trim: true,
    }],
    // For UI - display order
    sortOrder: {
      type: Number,
      default: 0,
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
symptomCategorySchema.index({ name: 1 });
symptomCategorySchema.index({ isActive: 1, sortOrder: 1 });

// Static method to get all active symptoms
symptomCategorySchema.statics.getActiveSymptoms = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

const SymptomCategory = mongoose.model('SymptomCategory', symptomCategorySchema);

export default SymptomCategory;
