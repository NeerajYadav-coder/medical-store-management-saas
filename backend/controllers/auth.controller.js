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
import crypto from 'crypto';
import User from '../models/User.js';
import MedicalStore from '../models/MedicalStore.js';
import OTP from '../models/OTP.js';
import RefreshToken from '../models/RefreshToken.js';
import AuditLog from '../models/AuditLog.js';
import env from '../config/env.js';
import { ROLES } from '../constants/roles.js';
import { ROLE_PERMISSIONS } from '../constants/permissions.js';
import { sendPasswordResetEmail, sendEmail } from '../utils/sendEmail.js';
import fs from 'fs';
import path from 'path';

/**
 * Utility: Generate JWT Access Token (Short-lived: 15 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      medicalStoreId: user.medicalStoreId,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m',
    }
  );
};

/**
 * Utility: Generate Cryptographically Secure Refresh Token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash raw token (SHA-256)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Secure HttpOnly Cookie Options
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * Helper: Check if OTP is verified
 */
const isOTPVerified = async (destination, type, purpose = 'signup') => {
  const verifiedOTP = await OTP.findOne({
    destination,
    type,
    purpose,
    isVerified: true,
    // Check within last 30 minutes (verification window)
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
  });
  return !!verifiedOTP;
};

/**
 * -----------------------
 * SIGNUP → OWNER ONLY
 * -----------------------
 * POST /api/v1/auth/signup
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

    const normalizedEmail = ownerEmail.trim().toLowerCase();
    const normalizedStoreEmail = storeEmail.trim().toLowerCase();

    // Prevent duplicate owner email (global check)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Owner email already exists',
      });
    }

    const existingStore = await MedicalStore.findOne({ email: normalizedStoreEmail });
    if (existingStore) {
      return res.status(409).json({
        success: false,
        message: 'Medical store with this email already exists',
      });
    }

    const emailVerified = await isOTPVerified(normalizedEmail, 'email', 'signup');
    if (!emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please verify your email first.',
        verificationRequired: 'email',
      });
    }

    /**
     * Step 1: Create MedicalStore FIRST
     */
    const store = await MedicalStore.create({
      name: storeName,
      ownerName,
      phone: storePhone,
      email: normalizedStoreEmail,
      address,
      drugLicenseNumber,
      gstNumber,
      createdBy: undefined,
    });

    /**
     * Step 2: Create OWNER user (automatically verified since OTP passed)
     */
    const ownerUser = await User.create({
      name: ownerName,
      email: normalizedEmail,
      phone: ownerPhone,
      passwordHash: password,
      role: ROLES.OWNER,
      permissions: ROLE_PERMISSIONS.OWNER,
      medicalStoreId: store._id,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    /**
     * Step 3: Link store → owner
     */
    store.createdBy = ownerUser._id;
    await store.save();

    // Consume and delete the OTPs immediately to prevent reuse
    await OTP.deleteMany({ destination: normalizedEmail, type: 'email', purpose: 'signup' });

    // Generate tokens
    const accessToken = generateAccessToken(ownerUser);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    // Save refresh token to DB
    await RefreshToken.create({
      userId: ownerUser._id,
      tokenHash: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Set Refresh Token HTTP-only cookie
    res.cookie('refreshToken', rawRefreshToken, getCookieOptions());

    // Audit successful signup
    await AuditLog.create({
      medicalStoreId: store._id,
      userId: ownerUser._id,
      action: 'CREATE',
      entityType: 'STORE_OWNER',
      entityId: ownerUser._id,
      details: { storeName, ownerEmail: normalizedEmail },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      token: accessToken,
      refreshToken: rawRefreshToken,
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
 * LOGIN
 * -----------------------
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      await AuditLog.create({
        action: 'LOGIN',
        entityType: 'USER',
        details: { email: normalizedEmail, success: false, reason: 'User not found' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      await AuditLog.create({
        medicalStoreId: user.medicalStoreId,
        userId: user._id,
        action: 'LOGIN',
        entityType: 'USER',
        details: { email: normalizedEmail, success: false, reason: 'Account deactivated' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({
        medicalStoreId: user.medicalStoreId,
        userId: user._id,
        action: 'LOGIN',
        entityType: 'USER',
        details: { email: normalizedEmail, success: false, reason: 'Password mismatch' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Success
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    // Save refresh token to DB
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Set Refresh Token HTTP-only cookie
    res.cookie('refreshToken', rawRefreshToken, getCookieOptions());

    // Audit successful login
    await AuditLog.create({
      medicalStoreId: user.medicalStoreId,
      userId: user._id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user._id,
      details: { email: normalizedEmail, success: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: rawRefreshToken,
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
 * GET CURRENT USER
 * -----------------------
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');

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
 * LOGOUT
 * -----------------------
 */
export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.deleteOne({ tokenHash });
    }

    res.clearCookie('refreshToken');

    // Audit logout (if user context exists)
    if (req.user) {
      await AuditLog.create({
        medicalStoreId: req.user.medicalStoreId,
        userId: req.user._id,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: req.user._id,
        details: { message: 'Logged out successfully' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * LOGOUT ALL DEVICES
 * -----------------------
 */
export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Increment user token version to invalidate access tokens
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

    // Revoke all refresh tokens
    await RefreshToken.deleteMany({ userId });

    res.clearCookie('refreshToken');

    // Audit event
    await AuditLog.create({
      medicalStoreId: req.user.medicalStoreId,
      userId: req.user._id,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: req.user._id,
      details: { message: 'Logged out from all devices' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * REFRESH TOKEN (Rotation)
 * -----------------------
 */
export const refreshToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash, isRevoked: false }).populate('userId');

    // Reuse detection (hijack protection)
    if (!storedToken) {
      const revokedToken = await RefreshToken.findOne({ tokenHash, isRevoked: true });
      if (revokedToken) {
        // Token replayed! Revoke all tokens in family immediately
        await RefreshToken.deleteMany({ userId: revokedToken.userId });
        
        const user = await User.findById(revokedToken.userId);
        if (user) {
          user.tokenVersion += 1;
          await user.save();
        }

        await AuditLog.create({
          userId: revokedToken.userId,
          action: 'UPDATE',
          entityType: 'SECURITY',
          details: { reason: 'Refresh token reuse detected. Family revoked.' },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });

        res.clearCookie('refreshToken');
        return res.status(401).json({
          success: false,
          message: 'Suspicious session activity detected. Please login again.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }

    // Expiration check
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please login again.',
      });
    }

    const user = storedToken.userId;
    if (!user || !user.isActive) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        message: 'User request failed: Inactive or deleted user',
      });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user);
    const newRawRefreshToken = generateRefreshToken();
    const newHashedRefreshToken = hashToken(newRawRefreshToken);

    // Save new token
    await RefreshToken.create({
      userId: user._id,
      tokenHash: newHashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Mark current refresh token as rotated
    storedToken.isRevoked = true;
    storedToken.replacedByTokenHash = newHashedRefreshToken;
    await storedToken.save();

    res.cookie('refreshToken', newRawRefreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRawRefreshToken,
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
 * FORGOT PASSWORD
 * -----------------------
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    // Always return generic success to prevent email verification probing
    const genericResponse = {
      success: true,
      message: 'If this email is registered, we have sent a password reset link.',
    };

    if (!user || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

    // Send email
    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    // Log the request
    await AuditLog.create({
      medicalStoreId: user.medicalStoreId,
      userId: user._id,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user._id,
      details: { email: normalizedEmail, message: 'Password reset link sent' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * RESET PASSWORD
 * -----------------------
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    user.passwordHash = newPassword; // hashed automatically by pre-save
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.tokenVersion += 1; // invalidate current access tokens
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id });

    // Log successful reset
    await AuditLog.create({
      medicalStoreId: user.medicalStoreId,
      userId: user._id,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user._id,
      details: { message: 'Password reset successful via reset link' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * CHANGE PASSWORD
 * -----------------------
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    user.passwordHash = newPassword;
    user.tokenVersion += 1;
    await user.save();

    await RefreshToken.deleteMany({ userId: user._id });
    res.clearCookie('refreshToken');

    await AuditLog.create({
      medicalStoreId: user.medicalStoreId,
      userId: user._id,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user._id,
      details: { message: 'Password changed successfully' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. All other devices have been logged out.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * CREATE STAFF (OWNER ONLY) - unchanged, already perfect
 * -----------------------
 */
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

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
      passwordHash: password, // hashed by model hook
      role: role === 'MANAGER' ? 'MANAGER' : 'STAFF', // Allow MANAGER role
      permissions: role === 'MANAGER' ? ROLE_PERMISSIONS.MANAGER : ROLE_PERMISSIONS.STAFF, // Assign default permissions
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
        permissions: staffUser.permissions,
        medicalStoreId: staffUser.medicalStoreId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * GET STAFF LIST (OWNER ONLY)
 * -----------------------
 * GET /api/v1/auth/staff
 */
export const getStaff = async (req, res, next) => {
  try {
    // Basic safety check
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only OWNER can view staff list',
      });
    }

    const staff = await User.find({
      medicalStoreId: req.user.medicalStoreId,
      role: { $in: ['STAFF', 'MANAGER'] }, // capable of expanding
    })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * UPDATE STAFF (OWNER ONLY)
 * -----------------------
 * PUT /api/v1/auth/staff/:id
 */
export const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password, isActive } = req.body;

    if (req.user.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only OWNER can update staff',
      });
    }

    const staffUser = await User.findOne({
      _id: id,
      medicalStoreId: req.user.medicalStoreId,
      role: { $in: ['STAFF', 'MANAGER'] },
    });

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Check if updated email/phone already exists in other users
    if (email && email !== staffUser.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
      staffUser.email = email;
    }

    if (phone && phone !== staffUser.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone already exists',
        });
      }
      staffUser.phone = phone;
    }

    if (name) staffUser.name = name;
    
    if (role) {
      staffUser.role = role === 'MANAGER' ? 'MANAGER' : 'STAFF';
      staffUser.permissions = role === 'MANAGER' ? ROLE_PERMISSIONS.MANAGER : ROLE_PERMISSIONS.STAFF;
    }

    if (password) {
      staffUser.passwordHash = password; // pre-save hook will hash it automatically
    }

    if (typeof isActive === 'boolean') {
      staffUser.isActive = isActive;
    }

    await staffUser.save();

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      staff: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        role: staffUser.role,
        permissions: staffUser.permissions,
        isActive: staffUser.isActive,
        medicalStoreId: staffUser.medicalStoreId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * DELETE STAFF (OWNER ONLY)
 * -----------------------
 * DELETE /api/v1/auth/staff/:id
 */
export const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only OWNER can delete staff',
      });
    }

    const staffUser = await User.findOneAndDelete({
      _id: id,
      medicalStoreId: req.user.medicalStoreId,
      role: { $in: ['STAFF', 'MANAGER'] },
    });

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * UPDATE PROFILE
 * -----------------------
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, email, removePhoto } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists',
        });
      }
      user.phone = phone;
    }

    if (name) {
      user.name = name;
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'User with this email address already exists',
        });
      }
      user.email = email;
      // In a production app, you might want to set user.isEmailVerified = false here 
      // trigger a new verification email.
    }

    // Handle profile photo upload or removal
    if (req.file) {
      // If user already had a photo, remove the old one from disk
      if (user.profilePhoto && user.profilePhoto.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), user.profilePhoto);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    } else if (removePhoto === 'true') {
      if (user.profilePhoto && user.profilePhoto.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), user.profilePhoto);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePhoto = null;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check email uniqueness (early validation)
 * POST /api/v1/auth/check-email-uniqueness
 */
export const checkEmailUniqueness = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (type === 'store') {
      const existingStore = await MedicalStore.findOne({ email: normalizedEmail });
      if (existingStore) {
        return res.status(200).json({
          success: true,
          available: false,
          message: 'This email is already registered. Please use a different email address.',
        });
      }
    } else if (type === 'owner') {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(200).json({
          success: true,
          available: false,
          message: 'This email is already registered. Please use a different email address.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid check type. Must be "store" or "owner".',
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit support ticket / contact message
 * POST /api/v1/auth/contact
 */
export const submitSupportTicket = async (req, res, next) => {
  try {
    const { name, email, category, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
      });
    }

    // Send email to support.krishnapharmacy@gmail.com
    const mailOptions = {
      to: 'support.krishnapharmacy@gmail.com',
      replyTo: email,
      subject: `MedStore Support Ticket: [${category.toUpperCase()}] from ${name}`,
      text: `MedStore Contact Support Submission:
Name: ${name}
Email: ${email}
Category: ${category}

Message:
${message}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e8; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0071e3; font-size: 20px; margin-bottom: 20px; border-bottom: 1px solid #e1e1e8; padding-bottom: 10px;">New Support Ticket</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #86868b; font-size: 14px; width: 120px;">Sender Name:</td>
              <td style="padding: 8px 0; color: #1d1d1f; font-size: 14px; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #86868b; font-size: 14px;">Sender Email:</td>
              <td style="padding: 8px 0; color: #1d1d1f; font-size: 14px; font-weight: 600;"><a href="mailto:${email}" style="color: #0071e3; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #86868b; font-size: 14px;">Category:</td>
              <td style="padding: 8px 0; color: #1d1d1f; font-size: 14px; font-weight: 600; text-transform: capitalize;">${category}</td>
            </tr>
          </table>
          <div style="background-color: #f5f5f7; padding: 15px; border-radius: 8px; font-size: 14px; color: #1d1d1f; line-height: 1.5; white-space: pre-wrap;">
${message}
          </div>
          <p style="font-size: 12px; color: #86868b; margin-top: 30px; border-top: 1px solid #e1e1e8; padding-top: 15px; text-align: center;">
            This email was automatically generated by MedStore SaaS platform.
          </p>
        </div>
      `,
    };

    const mailResult = await sendEmail(mailOptions);

    if (!mailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send support ticket email: ' + mailResult.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Support ticket submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};