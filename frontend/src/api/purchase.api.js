/**
 * API endpoints for Purchases/Inward
 */

import api from '../config/axios';

const purchaseApi = {
  // Get all purchases with pagination
  getAll: async (params = {}) => {
    return await api.get('/purchase', { params });
  },

  // Get purchase by ID
  getById: async (id) => {
    return await api.get(`/purchase/${id}`);
  },

  // Create purchase (inward)
  create: async (data) => {
    return await api.post('/purchase', data);
  },

  // Update purchase (only notes or payment)
  update: async (id, data) => {
    return await api.patch(`/purchase/${id}`, data);
  },

  // Void purchase
  delete: async (id) => {
    return await api.delete(`/purchase/${id}`);
  },

  // Parse supplier invoice image using Gemini AI OCR
  parseInvoice: async (data) => {
    return await api.post('/purchase/parse-invoice', data);
  },
};

export default purchaseApi;
