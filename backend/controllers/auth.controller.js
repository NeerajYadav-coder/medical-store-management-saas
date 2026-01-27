// /**
//  * controllers/auth.controller.js
//  *
//  * Responsibility:
//  * - Handle signup & login logic for OWNER and STAFF
//  * - OWNER signup → creates MedicalStore + OWNER user
//  * - STAFF signup → attaches to existing MedicalStore
//  * - Generate JWT token
//  * - Multi-tenant support
//  */

// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import MedicalStore from '../models/MedicalStore.js';
// import env from '../config/env.js';
// import { ROLES } from '../constants/roles.js';

// /**
//  * Utility: Generate JWT Access Token
//  */
// const generateAccessToken = (user) => {
//   return jwt.sign(
//     {
//       userId: user._id,
//       role: user.role,
//       medicalStoreId: user.medicalStoreId,
//     },
//     env.JWT_ACCESS_SECRET,
//     {
//       expiresIn: env.JWT_ACCESS_EXPIRES_IN,
//     }
//   );
// };

// /**
//  * -----------------------
//  * SIGNUP
//  * -----------------------
//  * POST /api/v1/auth/signup
//  *
//  * OWNER → creates store + owner user
//  * STAFF → joins existing store
//  */
// export const signup = async (req, res, next) => {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       password,
//       role,

//       // OWNER-only fields
//       storeName,
//       drugLicenseNumber,
//       gstNumber,
//       address,

//       // STAFF-only field
//       medicalStoreId,
//     } = req.body;

//     // Basic validation
//     if (!name || !email || !phone || !password || !role) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, email, phone, password, and role are required',
//       });
//     }

//     // Prevent duplicate users
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: 'User already exists',
//       });
//     }

//     /**
//      * -----------------------
//      * OWNER SIGNUP
//      * -----------------------
//      */
//     if (role === ROLES.OWNER) {
//       if (!storeName || !drugLicenseNumber || !address) {
//         return res.status(400).json({
//           success: false,
//           message:
//             'storeName, drugLicenseNumber, and address are required for OWNER signup',
//         });
//       }

//       /**
//        * Step 1: Create MedicalStore FIRST
//        */
//       const store = await MedicalStore.create({
//         name: storeName,
//         ownerName: name,
//         phone,
//         email,
//         address,
//         drugLicenseNumber,
//         gstNumber,
//         createdBy: undefined, // set after owner creation
//       });

//       /**
//        * Step 2: Create OWNER user with medicalStoreId
//        */
//       const ownerUser = await User.create({
//         name,
//         email,
//         phone,
//         passwordHash: password,
//         role: ROLES.OWNER,
//         medicalStoreId: store._id,
//       });

//       /**
//        * Step 3: Link store → owner
//        */
//       store.createdBy = ownerUser._id;
//       await store.save();

//       const accessToken = generateAccessToken(ownerUser);

//       return res.status(201).json({
//         success: true,
//         token: accessToken,
//         medicalStoreId: store._id,
//         user: {
//           id: ownerUser._id,
//           name: ownerUser.name,
//           role: ownerUser.role,
//           medicalStoreId: store._id,
//         },
//       });
//     }

//     /**
//      * -----------------------
//      * STAFF SIGNUP
//      * -----------------------
//      */
//     if (role === ROLES.STAFF) {
//       if (!medicalStoreId) {
//         return res.status(400).json({
//           success: false,
//           message: 'medicalStoreId is required for STAFF signup',
//         });
//       }

//       const store = await MedicalStore.findById(medicalStoreId);
//       if (!store) {
//         return res.status(404).json({
//           success: false,
//           message: 'Medical store not found',
//         });
//       }

//       const staffUser = await User.create({
//         name,
//         email,
//         phone,
//         passwordHash: password,
//         role: ROLES.STAFF,
//         medicalStoreId: store._id,
//       });

//       const accessToken = generateAccessToken(staffUser);

//       return res.status(201).json({
//         success: true,
//         token: accessToken,
//         user: {
//           id: staffUser._id,
//           name: staffUser.name,
//           role: staffUser.role,
//           medicalStoreId: staffUser.medicalStoreId,
//         },
//       });
//     }

//     return res.status(400).json({
//       success: false,
//       message: 'Invalid role',
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * -----------------------
//  * LOGIN
//  * -----------------------
//  * POST /api/v1/auth/login
//  */
// export const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email and password are required',
//       });
//     }

//     const user = await User.findOne({ email });

//     if (!user || !user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials',
//       });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials',
//       });
//     }

//     user.lastLoginAt = new Date();
//     await user.save();

//     const accessToken = generateAccessToken(user);

//     res.status(200).json({
//       success: true,
//       token: accessToken,
//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//         medicalStoreId: user.medicalStoreId,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * -----------------------
//  * GET CURRENT USER
//  * -----------------------
//  * GET /api/v1/auth/me
//  */
// export const getMe = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId).select('-passwordHash');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * -----------------------
//  * LOGOUT
//  * -----------------------
//  */
// export const logout = async (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Logged out successfully',
//   });
// };

