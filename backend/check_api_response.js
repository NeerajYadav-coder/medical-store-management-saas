import connectDB from "./config/db.js";
import { getStatus } from "./modules/whatsapp/controllers/whatsapp.controller.js";
import MedicalStore from "./models/MedicalStore.js";

const run = async () => {
  await connectDB();
  
  const req = {
    user: {
      medicalStoreId: "6a4103e4182c730877ebb16f"
    }
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      console.log("Response Code:", this.statusCode);
      console.log("Response Data:", JSON.stringify(data, null, 2));
    }
  };

  await getStatus(req, res, (err) => console.error(err));
  process.exit(0);
};

run();
