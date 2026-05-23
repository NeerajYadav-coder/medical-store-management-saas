import mongoose from "mongoose";

const whatsappMessageSchema = new mongoose.Schema(
  {
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientPhone: {
      type: String,
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["DAILY_REPORT", "PURCHASE_RECEIPT", "REFILL_REMINDER", "PROMOTION"],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "SIMULATED"],
      default: "SIMULATED",
    },
    errorMessage: {
      type: String,
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

// Index for query optimization
whatsappMessageSchema.index({ medicalStoreId: 1, createdAt: -1 });

const WhatsAppMessage = mongoose.model("WhatsAppMessage", whatsappMessageSchema);
export default WhatsAppMessage;
