import { activeSockets } from "./modules/whatsapp/services/BaileysProvider.js";
import connectDB from "./config/db.js";
import WhatsAppSession from "./modules/whatsapp/models/WhatsAppSession.js";

const run = async () => {
  await connectDB();
  const session = await WhatsAppSession.findOne({ connected: true });
  if (!session) {
    console.log("No connected session in DB");
  } else {
    console.log("DB Session:", session);
    const socket = activeSockets.get(session.storeId.toString());
    console.log("Active socket exists in memory:", !!socket);
    if (socket) {
      console.log("Socket connection state:", socket.ws?.readyState);
    }
  }
  process.exit(0);
};

run();
