import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function check() {
  await mongoose.connect(uri);
  
  const Medicine = mongoose.model('Medicine', new mongoose.Schema({}, { strict: false }));
  const MedicineBatch = mongoose.model('MedicineBatch', new mongoose.Schema({}, { strict: false }));
  
  const meds = await Medicine.find({ name: /paracitamol/i });
  console.log('Medicines found:', meds);
  
  if (meds.length > 0) {
    for (const med of meds) {
      const batches = await MedicineBatch.find({ medicineId: med._id });
      console.log(`Batches for ${med.name} (${med._id}):`, batches);
    }
  } else {
    const allMeds = await Medicine.find().limit(5);
    console.log('No paracitamol found. Some other meds:', allMeds.map(m => m.name));
  }
  
  mongoose.disconnect();
}
check();
