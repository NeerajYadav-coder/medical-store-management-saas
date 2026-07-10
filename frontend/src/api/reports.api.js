/**
 * api/reports.api.js
 * 
 * Reports and Analytics API endpoints
 */

import api from '@config/axios'

/**
 * Reports API functions
 */
export const reportsApi = {
  /**
   * Get dashboard stats
   */
  getDashboardStats: async (params = {}) => {
    return await api.get('/dashboard', { params })
  },

  /**
   * Get today's summary
   */
  getTodaySummary: async () => {
    return await api.get('/reports/today')
  },

  /**
   * Get alerts (low stock, expiring, etc.)
   */
  getAlerts: async () => {
    return await api.get('/reports/alerts')
  },

  /**
   * Get recent activity
   */
  getRecentActivity: async (limit = 10) => {
    return await api.get('/reports/activity', { params: { limit } })
  },

  /**
   * Get sales report
   */
  getSalesReport: async (params = {}) => {
    return await api.get('/reports/sales', { params })
  },

  /**
   * Get inventory report
   */
  getInventoryReport: async (params = {}) => {
    return await api.get('/reports/inventory', { params })
  },

  /**
   * Get purchase report
   */
  getPurchaseReport: async (params = {}) => {
    return await api.get('/reports/purchase', { params })
  },

  /**
   * Get profit/loss report
   */
  getProfitLossReport: async (startDate, endDate) => {
    return await api.get('/reports/profit-loss', {
      params: { startDate, endDate },
    })
  },

  /**
   * Get GST report
   */
  getGSTReport: async (month, year) => {
    return await api.get('/reports/gst', {
      params: { month, year },
    })
  },

  /**
   * Get top selling products
   */
  getTopProducts: async (params = {}) => {
    return await api.get('/reports/top-products', { params })
  },

  /**
   * Get revenue by category
   */
  getRevenueByCategory: async (params = {}) => {
    return await api.get('/reports/revenue-by-category', { params })
  },

  /**
   * Generate PDF report
   */
  generatePDFReport: async (reportType, params = {}) => {
    return await api.get(`/reports/${reportType}/pdf`, {
      params,
      responseType: 'blob',
    })
  },

  /**
   * Export report to Excel
   */
  exportReport: async (reportType, params = {}) => {
    return await api.get(`/reports/${reportType}/export`, {
      params,
      responseType: 'blob',
    })
  },
}

export default reportsApi
