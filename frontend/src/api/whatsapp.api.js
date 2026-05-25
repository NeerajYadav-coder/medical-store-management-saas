/**
 * api/whatsapp.api.js
 * 
 * Client endpoints for WhatsApp notification settings and log retrieval
 */

import api from '@config/axios'

export const whatsappApi = {
  /**
   * Get WhatsApp logs
   * @param {object} params - Query params (page, limit, status, messageType)
   */
  getLogs: async (params) => {
    return await api.get('/whatsapp/logs', { params })
  },

  /**
   * Trigger manual test of the daily report
   */
  sendTestDailyReport: async () => {
    return await api.post('/whatsapp/test-daily-report')
  },

  /**
   * Trigger manual check/run for refill reminders
   */
  sendTestRefillReminders: async () => {
    return await api.post('/whatsapp/test-refill-reminders')
  },

  /**
   * Send promotional campaign
   * @param {object} data - { cohort, messageText }
   */
  sendPromotionCampaign: async (data) => {
    return await api.post('/whatsapp/promotions', data)
  }
}
