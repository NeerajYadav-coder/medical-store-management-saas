
import mongoose from 'mongoose';
import env from './config/env.js';

async function drop() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to DB');

  try {
    await mongoose.connection.collection('medicines').dropIndexes();
    console.log('Dropped all indexes for medicines');
  } catch (e) {
    console.log('Error dropping indexes (maybe collection doesnt exist):', e.message);
  }

  await mongoose.disconnect();
}

drop().catch(console.error);
