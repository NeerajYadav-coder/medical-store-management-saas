import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    // Multi-tenant safety
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    // Medicine identity
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dosage: {
      type: String,
      required: true, // e.g. 500mg, 10ml
      trim: true,
    },

    form: {
      type: String,
      enum: ["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "DROPS"],
      required: true,
    },

    unitType: {
      type: String,
      enum: ["TABLET", "CAPSULE", "BOTTLE", "VIAL", "TUBE"],
      required: true,
    },

    // Pricing reference (can change in batches)
    mrpPerUnit: {
      type: Number,
      required: true,
    },

    unitSellingPrice: {
      type: Number,
      required: true,
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

// Prevent duplicate medicine in same store
medicineSchema.index(
  { medicalStoreId: 1, name: 1, dosage: 1, form: 1 },
  { unique: true }
);

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
