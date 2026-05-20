import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Medicine from './models/Medicine.js';
import MedicineBatch from './models/MedicineBatch.js';
import User from './models/User.js';
import Purchase from './models/Purchase.js';
import PurchaseItem from './models/PurchaseItem.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medicalsaas';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const medicines = await Medicine.find({ name: /parac/i });
    console.log(`\nFound ${medicines.length} medicines matching "parac":`);
    
    for (const med of medicines) {
      console.log(`\n------------------------------------------------`);
      console.log(`MEDICINE:`);
      console.log(`  ID: ${med._id}`);
      console.log(`  MedicalStoreId: ${med.medicalStoreId}`);
      console.log(`  Name: ${med.name}`);
      console.log(`  Dosage: ${med.dosage}`);
      console.log(`  Form: ${med.form}`);
      console.log(`  Active: ${med.isActive}`);
      
      const batches = await MedicineBatch.find({ medicineId: med._id });
      console.log(`BATCHES (${batches.length}):`);
      for (const b of batches) {
        console.log(`  - Batch No: ${b.batchNumber}`);
        console.log(`    Qty Received: ${b.quantityReceived}`);
        console.log(`    Qty Remaining: ${b.quantityRemaining}`);
        console.log(`    Expiry: ${b.expiryDate}`);
        console.log(`    Status: ${b.status}`);
        console.log(`    IsActive: ${b.isActive}`);
      }
    }
    const purchases = await mongoose.model('Purchase').find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`\nRecent Purchases (${purchases.length}):`);
    for (const p of purchases) {
      console.log(`  - ID: ${p._id}, StoreId: ${p.medicalStoreId}, Supplier: ${p.supplierName}, Bill: ${p.supplierBillNumber}, Total: ${p.grandTotal}, CreatedAt: ${p.createdAt}`);
      const items = await mongoose.model('PurchaseItem').find({ purchaseId: p._id });
      for (const i of items) {
        console.log(`    * Item: ${i.medicineName}, Qty: ${i.quantity}, TotalQty: ${i.totalQuantity}, Batch: ${i.batchNumber}`);
      }
    }
  } catch (error) {
    console.error('Error running check:', error);
  } finally {
    await mongoose.disconnect();
  }
}

check();
