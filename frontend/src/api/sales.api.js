/**
 * api/sales.api.js
 * 
 * Sales/Billing API endpoints
 */

import api from '@config/axios'

/**
 * Sales API functions
 */
export const salesApi = {
  /**
   * Get all sales with filters
   */
  getSales: async (params = {}) => {
    return await api.get('/sales', { params })
  },

  /**
   * Get sale by ID
   */
  getSaleById: async (id) => {
    return await api.get(`/sales/${id}`)
  },

  /**
   * Create new sale
   */
  createSale: async (saleData) => {
    return await api.post('/sales', saleData)
  },

  /**
   * Update sale (limited - mainly for returns)
   */
  updateSale: async (id, saleData) => {
    return await api.put(`/sales/${id}`, saleData)
  },

  /**
   * Get sales summary for date range
   */
  getSalesSummary: async (startDate, endDate) => {
    return await api.get('/sales/summary', {
      params: { startDate, endDate },
    })
  },

  /**
   * Get today's sales
   */
  getTodaySales: async () => {
    return await api.get('/sales/today')
  },

  /**
   * Generate invoice PDF
   */
  generateInvoice: async (saleId) => {
    return await api.get(`/sales/${saleId}/invoice`, {
      responseType: 'blob',
    })
  },

  /**
   * Process return
   */
  processReturn: async (saleId, returnData) => {
    return await api.post(`/sales/${saleId}/return`, returnData)
  },

  /**
   * Get customer history
   */
  getCustomerHistory: async (phone) => {
    return await api.get('/sales/customer', { params: { phone } })
  },

  /**
   * Export sales
   */
  exportSales: async (params = {}) => {
    return await api.get('/sales/export', {
      params,
      responseType: 'blob',
    })
  },
}

export default salesApi
