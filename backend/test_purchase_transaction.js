import mongoose from 'mongoose';
import Purchase from './models/Purchase.js';
import PurchaseItem from './models/PurchaseItem.js';
import MedicineBatch from './models/MedicineBatch.js';
import Medicine from './models/Medicine.js';
import Supplier from './models/Supplier.js';
import User from './models/User.js';
import connectDB from './config/db.js';

const test = async () => {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findOne();
    const supplier = await Supplier.findOne();
    const medicine = await Medicine.findOne();

    if (!user || !supplier || !medicine) {
      console.error("Missing mock data");
      return;
    }

    const payload = {
      supplierId: supplier._id.toString(),
      supplierName: supplier.name,
      supplierBillNumber: 'BILL' + Math.random(),
      supplierBillDate: new Date().toISOString().split('T')[0],
      dueDate: '', // empty string
      items: [
        {
          medicineId: medicine._id.toString(),
          medicineName: medicine.name,
          batchNumber: 'B' + Math.random().toString(36).substring(7).toUpperCase(),
          expiryDate: '2027-12-31',
          manufacturingDate: '', // empty string
          quantity: 5,
          freeQuantity: 0,
          unitsPerPack: 10,
          purchasePrice: 150, // Pack purchase price = 150 (per unit = 15)
          mrp: 100, // Pack MRP = 100 (per unit = 10)
          // sellingPrice is omitted to simulate fallback to mrp
          gstRate: 12,
          discountPercent: 0,
          subtotal: 500,
          taxAmount: 60,
          totalAmount: 560,
          margin: 40
        }
      ],
      subtotal: 500,
      discountAmount: 0,
      taxableAmount: 500,
      totalGst: 60,
      roundOff: 0,
      grandTotal: 560,
      amountPaid: 0,
      paymentStatus: 'PENDING',
      notes: ''
    };

    const {
      supplierId,
      supplierName,
      supplierBillNumber,
      supplierBillDate,
      items,
      subtotal,
      discountAmount,
      taxableAmount,
      totalGst,
      roundOff,
      grandTotal,
      amountPaid,
      paymentStatus,
      dueDate,
      notes,
    } = payload;

    const purchase = await Purchase.create([{
      medicalStoreId: user.medicalStoreId,
      supplierId,
      supplierName,
      supplierBillNumber,
      supplierBillDate,
      totalItems: items.length,
      subtotal,
      discountAmount,
      taxableAmount,
      totalGst,
      cgst: totalGst / 2,
      sgst: totalGst / 2,
      igst: 0,
      roundOff,
      grandTotal,
      amountPaid,
      paymentStatus,
      dueDate,
      balanceAmount: grandTotal - amountPaid,
      receivedBy: user._id,
      receivedByName: user.name,
      notes,
    }], { session });

    for (const item of items) {
      let batch = await MedicineBatch.findOne({
        medicalStoreId: user.medicalStoreId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
      }).session(session);

      if (batch) {
        // ...
      } else {
        const totalUnits = (item.quantity + (item.freeQuantity || 0)) * (item.unitsPerPack || 1);
        const perUnitPurchasePrice = item.purchasePrice / (item.unitsPerPack || 1);
        const perUnitMRP = item.mrp / (item.unitsPerPack || 1);
        const perUnitSellingPrice = item.sellingPrice || perUnitMRP;

        batch = await MedicineBatch.create([{
          medicalStoreId: user.medicalStoreId,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          manufacturingDate: item.manufacturingDate,
          quantityReceived: totalUnits,
          quantityRemaining: totalUnits,
          purchasePrice: perUnitPurchasePrice, 
          sellingPrice: perUnitSellingPrice, 
          mrp: perUnitMRP,
          supplierId,
          supplierName,
        }], { session });
          batch = batch[0];
      }
    }

    await session.commitTransaction();
    console.log("Transaction successfully committed!");
  } catch (err) {
    await session.abortTransaction();
    console.error("Transaction failed:", err);
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
};

test();
