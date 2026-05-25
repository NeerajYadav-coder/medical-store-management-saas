import MedicalStore from "../models/MedicalStore.js";
import User from "../models/User.js";

/**
 * @desc    Create medical store (only once per owner)
 * @route   POST /api/stores
 * @access  Private
 */
// export const createStore = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // Check if user already owns a store
//     const existingStore = await MedicalStore.findOne({ owner: userId });
//     if (existingStore) {
//       return res.status(400).json({
//         success: false,
//         message: "Medical store already exists for this user",
//       });
//     }

//     const {
//       name,
//       licenseNumber,
//       phone,
//       address,
//     } = req.body;

//     if (!name || !licenseNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Store name and license number are required",
//       });
//     }

//     // Create store
//     const store = await MedicalStore.create({
//       name,
//       licenseNumber,
//       phone,
//       address,
//       owner: userId,
//     });

//     // Link store to user
//     await User.findByIdAndUpdate(userId, {
//       medicalStore: store._id,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Medical store created successfully",
//       data: store,
//     });
//   } catch (error) {
//     console.error("Create Store Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while creating store",
//     });
//   }
// };

/**
 * @desc    Get logged-in user's medical store
 * @route   GET /api/stores/me
 * @access  Private
 */
export const getMyStore = async (req, res) => {
  try {
    const store = await MedicalStore.findById(req.user.medicalStoreId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Medical store not found",
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error("Get Store Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching store",
    });
  }
};

/**
 * @desc    Update logged-in user's medical store
 * @route   PUT /api/stores/me
 * @access  Private
 */
export const updateMyStore = async (req, res) => {
  try {
    const store = await MedicalStore.findById(req.user.medicalStoreId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Medical store not found",
      });
    }

    const allowedUpdates = [
      "name",
      "phone",
      "address",
      "email",
      "drugLicenseNumber",
      "gstNumber",
      "website",
      "logo",
      "whatsappConfig",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        store[field] = req.body[field];
      }
    });

    await store.save();

    res.status(200).json({
      success: true,
      message: "Medical store updated successfully",
      data: store,
    });
  } catch (error) {
    console.error("Update Store Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating store",
    });
  }
};

/**
 * @desc    Upgrade store subscription to PREMIUM
 * @route   POST /api/store/me/upgrade
 * @access  Private (Owner Only)
 */
export const upgradeStore = async (req, res, next) => {
  try {
    const store = await MedicalStore.findByIdAndUpdate(
      req.user.medicalStoreId,
      { plan: "PREMIUM" },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Medical store not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical store upgraded to PREMIUM successfully",
      data: store,
    });
  } catch (error) {
    console.error("Upgrade Store Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while upgrading store",
    });
  }
};

/**
 * @desc    Downgrade store subscription to FREE
 * @route   POST /api/store/me/downgrade
 * @access  Private (Owner Only)
 */
export const downgradeStore = async (req, res, next) => {
  try {
    const store = await MedicalStore.findByIdAndUpdate(
      req.user.medicalStoreId,
      { plan: "FREE" },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Medical store not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical store downgraded to FREE successfully",
      data: store,
    });
  } catch (error) {
    console.error("Downgrade Store Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while downgrading store",
    });
  }
};
