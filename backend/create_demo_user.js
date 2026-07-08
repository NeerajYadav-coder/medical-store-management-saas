import mongoose from 'mongoose';
import env from './config/env.js';
import User from './models/User.js';
import MedicalStore from './models/MedicalStore.js';
import SymptomCategory from './models/SymptomCategory.js';
import Medicine from './models/Medicine.js';
import MedicineBatch from './models/MedicineBatch.js';
import Doctor from './models/Doctor.js';
import Customer from './models/Customer.js';
import { ROLE_PERMISSIONS } from './constants/permissions.js';
import { ROLES } from './constants/roles.js';

async function setupDemo() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Create or get Medical Store
    let store = await MedicalStore.findOne({ email: 'demo@medstore.com' });
    if (!store) {
      store = await MedicalStore.create({
        name: 'Demo MedStore',
        ownerName: 'Demo Owner',
        phone: '+919999999999',
        email: 'demo@medstore.com',
        address: '123 Health Street, Medical City',
        drugLicenseNumber: 'DL-DEMO-12345',
        gstNumber: 'GST-DEMO-12345',
        plan: 'PREMIUM',
        isActive: true,
      });
      console.log('Created Demo Medical Store:', store.name);
    } else {
      console.log('Demo Medical Store already exists:', store.name);
    }

    // 2. Create or update Demo Owner User
    let owner = await User.findOne({ email: 'demo@medstore.com' });
    if (owner) {
      console.log('Demo user already exists. Updating password and details...');
      owner.name = 'Demo Owner';
      owner.phone = '+919999999999';
      owner.passwordHash = 'Demo@123'; // Will be hashed by pre-save hook
      owner.role = ROLES.OWNER;
      owner.permissions = ROLE_PERMISSIONS.OWNER;
      owner.medicalStoreId = store._id;
      owner.isActive = true;
      await owner.save();
      console.log('Updated Demo Owner User');
    } else {
      owner = await User.create({
        name: 'Demo Owner',
        email: 'demo@medstore.com',
        phone: '+919999999999',
        passwordHash: 'Demo@123', // Will be hashed by pre-save hook
        role: ROLES.OWNER,
        permissions: ROLE_PERMISSIONS.OWNER,
        medicalStoreId: store._id,
        isActive: true,
      });
      console.log('Created Demo Owner User');
    }

    // Link store back to owner
    store.createdBy = owner._id;
    await store.save();

    // 3. Seed Symptoms (Master Data / Store specific)
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

    // 4. Seed Medicines & Batches for Demo Store
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

      // Check if active batches exist for this medicine in demo store
      const existingBatch = await MedicineBatch.findOne({
        medicalStoreId: store._id,
        medicineId: medicine._id,
        quantityRemaining: { $gt: 0 }
      });

      if (!existingBatch) {
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
          quantityReceived: 100,
          quantityRemaining: 100,
          status: 'ACTIVE',
          isActive: true,
        });
        console.log('Created active batch for:', medicine.name);
      }
    }
    console.log('Medicines & Batches seeded');

    // 5. Seed Doctors
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

    // 6. Seed Customers
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

    console.log('Demo setup completed successfully!');
  } catch (error) {
    console.error('Error during demo setup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupDemo();
