import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import MedicalStore from "./models/MedicalStore.js";

const run = async () => {
  await connectDB();
  const store = await MedicalStore.findById("6a4103e4182c730877ebb16f");
  console.log("Store:", store);
  const u = await User.findOne({ medicalStoreId: "6a4103e4182c730877ebb16f", role: "OWNER" });
  console.log("Owner User:", u);
  process.exit(0);
};

run();
