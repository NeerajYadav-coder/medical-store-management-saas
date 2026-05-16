/**
 * utils/formatDate.js
 * 
 * Date formatting utilities
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'full'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const options = {
    short: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    numeric: { day: '2-digit', month: '2-digit', year: 'numeric' },
  }

  return d.toLocaleDateString('en-IN', options[format] || options.short)
}

/**
 * Format time to readable string
 * @param {Date|string} date - Date to get time from
 * @param {boolean} includeSeconds - Include seconds
 * @returns {string} Formatted time string
 */
export function formatTime(date, includeSeconds = false) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  })
}

/**
 * Format date and time together
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date) {
  if (!date) return ''
  return `${formatDate(date)} at ${formatTime(date)}`
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diffMs = now - d
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`

  return formatDate(date)
}

/**
 * Get days until a date
 * @param {Date|string} date - Target date
 * @returns {number} Days until date (negative if past)
 */
export function getDaysUntil(date) {
  if (!date) return 0

  const d = new Date(date)
  if (isNaN(d.getTime())) return 0

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)

  const diffMs = d - now
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Format expiry date with status
 * @param {Date|string} date - Expiry date
 * @returns {object} Formatted expiry with status
 */
export function formatExpiryDate(date) {
  if (!date) return { text: 'No expiry', status: 'ok' }

  const days = getDaysUntil(date)

  if (days < 0) {
    return { text: `Expired ${Math.abs(days)} days ago`, status: 'expired' }
  }
  if (days === 0) {
    return { text: 'Expires today', status: 'expired' }
  }
  if (days <= 30) {
    return { text: `Expires in ${days} days`, status: 'critical' }
  }
  if (days <= 90) {
    return { text: `Expires in ${days} days`, status: 'warning' }
  }

  return { text: formatDate(date), status: 'ok' }
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false

  const d = new Date(date)
  const today = new Date()

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/**
 * Get start and end of day
 * @param {Date} date - Date to get bounds for
 * @returns {object} Start and end dates
 */
export function getDayBounds(date = new Date()) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return { startOfDay, endOfDay }
}

/**
 * Get start and end of month
 * @param {Date} date - Date to get bounds for
 * @returns {object} Start and end dates
 */
export function getMonthBounds(date = new Date()) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

  return { startOfMonth, endOfMonth }
}

/**
 * Parse date string to Date object
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null
 */
export function parseDate(dateString) {
  if (!dateString) return null

  const d = new Date(dateString)
  return isNaN(d.getTime()) ? null : d
}

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  getDaysUntil,
  formatExpiryDate,
  isToday,
  getDayBounds,
  getMonthBounds,
  parseDate,
}
