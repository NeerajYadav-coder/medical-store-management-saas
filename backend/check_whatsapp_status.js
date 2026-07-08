import connectDB from "./config/db.js";
import WhatsAppSession from "./modules/whatsapp/models/WhatsAppSession.js";
import MedicalStore from "./models/MedicalStore.js";

const run = async () => {
  await connectDB();
  const sessions = await WhatsAppSession.find({});
  console.log("SESSIONS IN DB:");
  console.log(JSON.stringify(sessions, null, 2));

  const stores = await MedicalStore.find({ "whatsappConfig.connected": true });
  console.log("CONNECTED STORES IN DB:");
  console.log(JSON.stringify(stores.map(s => ({ id: s._id, name: s.name, config: s.whatsappConfig })), null, 2));

  process.exit(0);
};

run();
