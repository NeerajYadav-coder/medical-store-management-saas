// /**
//  * models/User.js
//  *
//  * Responsibility:
//  * - Authentication + role control
//  * - Multi-tenant (medicalStoreId)
//  * - Secure password storage
//  * - Track last login & active status
//  */

// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// const SALT_ROUNDS = 10;

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Name is required'],
//       trim: true,
//     },
//     phone: {
//       type: String,
//       required: [true, 'Phone number is required'],
//       unique: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, 'Email is required'],
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     passwordHash: {
//       type: String,
//       required: [true, 'Password is required'],
//     },
//     role: {
//       type: String,
//       enum: ['OWNER', 'STAFF'],
//       required: true,
//     },
//     medicalStoreId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'MedicalStore',
//       required: true,
//       index: true, // Multi-tenant isolation
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     lastLoginAt: {
//       type: Date,
//     },
//   },
//   { timestamps: { createdAt: true, updatedAt: false } }
// );

// /**
//  * Pre-save hook
//  * - Hash password if modified
//  */
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('passwordHash')) return next();

//   try {
//     const hash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
//     this.passwordHash = hash;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// /**
//  * Instance method: compare password
//  */
// userSchema.methods.comparePassword = async function (plainPassword) {
//   return bcrypt.compare(plainPassword, this.passwordHash);
// };

// /**
//  * Indexes for production efficiency
//  */
// userSchema.index({ medicalStoreId: 1, email: 1 }, { unique: true });
// userSchema.index({ medicalStoreId: 1, phone: 1 }, { unique: true });

// module.exports = mongoose.model('User', userSchema);








// /**
//  * models/User.js
//  *
//  * Responsibility:
//  * - Authentication + role control
//  * - Multi-tenant (medicalStoreId)
//  * - Secure password storage
//  * - Track last login & active status
//  */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['OWNER', 'MANAGER', 'STAFF'], // Expanded roles
      required: true,
    },
    permissions: {
      type: [String],
      default: [], // Granular permissions
    },
    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true, // Multi-tenant isolation
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/**
 * Pre-save hook
 * - Hash password if modified
 */
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
});

/**
 * Instance method: compare password
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Indexes for production efficiency
 */
userSchema.index({ medicalStoreId: 1, email: 1 }, { unique: true });
userSchema.index({ medicalStoreId: 1, phone: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;



/**
 * models/User.js
 *
 * Responsibility:
 * - Authentication + role control
 * - Multi-tenant (medicalStoreId)
 * - Secure password storage
 * - Track last login & active status
 */

// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// const SALT_ROUNDS = 10;

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Name is required'],
//       trim: true,
//     },
//     phone: {
//       type: String,
//       required: [true, 'Phone number is required'],
//       trim: true,
//       // REMOVED unique: true → use compound index only (multi-tenant safe)
//     },
//     email: {
//       type: String,
//       required: [true, 'Email is required'],
//       lowercase: true,
//       trim: true,
//       // REMOVED unique: true → use compound index only
//     },
//     passwordHash: {
//       type: String,
//       required: [true, 'Password is required'],
//     },
//     role: {
//       type: String,
//       enum: ['OWNER', 'STAFF'],
//       required: true,
//     },
//     medicalStoreId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'MedicalStore',
//       required: true,
//       index: true, // Multi-tenant isolation
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     lastLoginAt: {
//       type: Date,
//     },
//   },
//   { timestamps: { createdAt: true, updatedAt: false } }
// );

// /**
//  * Pre-save hook
//  * - Hash password if modified
//  */
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('passwordHash')) return next();

//   try {
//     const hash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
//     this.passwordHash = hash;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// /**
//  * Instance method: compare password
//  */
// userSchema.methods.comparePassword = async function (plainPassword) {
//   return bcrypt.compare(plainPassword, this.passwordHash);
// };

// /**
//  * Indexes for production efficiency + multi-tenant uniqueness
//  */
// userSchema.index({ medicalStoreId: 1, email: 1 }, { unique: true });
// userSchema.index({ medicalStoreId: 1, phone: 1 }, { unique: true });

// const User = mongoose.model('User', userSchema);
// export default User;