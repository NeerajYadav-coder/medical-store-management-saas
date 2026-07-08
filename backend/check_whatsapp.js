import mongoose from "mongoose";
import connectDB from "./config/db.js";
import WhatsAppSession from "./modules/whatsapp/models/WhatsAppSession.js";
import MedicalStore from "./models/MedicalStore.js";

const run = async () => {
  await connectDB();
  const sessions = await WhatsAppSession.find({});
  console.log("Sessions count:", sessions.length);
  for (const s of sessions) {
    console.log("Session:", {
      storeId: s.storeId,
      connected: s.connected,
      phoneNumber: s.phoneNumber,
      displayName: s.displayName
    });
  }
  const stores = await MedicalStore.find({});
  for (const store of stores) {
    console.log("Store:", store.name, "whatsappConfig:", store.whatsappConfig);
  }
  process.exit(0);
};

run();
