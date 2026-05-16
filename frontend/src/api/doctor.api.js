/**
 * API endpoints for Doctors
 */

import api from '../config/axios';

const doctorApi = {
  // Get all doctors for the store
  getAll: async (params = {}) => {
    return await api.get('/doctors', { params });
  },

  // Search doctors
  search: async (query) => {
    return await api.get('/doctors/search', { params: { q: query } });
  },

  // Get doctor by ID
  getById: async (id) => {
    return await api.get(`/doctors/${id}`);
  },

  // Get top doctors by revenue
  getTopDoctors: async (limit = 10) => {
    return await api.get('/doctors/top', { params: { limit } });
  },

  // Create doctor
  create: async (data) => {
    return await api.post('/doctors', data);
  },

  // Update doctor
  update: async (id, data) => {
    return await api.put(`/doctors/${id}`, data);
  },

  // Delete doctor
  delete: async (id) => {
    return await api.delete(`/doctors/${id}`);
  },
};

export default doctorApi;
