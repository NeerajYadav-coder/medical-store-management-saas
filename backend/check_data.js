
import mongoose from 'mongoose';
import env from './config/env.js';
import Medicine from './models/Medicine.js';
import MedicineBatch from './models/MedicineBatch.js';
import User from './models/User.js';
import MedicalStore from './models/MedicalStore.js';
import SymptomCategory from './models/SymptomCategory.js';
import Doctor from './models/Doctor.js';
import Customer from './models/Customer.js';

async function check() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to DB');

  const store = await MedicalStore.findOne({ name: 'neerajPharmacy' });
  if (!store) {
    console.log('neerajPharmacy store not found');
    await mongoose.disconnect();
    return;
  }
  const storeId = store._id;
  console.log('Checking data for store:', store.name, storeId);

  const medicines = await Medicine.find({ medicalStoreId: storeId });
  console.log('Medicines:', medicines.length);

  const batches = await MedicineBatch.find({ medicalStoreId: storeId, quantityRemaining: { $gt: 0 } });
  console.log('Active Batches:', batches.length);

  const symptoms = await SymptomCategory.find({ medicalStoreId: storeId });
  console.log('Symptoms:', symptoms.length);
  symptoms.forEach(s => console.log(`- ${s.name}`));

  const doctors = await Doctor.find({ medicalStoreId: storeId });
  console.log('Doctors:', doctors.length);
  doctors.forEach(d => console.log(`- ${d.name} (${d.specialization})`));

  const customers = await Customer.find({ medicalStoreId: storeId });
  console.log('Customers:', customers.length);
  customers.forEach(c => console.log(`- ${c.name} (${c.phone})`));

  await mongoose.disconnect();
}

check().catch(console.error);
