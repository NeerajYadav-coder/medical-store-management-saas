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
      enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Sometimes ID might not be available immediately or valid
      index: true,
    },

    // Flexible details field for any extra info (old/new values)
    details: {
      type: Object,
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
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
