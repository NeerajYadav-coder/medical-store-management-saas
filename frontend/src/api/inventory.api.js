/**
 * api/inventory.api.js
 * 
 * Inventory/Medicine API endpoints
 */

import api from '@config/axios'

/**
 * Inventory API functions
 */
export const inventoryApi = {
  /**
   * Get all medicines with filters
   */
  getMedicines: async (params = {}) => {
    return await api.get('/medicines', { params })
  },

  /**
   * Search medicines by name
   */
  searchMedicines: async (query, limit = 10) => {
    return await api.get('/medicines/search', {
      params: { q: query, limit },
    })
  },

  /**
   * Search medicines with stock (for POS)
   */
  searchMedicinesWithStock: async (query) => {
    return await api.get('/medicines/search-with-stock', {
      params: { q: query },
    })
  },

  /**
   * Get medicine by ID
   */
  getMedicineById: async (id) => {
    return await api.get(`/medicines/${id}`)
  },

  /**
   * Create new medicine
   */
  createMedicine: async (medicineData) => {
    return await api.post('/medicines', medicineData)
  },

  /**
   * Update medicine
   */
  updateMedicine: async (id, medicineData) => {
    return await api.put(`/medicines/${id}`, medicineData)
  },

  /**
   * Delete medicine
   */
  deleteMedicine: async (id) => {
    return await api.delete(`/medicines/${id}`)
  },

  /**
   * Get batches for a medicine
   */
  getBatches: async (medicineId) => {
    return await api.get(`/medicines/${medicineId}/batches`)
  },

  /**
   * Add batch to medicine
   */
  addBatch: async (medicineId, batchData) => {
    return await api.post(`/medicines/${medicineId}/batches`, batchData)
  },

  /**
   * Update batch
   */
  updateBatch: async (medicineId, batchId, batchData) => {
    return await api.put(`/medicines/${medicineId}/batches/${batchId}`, batchData)
  },

  /**
   * Get low stock medicines
   */
  getLowStock: async () => {
    return await api.get('/medicines/low-stock')
  },

  /**
   * Get expiring medicines
   */
  getExpiring: async (days = 30) => {
    return await api.get('/medicines/expiring', { params: { days } })
  },

  /**
   * Update stock quantity
   */
  updateStock: async (medicineId, quantity, reason) => {
    return await api.post(`/medicines/${medicineId}/stock`, {
      quantity,
      reason,
    })
  },

  /**
   * Import medicines from CSV
   */
  importMedicines: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await api.post('/medicines/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Export medicines to CSV
   */
  exportMedicines: async (filters = {}) => {
    return await api.get('/medicines/export', {
      params: filters,
      responseType: 'blob',
    })
  },
}

export default inventoryApi
