
import mongoose from 'mongoose';
import env from './config/env.js';
import Medicine from './models/Medicine.js';
import MedicineBatch from './models/MedicineBatch.js';
import MedicalStore from './models/MedicalStore.js';
import SymptomCategory from './models/SymptomCategory.js';
import Doctor from './models/Doctor.js';
import Customer from './models/Customer.js';

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to DB');

  let store = await MedicalStore.findOne({ name: 'neerajPharmacy' });
  if (!store) {
     store = await MedicalStore.findOne().sort({ createdAt: -1 });
  }

  if (!store) {
    console.log('No store found');
    process.exit(1);
  }

  console.log('Seeding data for store:', store.name, store._id);

  // 1. Seed Symptoms (Master Data)
  const symptomsData = [
    { name: 'fever', displayName: 'Fever', icon: '🌡️', sortOrder: 1 },
    { name: 'cough', displayName: 'Cough', icon: '😫', sortOrder: 2 },
    { name: 'cold', displayName: 'Cold & Flu', icon: '🤧', sortOrder: 3 },
    { name: 'headache', displayName: 'Headache', icon: '💆', sortOrder: 4 },
    { name: 'stomach_ache', displayName: 'Stomach Ache', icon: '🤢', sortOrder: 5 },
    { name: 'body_pain', displayName: 'Body Pain', icon: '🤕', sortOrder: 6 },
    { name: 'allergy', displayName: 'Allergy', icon: '🌸', sortOrder: 7 },
  ];

  for (const s of symptomsData) {
    await SymptomCategory.findOneAndUpdate(
      { name: s.name },
      s,
      { upsert: true, new: true }
    );
  }
  console.log('Symptoms seeded');

  // 2. Seed Medicines & Batches
  const medicinesData = [
    {
      name: 'Crocin Advance',
      genericName: 'Paracetamol',
      dosage: '500mg',
      form: 'TABLET',
      unitType: 'STRIP',
      unitsPerPack: 15,
      manufacturer: 'GSK',
      defaultMRP: 30,
      defaultSellingPrice: 28,
      defaultPurchasePrice: 15,
      symptomNames: ['fever', 'headache', 'body_pain']
    },
    {
      name: 'Dolo 650',
      genericName: 'Paracetamol',
      dosage: '650mg',
      form: 'TABLET',
      unitType: 'STRIP',
      unitsPerPack: 15,
      manufacturer: 'Micro Labs',
      defaultMRP: 35,
      defaultSellingPrice: 32,
      defaultPurchasePrice: 18,
      symptomNames: ['fever', 'body_pain']
    },
    {
      name: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      dosage: '625mg',
      form: 'TABLET',
      unitType: 'STRIP',
      unitsPerPack: 10,
      manufacturer: 'GSK',
      defaultMRP: 220,
      defaultSellingPrice: 200,
      defaultPurchasePrice: 140,
    },
    {
      name: 'Benadryl DR',
      genericName: 'Dextromethorphan',
      dosage: '100ml',
      form: 'SYRUP',
      unitType: 'BOTTLE',
      unitsPerPack: 1,
      manufacturer: 'Johnson & Johnson',
      defaultMRP: 115,
      defaultSellingPrice: 105,
      defaultPurchasePrice: 70,
      symptomNames: ['cough']
    },
    {
      name: 'Cetrizine',
      genericName: 'Cetirizine Hydrochloride',
      dosage: '10mg',
      form: 'TABLET',
      unitType: 'STRIP',
      unitsPerPack: 10,
      manufacturer: 'Cipla',
      defaultMRP: 18,
      defaultSellingPrice: 15,
      defaultPurchasePrice: 8,
      symptomNames: ['allergy', 'cold']
    },
    {
      name: 'Digene',
      genericName: 'Magnesium Hydroxide + Aluminium Hydroxide',
      dosage: '200ml',
      form: 'SYRUP',
      unitType: 'BOTTLE',
      unitsPerPack: 1,
      manufacturer: 'Abbott',
      defaultMRP: 145,
      defaultSellingPrice: 130,
      defaultPurchasePrice: 90,
      symptomNames: ['stomach_ache']
    }
  ];

  for (const medData of medicinesData) {
    let medicine = await Medicine.findOne({ 
      medicalStoreId: store._id, 
      name: medData.name, 
      dosage: medData.dosage 
    });

    if (!medicine) {
      medicine = await Medicine.create({
        ...medData,
        medicalStoreId: store._id,
      });
      console.log('Created medicine:', medicine.name);
    }

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1 + Math.floor(Math.random() * 2));

    await MedicineBatch.create({
      medicalStoreId: store._id,
      medicineId: medicine._id,
      medicineName: medicine.name,
      batchNumber: 'BT' + Math.floor(Math.random() * 100000),
      expiryDate: expiry,
      mrp: medicine.defaultMRP,
      sellingPrice: medicine.defaultSellingPrice,
      purchasePrice: medicine.defaultPurchasePrice,
      quantityReceived: 50,
      quantityRemaining: 50,
      status: 'ACTIVE',
      isActive: true,
    });
  }
  console.log('Medicines & Batches seeded');

  // 3. Seed Doctors
  const doctorsData = [
    { name: 'Dr. Sharma', specialization: 'General Physician', clinic: 'Sharma Clinic', phone: '9876543211' },
    { name: 'Dr. Verma', specialization: 'Pediatrician', clinic: 'Child Care Center', phone: '9876543212' },
    { name: 'Dr. Iyer', specialization: 'ENT Specialist', clinic: 'City Hospital', phone: '9876543213' },
  ];

  for (const d of doctorsData) {
    await Doctor.findOneAndUpdate(
      { medicalStoreId: store._id, name: d.name },
      { ...d, medicalStoreId: store._id },
      { upsert: true, new: true }
    );
  }
  console.log('Doctors seeded');

  // 4. Seed Customers
  const customersData = [
    { name: 'Rajesh Kumar', phone: '9000010001', address: { city: 'Agra' } },
    { name: 'Anjali Gupta', phone: '9000010002', address: { city: 'Agra' } },
    { name: 'Suresh Raina', phone: '9000010003', address: { city: 'Agra' } },
  ];

  for (const c of customersData) {
    await Customer.findOneAndUpdate(
      { medicalStoreId: store._id, phone: c.phone },
      { ...c, medicalStoreId: store._id },
      { upsert: true, new: true }
    );
  }
  console.log('Customers seeded');

  console.log('All data seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(console.error);
