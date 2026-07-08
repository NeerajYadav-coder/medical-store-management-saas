import mongoose from "mongoose";
import dotenv from "dotenv";
import MedicalStore from "./models/MedicalStore.js";
import User from "./models/User.js";
import Sale from "./models/Sale.js";
import whatsappService from "./services/whatsapp.service.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const sales = await Sale.find().sort({ createdAt: -1 }).limit(5);
  for (const s of sales) {
     console.log("Sale ID:", s._id, "createdBy:", s.createdBy, "phone:", s.customerPhone);
  }
  
  process.exit(0);
}
run();
