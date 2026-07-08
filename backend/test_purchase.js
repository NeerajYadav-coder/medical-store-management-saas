import mongoose from 'mongoose';
import Purchase from './models/Purchase.js';
import connectDB from './config/db.js';

const test = async () => {
  await connectDB();
  try {
    const payload = {
      medicalStoreId: '60c72b2f9b1d8a25c8e39f33',
      supplierId: '60c72b2f9b1d8a25c8e39f34',
      supplierName: 'Test Supplier',
      supplierBillNumber: 'BILL123',
      supplierBillDate: new Date(),
      dueDate: '',
      items: []
    };
    
    // Just validation test
    const purchase = new Purchase(payload);
    await purchase.validate();
    console.log("Validation passed");
  } catch (err) {
    console.error("Validation failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

test();
