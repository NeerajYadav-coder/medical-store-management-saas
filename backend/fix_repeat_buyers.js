import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "./models/Customer.js";

dotenv.config();

const fixCustomers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const customers = await Customer.find({});
    let modified = 0;

    for (const c of customers) {
      let changed = false;

      // Fix average order value
      if (c.totalPurchases > 0) {
        const avg = c.totalSpent / c.totalPurchases;
        if (c.avgOrderValue !== avg) {
          c.avgOrderValue = avg;
          changed = true;
        }
      }

      // Fix repeat buyer (4+)
      if (c.totalPurchases >= 4 && !c.isRepeatBuyer) {
        c.isRepeatBuyer = true;
        changed = true;
      } else if (c.totalPurchases < 4 && c.isRepeatBuyer) {
        c.isRepeatBuyer = false;
        changed = true;
      }

      if (changed) {
        await c.save();
        modified++;
      }
    }

    console.log(`Updated ${modified} customers.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixCustomers();
