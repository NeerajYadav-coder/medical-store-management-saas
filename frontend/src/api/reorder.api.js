import api from '@config/axios';
 
export const reorderApi = {
  getSuggestions: async (status = 'pending', urgency = '') => {
    const response = await api.get('/reorder-suggestions', {
      params: { status, urgency }
    });
    return response.data;
  },
 
  getSummary: async () => {
    const response = await api.get('/reorder-suggestions/summary');
    return response.data;
  },
 
  actionSuggestion: async (id, data) => {
    const response = await api.post(`/reorder-suggestions/${id}/action`, data);
    return response.data;
  },
 
  updateSettings: async (data) => {
    const response = await api.post('/reorder-suggestions/admin/forecast-settings', data);
    return response.data;
  }
};
