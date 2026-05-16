
import mongoose from 'mongoose';
import User from './models/User.js';
import MedicalStore from './models/MedicalStore.js';
import { ROLE_PERMISSIONS } from './constants/permissions.js';
import dotenv from 'dotenv';

dotenv.config();

async function createBillingUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find first medical store
    const store = await MedicalStore.findOne();
    if (!store) {
      console.log('No medical store found');
      process.exit(1);
    }

    const email = 'billing@example.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists');
      process.exit(0);
    }

    const user = await User.create({
      name: 'Billing Staff',
      email: email,
      phone: '9000000001',
      passwordHash: 'password123', // Will be hashed by model
      role: 'STAFF',
      permissions: ROLE_PERMISSIONS.STAFF,
      medicalStoreId: store._id,
      isActive: true
    });

    console.log('Billing user created:', user.email);
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createBillingUser();
