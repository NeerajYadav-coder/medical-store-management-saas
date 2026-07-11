/**
 * API endpoints for Sales/Billing
 */

import api from '../config/axios';

const saleApi = {
  // Get all sales with pagination
  getAll: async (params = {}) => {
    return await api.get('/sales', { params });
  },

  // Get sale by ID
  getById: async (id) => {
    return await api.get(`/sales/${id}`);
  },

  // Get sale by bill number
  getByBillNumber: async (billNumber) => {
    return await api.get(`/sales/bill/${billNumber}`);
  },

  // Get today's sales
  getTodaySales: async () => {
    return await api.get('/sales/today');
  },

  // Get daily summary
  getDailySummary: async (date = null) => {
    const params = date ? { date } : {};
    return await api.get('/sales/summary/daily', { params });
  },

  // Get symptom-wise analysis
  getSymptomAnalysis: async (startDate, endDate) => {
    return await api.get('/sales/analysis/symptoms', { 
      params: { startDate, endDate } 
    });
  },

  // Get doctor-wise analysis
  getDoctorAnalysis: async (startDate, endDate) => {
    return await api.get('/sales/analysis/doctors', { 
      params: { startDate, endDate } 
    });
  },

  // Create sale (billing)
  create: async (data) => {
    if (!navigator.onLine) {
      // Offline mode: Queue transaction
      const { enqueueSync } = await import('../lib/offlineQueue');
      const record = await enqueueSync('/sales', data, 'POST');
      return { 
        data: { 
          success: true, 
          message: "Sale queued offline", 
          pendingSync: true,
          saleId: record.id
        } 
      };
    }

    try {
      return await api.post('/sales', data);
    } catch (error) {
      if (!error.response) { // Network error
        const { enqueueSync } = await import('../lib/offlineQueue');
        const record = await enqueueSync('/sales', data, 'POST');
        return { 
          data: { 
            success: true, 
            message: "Sale queued offline due to network failure", 
            pendingSync: true,
            saleId: record.id
          } 
        };
      }
      throw error;
    }
  },

  // Generate bill number
  generateBillNumber: async () => {
    return await api.get('/sales/generate-bill-number');
  },

  // Void sale
  void: async (id, reason) => {
    return await api.post(`/sales/${id}/void`, { reason });
  },

  // Return items
  returnItems: async (id, items, reason) => {
    return await api.post(`/sales/${id}/return`, { items, reason });
  },

  // Print bill
  printBill: async (id) => {
    return await api.get(`/sales/${id}/print`);
  },

  // Send bill via WhatsApp
  sendWhatsApp: async (id, phone) => {
    return await api.post(`/sales/${id}/whatsapp`, { phone });
  },
};

export default saleApi;
