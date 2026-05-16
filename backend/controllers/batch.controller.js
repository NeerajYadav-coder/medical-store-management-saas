import MedicineBatch from "../models/MedicineBatch.js";
import Medicine from "../models/Medicine.js";

/**
 * Create a new medicine batch
 * OWNER / STAFF
 */
export const createBatch = async (req, res, next) => {
  try {
    const {
      medicineId,
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      quantity,
    } = req.body;

    const medicalStore = req.user.medicalStore;

    // 1. Validate medicine belongs to same store
    const medicine = await Medicine.findOne({
      _id: medicineId,
      medicalStore,
    });

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found for this store",
      });
    }

    // 2. Prevent duplicate batch number for same medicine
    const existingBatch = await MedicineBatch.findOne({
      medicine: medicineId,
      batchNumber,
    });

    if (existingBatch) {
      return res.status(400).json({
        message: "Batch number already exists for this medicine",
      });
    }

    // 3. Create batch
    const batch = await MedicineBatch.create({
      medicalStore,
      medicine: medicineId,
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      quantity,
      remainingQuantity: quantity,
    });

    res.status(201).json({
      message: "Batch created successfully",
      batch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all batches for logged-in store
 * Any authenticated user
 */
export const getAllBatches = async (req, res, next) => {
  try {
    const medicalStore = req.user.medicalStore;

    const batches = await MedicineBatch.find({ medicalStore })
      .populate("medicine", "name manufacturer")
      .sort({ expiryDate: 1 });

    res.status(200).json({
      count: batches.length,
      batches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get batches for a specific medicine
 * Any authenticated user
 */
export const getBatchesByMedicine = async (req, res, next) => {
  try {
    const { medicineId } = req.params;
    const medicalStore = req.user.medicalStore;

    const batches = await MedicineBatch.find({
      medicine: medicineId,
      medicalStore,
    }).sort({ expiryDate: 1 });

    res.status(200).json({
      count: batches.length,
      batches,
    });
  } catch (error) {
    next(error);
  }
};
