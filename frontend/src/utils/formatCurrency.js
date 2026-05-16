/**
 * utils/formatCurrency.js
 * 
 * Currency formatting utilities for Indian Rupee
 */

/**
 * Format number as Indian Rupee currency
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show ₹ symbol
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0.00' : '0.00'
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const formatted = formatter.format(amount)
  return showSymbol ? formatted : formatted.replace('₹', '').trim()
}

/**
 * Format number as compact currency (e.g., ₹1.2L)
 * @param {number} amount - Amount to format
 * @returns {string} Compact formatted string
 */
export function formatCompactCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0'
  }

  if (amount >= 10000000) {
    // Crores
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (amount >= 100000) {
    // Lakhs
    return `₹${(amount / 100000).toFixed(2)}L`
  } else if (amount >= 1000) {
    // Thousands
    return `₹${(amount / 1000).toFixed(1)}K`
  }

  return `₹${amount.toFixed(0)}`
}

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export function parseCurrency(currencyString) {
  if (!currencyString) return 0

  // Remove currency symbol and commas
  const cleaned = currencyString
    .replace(/[₹,\s]/g, '')
    .replace(/[^\d.-]/g, '')

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format number with Indian numbering system (comma placement)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatIndianNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }

  return new Intl.NumberFormat('en-IN').format(num)
}

/**
 * Calculate GST components
 * @param {number} amount - Base amount
 * @param {number} gstRate - GST rate (default 18%)
 * @param {boolean} isInclusive - Whether GST is inclusive
 * @returns {object} GST breakdown
 */
export function calculateGST(amount, gstRate = 18, isInclusive = false) {
  if (isInclusive) {
    const baseAmount = amount / (1 + gstRate / 100)
    const gstAmount = amount - baseAmount
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      totalAmount: amount,
    }
  } else {
    const gstAmount = (amount * gstRate) / 100
    return {
      baseAmount: amount,
      gstAmount: Math.round(gstAmount * 100) / 100,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      totalAmount: Math.round((amount + gstAmount) * 100) / 100,
    }
  }
}

/**
 * Round to nearest paisa
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export function roundToNearest(amount, nearest = 0.01) {
  return Math.round(amount / nearest) * nearest
}

export default {
  formatCurrency,
  formatCompactCurrency,
  parseCurrency,
  formatIndianNumber,
  calculateGST,
  roundToNearest,
}
