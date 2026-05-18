import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function check() {
  await mongoose.connect(uri);
  
  const MedicalStore = mongoose.model('MedicalStore', new mongoose.Schema({}, { strict: false }));
  const Medicine = mongoose.model('Medicine', new mongoose.Schema({}, { strict: false }));
  const MedicineBatch = mongoose.model('MedicineBatch', new mongoose.Schema({}, { strict: false }));
  
  // Find all stores to identify the user's store
  const stores = await MedicalStore.find();
  console.log(`Found ${stores.length} store(s) in the database.\n`);
  
  for (const store of stores) {
    console.log(`==========================================`);
    console.log(`Store Name: ${store.name}`);
    console.log(`Store ID: ${store._id}`);
    
    const medicines = await Medicine.find({ medicalStoreId: store._id });
    console.log(`Total Medicines Defined: ${medicines.length}`);
    
    if (medicines.length > 0) {
      console.log(`\nMedicine List:`);
      for (const med of medicines) {
        const batches = await MedicineBatch.find({ medicineId: med._id });
        const totalStock = batches.reduce((sum, b) => sum + (b.quantityRemaining || 0), 0);
        console.log(` - ${med.name} (Dosage: ${med.dosage || 'N/A'}, Form: ${med.form}) | Total Stock: ${totalStock} | Batches: ${batches.length}`);
      }
    }
    console.log(`==========================================\n`);
  }
  
  mongoose.disconnect();
}
check();
