import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Customer from "../models/Customer.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Medicine from "../models/Medicine.js";
import { deductStockFIFO } from "../utils/fifoStock.js";
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

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale items are required",
      });
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

    // Create sale
    const sale = await Sale.create({
      medicalStoreId,
      customerId,
      totalAmount,
      discountApplied,
      discountType: manualDiscount ? "MANUAL" : discountApplied ? "AUTO" : "NONE",
      finalAmount,
      paymentMode,
      profitAmount: 0, // will calculate after batch deduction
    });

    let totalProfit = 0;

    // Process sale items with FIFO batch deduction
    for (const item of items) {
      const { medicineId, quantity, sellingPricePerUnit } = item;

      // Deduct batches
      const batchesUsed = await deductStockFIFO(medicalStoreId, medicineId, quantity);

      for (const batch of batchesUsed) {
        const profit = calculateProfit(batch.purchasePricePerUnit, sellingPricePerUnit, batch.quantityDeducted);
        totalProfit += profit;

        // Create sale item
        await SaleItem.create({
          saleId: sale._id,
          medicineId,
          batchId: batch.batchId,
          quantity: batch.quantityDeducted,
          sellingPricePerUnit,
          totalPrice: batch.quantityDeducted * sellingPricePerUnit,
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
      .sort({ createdAt: -1 });

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
      .populate("customerId", "name category");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    const items = await SaleItem.find({ saleId: sale._id })
      .populate("medicineId", "name dosage form");

    res.status(200).json({
      success: true,
      sale,
      items,
    });
  } catch (error) {
    next(error);
  }
};
