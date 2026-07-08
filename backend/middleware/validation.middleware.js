import { validationResult, body, param, query } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Centrally handle validation errors
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  };
};

/**
 * Reusable validation rules
 */
export const rules = {
  email: (fieldName = 'email') =>
    body(fieldName)
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail({ gmail_remove_dots: false })
      .trim(),

  password: (fieldName = 'password') =>
    body(fieldName)
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must contain at least one special character'),

  loginPassword: () =>
    body('password').notEmpty().withMessage('Password is required'),

  phone: (fieldName = 'phone') =>
    body(fieldName)
      .matches(/^\+?[1-9]\d{9,14}$/)
      .withMessage('Must be a valid phone number'),

  otpCode: () =>
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),

  objectId: (paramName = 'id') =>
    param(paramName)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Invalid ID format`),
};

// Specialized schemas
export const loginSchema = [
  body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail({ gmail_remove_dots: false }).trim(),
  rules.loginPassword(),
];

export const signupSchema = [
  body('storeName').trim().notEmpty().withMessage('Store name is required'),
  body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
  rules.phone('storePhone'),
  body('storeEmail').isEmail().withMessage('Must be a valid store email').normalizeEmail({ gmail_remove_dots: false }).trim(),
  body('address').trim().notEmpty().withMessage('Store address is required'),
  body('drugLicenseNumber').trim().notEmpty().withMessage('Drug license number is required'),
  rules.email('ownerEmail'),
  rules.phone('ownerPhone'),
  rules.password(),
];

export const sendOtpSchema = [
  body('type').isIn(['phone', 'email']).withMessage('Type must be "phone" or "email"'),
  body('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .custom((val, { req }) => {
      if (req.body.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) throw new Error('Invalid email format');
      } else {
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(val.replace(/\s/g, ''))) throw new Error('Invalid phone number format');
      }
      return true;
    }),
  body('purpose')
    .optional()
    .isIn(['signup', 'login', 'reset_password'])
    .withMessage('Invalid OTP purpose'),
];

export const verifyOtpSchema = [
  body('type').isIn(['phone', 'email']).withMessage('Type must be "phone" or "email"'),
  body('destination').notEmpty().withMessage('Destination is required'),
  rules.otpCode(),
  body('purpose')
    .optional()
    .isIn(['signup', 'login', 'reset_password'])
    .withMessage('Invalid OTP purpose'),
];

export const forgotPasswordSchema = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false })
    .trim(),
];

export const resetPasswordSchema = [
  body('token').notEmpty().withMessage('Reset token is required'),
  rules.password('newPassword'),
];
