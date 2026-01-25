import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
    },

    creditDays: {
      type: Number,
      default: 0, // 0 = CASH supplier
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Index for fast supplier lookup per store
supplierSchema.index({
  medicalStoreId: 1,
  name: 1,
});

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
