import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function check() {
  await mongoose.connect(uri);
  
  const Purchase = mongoose.model('Purchase', new mongoose.Schema({}, { strict: false }));
  const MedicineBatch = mongoose.model('MedicineBatch', new mongoose.Schema({}, { strict: false }));
  
  const purchases = await Purchase.find().sort({createdAt: -1});
  console.log(`Found ${purchases.length} total purchases.`);
  if (purchases.length > 0) {
    console.log('Latest purchase:', purchases[0]);
  }
  
  const batches = await MedicineBatch.find().sort({createdAt: -1});
  console.log(`Found ${batches.length} total batches.`);
  if (batches.length > 0) {
    console.log('Latest batch:', batches[0]);
  }
  
  mongoose.disconnect();
}
check();
