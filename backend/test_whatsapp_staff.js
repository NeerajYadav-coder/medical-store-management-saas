import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import MedicalStore from "./models/MedicalStore.js";
import User from "./models/User.js";
import Sale from "./models/Sale.js";
import whatsappService from "./services/whatsapp.service.js";

dotenv.config({ path: resolve(process.cwd(), "backend", ".env") });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");
  
  const staffUsers = await User.find({ role: "STAFF" });
  console.log("Found staff users:", staffUsers.map(u => u._id));
  
  const sale = await Sale.findOne({ billedBy: { $in: staffUsers.map(u => u._id) } });
  if (sale) {
    console.log("Testing WhatsApp receipt for staff sale ID:", sale._id);
    try {
      const result = await whatsappService.sendPurchaseReceipt(sale._id);
      console.log("Result:", result);
    } catch (e) {
      console.error("Error:", e);
    }
  } else {
    console.log("No staff sale found. Testing with latest sale.");
    const anySale = await Sale.findOne().sort({ createdAt: -1 });
    if (anySale) {
      try {
        const result = await whatsappService.sendPurchaseReceipt(anySale._id);
        console.log("Result for latest sale:", result);
      } catch (e) {
        console.error("Error:", e);
      }
    }
  }
  
  process.exit(0);
}
run();
