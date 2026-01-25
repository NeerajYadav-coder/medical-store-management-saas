import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    // Who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: [
        "SALE",
        "PURCHASE",
        "MEDICINE",
        "BATCH",
        "SUPPLIER",
        "CUSTOMER",
        "DISCOUNT_RULE",
      ],
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    beforeData: {
      type: Object,
    },

    afterData: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Index for fast audit search
auditLogSchema.index({
  medicalStoreId: 1,
  createdAt: -1,
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
