import Purchase from "../models/Purchase.js";
import PurchaseItem from "../models/PurchaseItem.js";
import Supplier from "../models/Supplier.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";

/**
 * CREATE PURCHASE
 * OWNER / STAFF
 */
export const createPurchase = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const { supplierId, invoiceNumber, invoiceDate, totalAmount, paymentType, paymentDueDate, status, items } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier and items are required",
      });
    }

    // Validate supplier belongs to this store
    const supplier = await Supplier.findOne({ _id: supplierId, medicalStoreId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // Create purchase
    const purchase = await Purchase.create({
      medicalStoreId,
      supplierId,
      invoiceNumber,
      invoiceDate,
      totalAmount,
      paymentType,
      paymentDueDate,
      status,
    });

    // Create purchase items & batches
    for (let item of items) {
      const { medicineId, batchNumber, expiryDate, purchasePrice, sellingPrice, quantity } = item;

      // Validate medicine belongs to store
      const medicine = await Medicine.findOne({ _id: medicineId, medicalStoreId });
      if (!medicine) continue; // skip invalid medicine

      // Create batch for this purchase
      const batch = await MedicineBatch.create({
        medicalStoreId,
        medicineId,
        batchNumber,
        purchaseId: purchase._id,
        expiryDate,
        purchasePricePerUnit: purchasePrice,
        sellingPricePerUnit: sellingPrice,
        quantityReceived: quantity,
        quantityRemaining: quantity,
        receivedAt: new Date(),
      });

      // Create purchase item
      await PurchaseItem.create({
        purchaseId: purchase._id,
        medicineId,
        batchId: batch._id,
        quantity,
        purchasePricePerUnit: purchasePrice,
      });
    }

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      purchaseId: purchase._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL PURCHASES
 */
export const getAllPurchases = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;

    const purchases = await Purchase.find({ medicalStoreId })
      .populate("supplierId", "name phone email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE PURCHASE
 */
export const getSinglePurchase = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const purchaseId = req.params.id;

    const purchase = await Purchase.findOne({ _id: purchaseId, medicalStoreId })
      .populate("supplierId", "name phone email");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const items = await PurchaseItem.find({ purchaseId: purchase._id })
      .populate("medicineId", "name dosage form");

    res.status(200).json({
      success: true,
      purchase,
      items,
    });
  } catch (error) {
    next(error);
  }
};
