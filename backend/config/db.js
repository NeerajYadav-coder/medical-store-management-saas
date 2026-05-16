/**
 * config/db.js
 *
 * Responsibility:
 * - Establish MongoDB connection
 * - Handle connection lifecycle events
 * - Fail fast if DB is unreachable
 *
 * This file is imported ONCE in server.js
 */

import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: false,          // Indexes are defined at schema level
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    /**
     * Connection event listeners
     * Important for production visibility
     */
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB runtime error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('MongoDB connection failed');
    console.error(error.message);
    process.exit(1); // Unsafe to continue without DB
  }
};

export default connectDB;
