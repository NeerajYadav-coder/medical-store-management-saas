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
};

export default purchaseApi;
