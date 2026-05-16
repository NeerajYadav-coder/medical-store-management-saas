/**
 * API endpoints for Customers
 */

import api from '../config/axios';

const customerApi = {
  // Get all customers
  getAll: async (params = {}) => {
    return await api.get('/customers', { params });
  },

  // Search customers by phone or name
  search: async (query) => {
    return await api.get('/customers/search', { params: { q: query } });
  },

  // Get customer by ID
  getById: async (id) => {
    return await api.get(`/customers/${id}`);
  },

  // Get customer by phone
  getByPhone: async (phone) => {
    return await api.get(`/customers/phone/${phone}`);
  },

  // Get repeat buyers
  getRepeatBuyers: async (limit = 50) => {
    return await api.get('/customers/repeat-buyers', { params: { limit } });
  },

  // Get VIP customers
  getVIPCustomers: async () => {
    return await api.get('/customers/vip');
  },

  // Get customer purchase history
  getPurchaseHistory: async (id, params = {}) => {
    return await api.get(`/customers/${id}/history`, { params });
  },

  // Create customer
  create: async (data) => {
    return await api.post('/customers', data);
  },

  // Quick create (minimal data - for billing)
  quickCreate: async (name, phone) => {
    return await api.post('/customers/quick', { name, phone });
  },

  // Update customer
  update: async (id, data) => {
    return await api.put(`/customers/${id}`, data);
  },

  // Delete customer
  delete: async (id) => {
    return await api.delete(`/customers/${id}`);
  },

  // Update loyalty category
  updateLoyalty: async (id, category) => {
    return await api.patch(`/customers/${id}/loyalty`, { loyaltyCategory: category });
  },

  // Update credit limit
  updateCreditLimit: async (id, limit) => {
    return await api.patch(`/customers/${id}/credit-limit`, { creditLimit: limit });
  },
};

export default customerApi;
