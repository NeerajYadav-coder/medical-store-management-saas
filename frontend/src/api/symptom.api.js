/**
 * API endpoints for Symptom Categories
 */

import api from '../config/axios';

const symptomApi = {
  // Get all active symptoms
  getAll: async () => {
    return await api.get('/symptoms');
  },

  // Get symptom by ID
  getById: async (id) => {
    return await api.get(`/symptoms/${id}`);
  },

  // Create symptom (admin only)
  create: async (data) => {
    return await api.post('/symptoms', data);
  },

  // Update symptom
  update: async (id, data) => {
    return await api.put(`/symptoms/${id}`, data);
  },

  // Delete symptom
  delete: async (id) => {
    return await api.delete(`/symptoms/${id}`);
  },
};

export default symptomApi;
