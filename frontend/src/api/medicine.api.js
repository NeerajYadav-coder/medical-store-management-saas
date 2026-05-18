/**
 * API endpoints for Medicines
 */

import api from '../config/axios';

const medicineApi = {
  // Get all medicines
  getAll: async (params = {}) => {
    return await api.get('/medicines', { params });
  },

  // Search medicines (for billing - includes stock)
  search: async (query) => {
    return await api.get('/medicines/search', { params: { q: query } });
  },

  // Search medicines with available stock (for billing)
  searchWithStock: async (query) => {
    return await api.get('/medicines/search-with-stock', { params: { q: query } });
  },

  // Get medicine by ID
  getById: async (id) => {
    return await api.get(`/medicines/${id}`);
  },

  // Get medicine by barcode
  getByBarcode: async (barcode) => {
    return await api.get(`/medicines/barcode/${barcode}`);
  },

  // Get top-selling medicines
  getTopSelling: async (limit = 20) => {
    return await api.get('/medicines/top-selling', { params: { limit } });
  },

  // Get medicines by symptom
  getBySymptom: async (symptomId) => {
    return await api.get(`/medicines/by-symptom/${symptomId}`);
  },

  // Get low stock medicines
  getLowStock: async () => {
    return await api.get('/medicines/low-stock');
  },

  // Get near expiry medicines
  getNearExpiry: async (days = 30) => {
    return await api.get('/medicines/near-expiry', { params: { days } });
  },

  // Create medicine
  create: async (data) => {
    return await api.post('/medicines', data);
  },

  // Update medicine
  update: async (id, data) => {
    return await api.put(`/medicines/${id}`, data);
  },

  // Delete medicine
  delete: async (id) => {
    return await api.delete(`/medicines/${id}`);
  },

  // Get available batches for a medicine
  getBatches: async (id) => {
    return await api.get(`/medicines/${id}/batches`);
  },

  // Get auto-generated next batch number for a medicine
  getNextBatchNumber: async (id) => {
    return await api.get(`/medicines/${id}/next-batch`);
  },

  // Add symptoms to medicine
  updateSymptoms: async (id, symptoms) => {
    return await api.patch(`/medicines/${id}/symptoms`, { symptoms });
  },
};

export default medicineApi;
