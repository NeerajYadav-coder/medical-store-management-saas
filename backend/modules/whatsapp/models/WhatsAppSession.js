import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      unique: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    displayName: {
      type: String,
      default: "",
    },
    sessionPath: {
      type: String,
      default: "",
    },
    connected: {
      type: Boolean,
      default: false,
    },
    connectedAt: {
      type: Date,
    },
    lastSeen: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const WhatsAppSession = mongoose.model("WhatsAppSession", whatsappSessionSchema);
export default WhatsAppSession;
