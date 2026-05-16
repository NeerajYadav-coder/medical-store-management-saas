/**
 * API endpoints for Suppliers
 */

import api from '../config/axios';

const supplierApi = {
  // Get all suppliers
  getAll: async (params = {}) => {
    return await api.get('/suppliers', { params });
  },

  // Search suppliers
  search: async (query) => {
    return await api.get('/suppliers/search', { params: { q: query } });
  },

  // Get supplier by ID
  getById: async (id) => {
    return await api.get(`/suppliers/${id}`);
  },

  // Get by vendor code
  getByVendorCode: async (code) => {
    return await api.get(`/suppliers/code/${code}`);
  },

  // Get best margin suppliers
  getBestMargin: async (limit = 10) => {
    return await api.get('/suppliers/best-margin', { params: { limit } });
  },

  // Create supplier
  create: async (data) => {
    return await api.post('/suppliers', data);
  },

  // Update supplier
  update: async (id, data) => {
    return await api.put(`/suppliers/${id}`, data);
  },

  // Delete supplier
  delete: async (id) => {
    return await api.delete(`/suppliers/${id}`);
  },

  // Update supplier rating
  updateRating: async (id, rating) => {
    return await api.patch(`/suppliers/${id}/rating`, { rating });
  },
};

export default supplierApi;