// /**
//  * -----------------------
//  * CREATE STAFF (OWNER ONLY)
//  * -----------------------
//  * POST /api/v1/auth/staff
//  *
//  * OWNER creates STAFF under same medicalStoreId
//  */
// export const createStaff = async (req, res, next) => {
//   try {
//     const { name, email, phone, password } = req.body;

//     // 1️⃣ Basic validation
//     if (!name || !email || !phone || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, email, phone, and password are required',
//       });
//     }

//     // 2️⃣ Ensure requester is OWNER (extra safety)
//     if (req.user.role !== 'OWNER') {
//       return res.status(403).json({
//         success: false,
//         message: 'Only OWNER can create staff',
//       });
//     }

//     // 3️⃣ Check if user already exists
//     const existingUser = await User.findOne({
//       $or: [{ email }, { phone }],
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: 'User with same email or phone already exists',
//       });
//     }

//     // 4️⃣ Create STAFF user
//     const staffUser = await User.create({
//       name,
//       email,
//       phone,
//       passwordHash: password, // hashed by model hook
//       role: 'STAFF',
//       medicalStoreId: req.user.medicalStoreId, // 🔥 auto-assigned
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Staff created successfully',
//       staff: {
//         id: staffUser._id,
//         name: staffUser.name,
//         email: staffUser.email,
//         phone: staffUser.phone,
//         role: staffUser.role,
//         medicalStoreId: staffUser.medicalStoreId,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };








/**
 * controllers/auth.controller.js
 *
 * Responsibility:
 * - Handle OWNER signup (store + owner user)
 * - Login
 * - Generate JWT token
 * - Multi-tenant support
 * - OWNER-only staff creation (unchanged)
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import MedicalStore from '../models/MedicalStore.js';
import env from '../config/env.js';
import { ROLES } from '../constants/roles.js';

/**
 * Utility: Generate JWT Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      medicalStoreId: user.medicalStoreId,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    }
  );
};

/**
 * -----------------------
 * SIGNUP → OWNER ONLY
 * -----------------------
 * POST /api/v1/auth/signup
 *
 * Creates MedicalStore + OWNER user atomically
 * Matches exact onboarding story
 */
export const signup = async (req, res, next) => {
  try {
    const {
      // Store details
      storeName,
      ownerName,
      storePhone,
      storeEmail,
      address,
      drugLicenseNumber,
      gstNumber,

      // Owner account details
      ownerEmail,
      ownerPhone,
      password,
    } = req.body;

    // Basic validation (all mandatory per story)
    if (!storeName || !ownerName || !storePhone || !storeEmail || !address || 
        !drugLicenseNumber || !ownerEmail || !ownerPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: storeName, ownerName, storePhone, storeEmail, address, drugLicenseNumber, ownerEmail, ownerPhone, password',
      });
    }

    // Prevent duplicate owner email (global check is OK for owner)
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Owner email already exists',
      });
    }

    const existingStore = await MedicalStore.findOne({ email: storeEmail });
if (existingStore) {
  return res.status(409).json({
    success: false,
    message: 'Medical store with this email already exists',
  });
}


    /**
     * Step 1: Create MedicalStore FIRST
     */
    const store = await MedicalStore.create({
      name: storeName,
      ownerName,
      phone: storePhone,
      email: storeEmail,
      address,
      drugLicenseNumber,
      gstNumber,
      createdBy: undefined, // set after owner creation
    });

    /**
     * Step 2: Create OWNER user
     */
    const ownerUser = await User.create({
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      passwordHash: password,
      role: ROLES.OWNER,
      medicalStoreId: store._id,
    });

    /**
     * Step 3: Link store → owner
     */
    store.createdBy = ownerUser._id;
    await store.save();

    const accessToken = generateAccessToken(ownerUser);

    return res.status(201).json({
      success: true,
      token: accessToken,
      medicalStoreId: store._id,
      user: {
        id: ownerUser._id,
        name: ownerUser.name,
        role: ownerUser.role,
        medicalStoreId: store._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * LOGIN (unchanged)
 * -----------------------
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        medicalStoreId: user.medicalStoreId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * GET CURRENT USER (unchanged)
 * -----------------------
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * LOGOUT (unchanged)
 * -----------------------
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * -----------------------
 * CREATE STAFF (OWNER ONLY) - unchanged, already perfect
 * -----------------------
 */
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required',
      });
    }

    if (req.user.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only OWNER can create staff',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with same email or phone already exists',
      });
    }

    const staffUser = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'STAFF',
      medicalStoreId: req.user.medicalStoreId,
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      staff: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        role: staffUser.role,
        medicalStoreId: staffUser.medicalStoreId,
      },
    });
  } catch (error) {
    next(error);
  }
};