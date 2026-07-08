import mongoose from 'mongoose';

const salesVelocitySnapshotSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    unitsSold: {
      type: Number,
      required: true,
      default: 0,
    },
    unitsReturned: {
      type: Number,
      required: true,
      default: 0,
    },
    stockOnHandEnd: {
      type: Number,
      required: true,
      default: 0,
    },
    wasStockedOut: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index as per requirements
salesVelocitySnapshotSchema.index({ medicalStoreId: 1, medicineId: 1, date: 1 }, { unique: true });

const SalesVelocitySnapshot = mongoose.model('SalesVelocitySnapshot', salesVelocitySnapshotSchema);

export default SalesVelocitySnapshot;
