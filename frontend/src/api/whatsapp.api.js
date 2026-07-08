/**
 * api/whatsapp.api.js
 * 
 * Client endpoints for Baileys Multi-Tenant WhatsApp Integration
 */

import api from '@config/axios'

export const whatsappApi = {
  /**
   * Get current WhatsApp connection status
   */
  getStatus: async () => {
    return await api.get('/whatsapp/status')
  },

  /**
   * Trigger Baileys connection / session startup
   */
  connectStore: async () => {
    return await api.post('/whatsapp/connect')
  },

  /**
   * Fetch current generated QR code in memory
   */
  getQR: async () => {
    return await api.get('/whatsapp/qr')
  },

  /**
   * Disconnect and clear active Baileys session
   */
  disconnectStore: async () => {
    return await api.post('/whatsapp/disconnect')
  },

  /**
   * Reconnect WhatsApp session
   */
  reconnectStore: async () => {
    return await api.post('/whatsapp/reconnect')
  },

  /**
   * Update notification settings/preferences
   */
  updateSettings: async (settings) => {
    return await api.post('/whatsapp/settings', settings)
  },

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
