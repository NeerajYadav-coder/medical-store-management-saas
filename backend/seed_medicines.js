import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

const meds = [
  { name: 'Amoxil 500', genericName: 'Amoxicillin', dosage: '500mg', form: 'CAPSULE', unitType: 'STRIP', unitsPerPack: 10, stripsPerBox: 10, manufacturer: 'GlaxoSmithKline', gstRate: 12, schedule: 'H', defaultMRP: 120, defaultSellingPrice: 110, defaultPurchasePrice: 80, reorderLevel: 50 },
  { name: 'Azithral 500', genericName: 'Azithromycin', dosage: '500mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 5, stripsPerBox: 10, manufacturer: 'Alembic', gstRate: 12, schedule: 'H', defaultMRP: 130, defaultSellingPrice: 120, defaultPurchasePrice: 90, reorderLevel: 20 },
  { name: 'Cetzine 10', genericName: 'Cetirizine', dosage: '10mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 10, stripsPerBox: 10, manufacturer: 'Dr. Reddy', gstRate: 12, schedule: 'OTC', defaultMRP: 20, defaultSellingPrice: 18, defaultPurchasePrice: 12, reorderLevel: 100 },
  { name: 'Pan 40', genericName: 'Pantoprazole', dosage: '40mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 15, stripsPerBox: 10, manufacturer: 'Alkem', gstRate: 12, schedule: 'H', defaultMRP: 150, defaultSellingPrice: 140, defaultPurchasePrice: 100, reorderLevel: 50 },
  { name: 'Voveran SR 100', genericName: 'Diclofenac', dosage: '100mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 15, stripsPerBox: 10, manufacturer: 'Novartis', gstRate: 12, schedule: 'H', defaultMRP: 180, defaultSellingPrice: 170, defaultPurchasePrice: 120, reorderLevel: 30 },
  { name: 'Glycomet 500', genericName: 'Metformin', dosage: '500mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 10, stripsPerBox: 20, manufacturer: 'USV', gstRate: 12, schedule: 'H', defaultMRP: 25, defaultSellingPrice: 22, defaultPurchasePrice: 15, reorderLevel: 200 },
  { name: 'Amlokind 5', genericName: 'Amlodipine', dosage: '5mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 15, stripsPerBox: 10, manufacturer: 'Mankind', gstRate: 12, schedule: 'H', defaultMRP: 30, defaultSellingPrice: 25, defaultPurchasePrice: 18, reorderLevel: 100 },
  { name: 'Storvas 20', genericName: 'Atorvastatin', dosage: '20mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 15, stripsPerBox: 10, manufacturer: 'Sun Pharma', gstRate: 12, schedule: 'H', defaultMRP: 160, defaultSellingPrice: 150, defaultPurchasePrice: 110, reorderLevel: 40 },
  { name: 'Levocet 5', genericName: 'Levocetirizine', dosage: '5mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 10, stripsPerBox: 10, manufacturer: 'Cipla', gstRate: 12, schedule: 'OTC', defaultMRP: 40, defaultSellingPrice: 35, defaultPurchasePrice: 20, reorderLevel: 80 },
  { name: 'Zenflox 200', genericName: 'Ofloxacin', dosage: '200mg', form: 'TABLET', unitType: 'STRIP', unitsPerPack: 10, stripsPerBox: 10, manufacturer: 'Mankind', gstRate: 12, schedule: 'H', defaultMRP: 75, defaultSellingPrice: 70, defaultPurchasePrice: 50, reorderLevel: 60 }
];

async function seed() {
  await mongoose.connect(uri);
  const MedicalStore = mongoose.model('MedicalStore', new mongoose.Schema({}, { strict: false }));
  const Medicine = mongoose.model('Medicine', new mongoose.Schema({
    medicalStoreId: mongoose.Schema.Types.ObjectId,
    name: String, genericName: String, dosage: String, form: String, unitType: String,
    unitsPerPack: Number, stripsPerBox: Number, totalUnitsPerBox: Number, manufacturer: String,
    isPrescriptionRequired: Boolean, gstRate: Number, schedule: String, defaultMRP: Number,
    defaultSellingPrice: Number, defaultPurchasePrice: Number, reorderLevel: Number, isActive: Boolean
  }, { strict: false, timestamps: true }));
  
  const MedicineBatch = mongoose.model('MedicineBatch', new mongoose.Schema({
    medicalStoreId: mongoose.Schema.Types.ObjectId,
    medicineId: mongoose.Schema.Types.ObjectId,
    medicineName: String, batchNumber: String, expiryDate: Date,
    mrp: Number, purchasePrice: Number, sellingPrice: Number,
    quantityReceived: Number, quantityRemaining: Number,
    isActive: Boolean, status: String, receivedAt: Date
  }, { strict: false, timestamps: true }));

  const storeId = new mongoose.Types.ObjectId('6a0848a73d42833e788d8ccf');
  
  for (const m of meds) {
    const med = await Medicine.create({
      medicalStoreId: storeId,
      ...m,
      totalUnitsPerBox: m.unitsPerPack * m.stripsPerBox,
      isPrescriptionRequired: m.schedule !== 'OTC',
      isActive: true
    });
    
    // Create an active batch with 500 units of stock
    const batchExpiry = new Date();
    batchExpiry.setFullYear(batchExpiry.getFullYear() + 2); // Expiry in 2 years
    
    await MedicineBatch.create({
      medicalStoreId: storeId,
      medicineId: med._id,
      medicineName: med.name,
      batchNumber: `BT-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
      expiryDate: batchExpiry,
      mrp: m.defaultMRP,
      sellingPrice: m.defaultSellingPrice,
      purchasePrice: m.defaultPurchasePrice,
      quantityReceived: 500, // units
      quantityRemaining: 500, // units
      isActive: true,
      status: 'ACTIVE',
      receivedAt: new Date()
    });
  }
  
  console.log('✅ Successfully seeded 10 medicines with stock (batches)!');
  mongoose.disconnect();
}
seed();
