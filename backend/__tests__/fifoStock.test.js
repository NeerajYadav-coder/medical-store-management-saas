import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MedicineBatch from '../models/MedicineBatch.js';
import { deductStockFIFO } from '../utils/fifoStock.js';

let mongoServer;

describe('fifoStock Utility - Reliability & Data Integrity', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await MedicineBatch.deleteMany({});
  });

  it('should successfully deduct stock using FIFO and update quantitySold correctly (Data Integrity)', async () => {
    const storeId = new mongoose.Types.ObjectId();
    const medicineId = new mongoose.Types.ObjectId();

    // Create a batch with 10 items
    const batch = await MedicineBatch.create({
      medicalStoreId: storeId,
      medicineId: medicineId,
      batchNumber: 'B1',
      expiryDate: new Date(Date.now() + 100000000), // future
      mrp: 100,
      purchasePrice: 50,
      sellingPrice: 80,
      quantityReceived: 10,
      quantityRemaining: 10, // Pre-save hook will calculate this
      quantitySold: 0
    });

    // Deduct 4 items
    const result = await deductStockFIFO(medicineId, 4, storeId);

    expect(result.length).toBe(1);
    expect(result[0].quantityDeducted).toBe(4);

    // Fetch batch from DB to ensure it was saved correctly and pre-save hook didn't corrupt it
    const updatedBatch = await MedicineBatch.findById(batch._id);
    
    expect(updatedBatch.quantityRemaining).toBe(6);
    expect(updatedBatch.quantitySold).toBe(4);
  });

  it('should throw an error and rollback if requested quantity exceeds total available stock (Transaction integrity simulation)', async () => {
    const storeId = new mongoose.Types.ObjectId();
    const medicineId = new mongoose.Types.ObjectId();

    // Create a batch with 5 items
    const batch = await MedicineBatch.create({
      medicalStoreId: storeId,
      medicineId: medicineId,
      batchNumber: 'B1',
      expiryDate: new Date(Date.now() + 100000000),
      mrp: 100,
      purchasePrice: 50,
      sellingPrice: 80,
      quantityReceived: 5,
      quantityRemaining: 5,
      quantitySold: 0
    });

    // Try to deduct 10 items. This should throw.
    await expect(deductStockFIFO(medicineId, 10, storeId)).rejects.toThrow('Insufficient stock');
    
    // Check if the database was partially updated before the error was thrown!
    const updatedBatch = await MedicineBatch.findById(batch._id);
    
    // THIS EXPECTATION WILL FAIL UNLESS WE FIX THE TRANSACTION LOGIC!
    // With the new pre-flight plan/execute architecture, deductStockFIFO
    // executes getFifoDeductionPlan FIRST, which throws before any DB modifications.
    expect(updatedBatch.quantityRemaining).toBe(5);
    expect(updatedBatch.quantitySold).toBe(0);
  });
});
