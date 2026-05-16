/**
 * utils/validators.js
 * 
 * RESPONSIBILITY:
 * - Validation schemas using Zod
 * - Reusable validation rules
 * - Indian-specific validations (phone, GST, Drug License, etc.)
 */

import { z } from 'zod'

// ==================== BASIC VALIDATORS ====================

/**
 * Indian phone number validation
 * Format: 10 digits, optionally prefixed with +91
 */
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(13, 'Phone number is too long')
  .regex(
    /^(\+91)?[6-9]\d{9}$/,
    'Please enter a valid Indian mobile number'
  )

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email is too short')
  .max(100, 'Email is too long')

/**
 * Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(50, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Simple password (for internal staff)
 */
export const simplePasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(50, 'Password is too long')

/**
 * OTP validation (6 digits)
 */
export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers')

// ==================== INDIAN SPECIFIC VALIDATORS ====================

/**
 * GST Number validation (15 character alphanumeric)
 * Format: 2 digits state code + 10 char PAN + 1 entity code + 1 Z + 1 check digit
 */
export const gstSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true // optional
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val)
    },
    { message: 'Please enter a valid GST number' }
  )

/**
 * Drug License Number validation
 * Various formats exist across states (basic validation)
 */
export const drugLicenseSchema = z
  .string()
  .min(5, 'Drug license number is too short')
  .max(30, 'Drug license number is too long')
  .regex(
    /^[A-Z0-9/-]+$/i,
    'Drug license number can only contain letters, numbers, hyphens and slashes'
  )

/**
 * PAN Number validation
 */
export const panSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.toUpperCase())
    },
    { message: 'Please enter a valid PAN number' }
  )

/**
 * Pincode validation (6 digits)
 */
export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode')

// ==================== FORM SCHEMAS ====================

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

/**
 * Registration form schema (Store + Owner)
 */
export const registrationSchema = z.object({
  // Store details
  storeName: z
    .string()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name is too long'),
  storeEmail: emailSchema,
  storePhone: phoneSchema,
  address: z
    .string()
    .min(10, 'Please enter complete address')
    .max(500, 'Address is too long'),
  drugLicenseNumber: drugLicenseSchema,
  gstNumber: gstSchema,

  // Owner details
  ownerName: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name is too long'),
  ownerEmail: emailSchema,
  ownerPhone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

/**
 * Medicine form schema
 */
export const medicineSchema = z.object({
  name: z
    .string()
    .min(2, 'Medicine name is required')
    .max(200, 'Name is too long'),
  genericName: z
    .string()
    .min(2, 'Generic name is required')
    .max(200, 'Name is too long'),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().min(2, 'Manufacturer is required'),
  unit: z.string().min(1, 'Unit is required'),
  minStockLevel: z
    .number({ invalid_type_error: 'Enter a valid number' })
    .min(0, 'Cannot be negative'),
  hsnCode: z.string().optional(),
  gstPercent: z
    .number()
    .min(0, 'Cannot be negative')
    .max(28, 'GST cannot exceed 28%')
    .optional(),
  description: z.string().max(1000).optional(),
})

/**
 * Batch form schema
 */
export const batchSchema = z.object({
  batchNumber: z
    .string()
    .min(1, 'Batch number is required')
    .max(50, 'Batch number is too long'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .refine((val) => new Date(val) > new Date(), {
      message: 'Expiry date must be in the future',
    }),
  quantity: z
    .number({ invalid_type_error: 'Enter a valid number' })
    .min(1, 'Quantity must be at least 1'),
  purchasePrice: z
    .number({ invalid_type_error: 'Enter a valid price' })
    .min(0.01, 'Purchase price must be greater than 0'),
  sellingPrice: z
    .number({ invalid_type_error: 'Enter a valid price' })
    .min(0.01, 'Selling price must be greater than 0'),
})

/**
 * Supplier form schema
 */
export const supplierSchema = z.object({
  name: z
    .string()
    .min(2, 'Company name is required')
    .max(200, 'Name is too long'),
  contactPerson: z
    .string()
    .min(2, 'Contact person name is required')
    .max(100, 'Name is too long'),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  gstNumber: gstSchema,
  drugLicenseNumber: z.string().optional(),
  creditDays: z
    .number()
    .min(0)
    .max(365)
    .optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Staff form schema
 */
export const staffSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required')
    .max(100, 'Name is too long'),
  email: emailSchema,
  phone: phoneSchema,
  password: simplePasswordSchema,
})

/**
 * Sale item schema
 */
export const saleItemSchema = z.object({
  batchId: z.string().min(1, 'Please select a batch'),
  quantity: z
    .number({ invalid_type_error: 'Enter quantity' })
    .min(1, 'Quantity must be at least 1'),
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional(),
})

/**
 * Customer form schema
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required')
    .max(100, 'Name is too long'),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  address: z.string().max(500).optional(),
})

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  return phoneSchema.safeParse(phone).success
}

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  return emailSchema.safeParse(email).success
}

/**
 * Validate GST number
 */
export const isValidGST = (gst) => {
  if (!gst) return true
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)
}

/**
 * Sanitize phone number (remove +91, spaces, etc.)
 */
export const sanitizePhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/[\s+()-]/g, '').replace(/^91/, '')
}

/**
 * Format phone for display
 */
export const formatPhone = (phone) => {
  const sanitized = sanitizePhone(phone)
  if (sanitized.length !== 10) return phone
  return `+91 ${sanitized.slice(0, 5)} ${sanitized.slice(5)}`
}

export default {
  // Schemas
  phoneSchema,
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  otpSchema,
  gstSchema,
  drugLicenseSchema,
  panSchema,
  pincodeSchema,
  loginSchema,
  registrationSchema,
  medicineSchema,
  batchSchema,
  supplierSchema,
  staffSchema,
  saleItemSchema,
  customerSchema,
  // Helpers
  isValidPhone,
  isValidEmail,
  isValidGST,
  sanitizePhone,
  formatPhone,
}
