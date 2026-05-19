import Medicine from "../models/Medicine.js";
import MedicalStore from "../models/MedicalStore.js";

/**
 * CREATE MEDICINE (MASTER)
 * OWNER / STAFF
 */
export const createMedicine = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;

    // Premium plan check: Free plan restricted to 100 medicine records
    const store = await MedicalStore.findById(medicalStoreId);
    if (!store || store.plan !== 'PREMIUM') {
      const medicineCount = await Medicine.countDocuments({
        medicalStoreId,
      });
      if (medicineCount >= 100) {
        return res.status(403).json({
          success: false,
          message: 'Upgrade to Premium plan to add more than 100 medicines.',
        });
      }
    }

    const {
      name,
      dosage,
      form,
      unitType,
      unitSellingPrice,
      mrpPerUnit,
    } = req.body;

    if (!name || !form || !unitType) {
      return res.status(400).json({
        success: false,
        message: "Required medicine fields missing",
      });
    }

    const medicine = await Medicine.create({
      medicalStoreId,
      name,
      dosage,
      form,
      unitType,
      unitSellingPrice,
      mrpPerUnit,
    });

    res.status(201).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    // 👇 DUPLICATE MEDICINE HANDLING
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Medicine with same name, dosage and form already exists in this store",
      });
    }

    next(error);
  }
};


// Helper to escape regex
const escapedRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET ALL MEDICINES
 * Any authenticated user
 * Supports: Search, Pagination, Filtering (Category, Low Stock, Expiring)
 */
export const getAllMedicines = async (req, res, next) => {
  try {
    const medicalStoreId = new mongoose.Types.ObjectId(req.user.medicalStoreId);
    
    // Query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const category = req.query.category || '';
    const lowStock = req.query.lowStock === 'true';
    const expiring = req.query.expiring === 'true';
    const expired = req.query.expired === 'true'; // New param
    const outOfStock = req.query.outOfStock === 'true';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Build Match Stage
    const matchStage = { 
      medicalStoreId,
      isActive: true
    };

    if (search) {
      const regex = new RegExp(escapedRegex(search), 'i');
      matchStage.$or = [
        { name: regex },
        { genericName: regex },
        { manufacturer: regex }
      ];
    }

    if (category) {
      // mapping frontend category values to schema enum if needed
      // Front: 'tablets', Schema: 'TABLET'
      const categoryMap = {
        'tablets': 'TABLET',
        'capsules': 'CAPSULE',
        'syrups': 'SYRUP',
        'injections': 'INJECTION',
        'ointments': 'OINTMENT',
        'drops': 'DROPS',
        'powders': 'POWDER'
      };
      
      const mappedCategory = categoryMap[category.toLowerCase()] || category.toUpperCase();
      matchStage.form = mappedCategory;
    }

    // Aggregation Pipeline
    const pipeline = [
      { $match: matchStage },
      // Lookup batches to calculate stock
      {
        $lookup: {
          from: 'medicinebatches',
          let: { medId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$medicineId', '$$medId'] },
                // removed isActive: true to include expired stock
                quantityRemaining: { $gt: 0 } // Only positive stock
              } 
            },
            {
              $group: {
                _id: null,
                totalStock: { $sum: '$quantityRemaining' },
                expiryDates: { $push: '$expiryDate' },
                count: { $sum: 1 }
              }
            }
          ],
          as: 'stockData'
        }
      },
      // Unwind stockData (preserveNullAndEmptyArrays: true to keep medicines with 0 stock)
      {
        $unwind: {
          path: '$stockData',
          preserveNullAndEmptyArrays: true
        }
      },
      // Add calculated fields
      {
        $addFields: {
          currentStock: { $ifNull: ['$stockData.totalStock', 0] },
          batches: { $ifNull: ['$stockData.count', 0] },
          nearestExpiry: { $min: '$stockData.expiryDates' }
        }
      }
    ];

    // Filter by Stock Status
    if (lowStock) {
      pipeline.push({
        $match: {
          $expr: {
            $and: [
              { $gt: ['$currentStock', 0] },
              { $lte: ['$currentStock', '$reorderLevel'] }
            ]
          }
        }
      });
    }

    if (outOfStock) {
      pipeline.push({
        $match: {
          currentStock: 0
        }
      });
    }

    if (expiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      pipeline.push({
        $match: {
          nearestExpiry: { 
            $lte: thirtyDaysFromNow,
            $gt: new Date() // Not expired yet
          }
        }
      });
    }

    if (expired) {
      pipeline.push({
        $match: {
          nearestExpiry: { $lt: new Date() }
        }
      });
    }

    // Sort
    const sortStage = {};
    sortStage[sortBy] = sortOrder;
    pipeline.push({ $sort: sortStage });

    // Count Facet
    const countPipeline = [...pipeline, { $count: 'total' }];
    
    // Pagination Facet
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute
    const [results, countResult] = await Promise.all([
      Medicine.aggregate(pipeline),
      Medicine.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE MEDICINE
 */
export const getSingleMedicine = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const medicineId = req.params.id;

    const medicine = await Medicine.findOne({
      _id: medicineId,
      medicalStoreId,
    }).lean();

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE MEDICINE
 * OWNER only
 */
export const updateMedicine = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const medicineId = req.params.id;

    const updatedMedicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedMedicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedMedicine,
    });
  } catch (error) {
    next(error);
  }
};
