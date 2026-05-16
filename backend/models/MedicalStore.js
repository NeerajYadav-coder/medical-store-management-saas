import mongoose from "mongoose";

const medicalStoreSchema = new mongoose.Schema(
  {
    // Basic identity
    name: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact & legal info
    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
    },

    address: {
      type: String,
      required: true,
    },

    // Drug license details (VERY important in India)
    drugLicenseNumber: {
      type: String,
      required: true,
      unique: true,
    },

    gstNumber: {
      type: String,
      unique: true,
      sparse: true, // allows null but unique if present
    },

    // System control
    isActive: {
      type: Boolean,
      default: true,
    },

    // Who created this store (OWNER user)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// Indexes for performance & safety
medicalStoreSchema.index({ name: 1 });
medicalStoreSchema.index({ drugLicenseNumber: 1 });

const MedicalStore = mongoose.model("MedicalStore", medicalStoreSchema);

export default MedicalStore;
