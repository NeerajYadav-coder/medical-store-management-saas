import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Customer from "../models/Customer.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Medicine from "../models/Medicine.js";
import { getFifoDeductionPlan, executeFifoDeductionPlan } from "../utils/fifoStock.js";
import { calculateProfit } from "../utils/profitCalc.js";
import { calculateAutoDiscount } from "../utils/discountCalc.js";

/**
 * CREATE SALE
 * OWNER / STAFF
 */
export const createSale = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const { customerId, items, manualDiscount = 0, paymentMode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale items are required",
      });
    }

    if (manualDiscount < 0) {
      return res.status(400).json({ success: false, message: "Discount cannot be negative" });
    }

    if (!paymentMode) {
      return res.status(400).json({ success: false, message: "Payment mode is required" });
    }

    for (const item of items) {
      if (!item.medicineId || typeof item.quantity !== 'number' || typeof item.sellingPricePerUnit !== 'number') {
        return res.status(400).json({ success: false, message: "Invalid item format. medicineId, quantity, and sellingPricePerUnit (numbers) are required." });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Quantity must be greater than zero." });
      }
      if (item.sellingPricePerUnit < 0) {
        return res.status(400).json({ success: false, message: "Selling price cannot be negative." });
      }
    }

    // Compute total & auto discount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.sellingPricePerUnit;
    }

    // Auto discount (if manual not provided)
    let discountApplied = manualDiscount;
    if (!manualDiscount && customerId) {
      discountApplied = await calculateAutoDiscount(customerId, totalAmount, medicalStoreId);
    }

    const finalAmount = totalAmount - discountApplied;

    // --- PRE-FLIGHT CHECK (Dry Run) ---
    // Consolidate items in case of duplicate medicineId in the request
    const itemsMap = new Map();
    for (const item of items) {
      if (itemsMap.has(item.medicineId)) {
        itemsMap.get(item.medicineId).quantity += item.quantity;
      } else {
        itemsMap.set(item.medicineId, { ...item });
      }
    }
    const consolidatedItems = Array.from(itemsMap.values());

    const stockPlans = [];
    for (const item of consolidatedItems) {
      // This will throw if ANY item cannot be fulfilled (aborting before DB writes)
      const plan = await getFifoDeductionPlan(item.medicineId, item.quantity, medicalStoreId);
      stockPlans.push({ item, plan });
    }

    // --- EXECUTION (Transactional Data Write) ---
    // At this point, we are guaranteed to have stock for all items
    const sale = await Sale.create({
      medicalStoreId,
      customerId,
      totalAmount,
      discountApplied,
      discountType: manualDiscount ? "MANUAL" : discountApplied ? "AUTO" : "NONE",
      finalAmount,
      paymentMode,
      profitAmount: 0,
    });

    let totalProfit = 0;

    for (const { item, plan } of stockPlans) {
      const batchesUsed = await executeFifoDeductionPlan(plan);

      for (const batch of batchesUsed) {
        const profit = calculateProfit([{
          purchasePricePerUnit: batch.purchasePricePerUnit, 
          sellingPricePerUnit: item.sellingPricePerUnit, 
          quantity: batch.quantityDeducted
        }]);
        totalProfit += profit;

        await SaleItem.create({
          saleId: sale._id,
          medicineId: item.medicineId,
          batchId: batch.batchId,
          quantity: batch.quantityDeducted,
          sellingPricePerUnit: item.sellingPricePerUnit,
          totalPrice: batch.quantityDeducted * item.sellingPricePerUnit,
        });
      }
    }

    // Update sale with total profit
    sale.profitAmount = totalProfit;
    await sale.save();

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      saleId: sale._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL SALES
 */
export const getAllSales = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;

    const sales = await Sale.find({ medicalStoreId })
      .populate("customerId", "name category")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE SALE
 */
export const getSingleSale = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const saleId = req.params.id;

    const sale = await Sale.findOne({ _id: saleId, medicalStoreId })
      .populate("customerId", "name category")
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    const items = await SaleItem.find({ saleId: sale._id })
      .populate("medicineId", "name dosage form")
      .lean();

    res.status(200).json({
      success: true,
      sale,
      items,
    });
  } catch (error) {
    next(error);
  }
};
