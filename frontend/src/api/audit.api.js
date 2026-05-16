/**
 * api/audit.api.js
 * 
 * Audit Logs API client
 */

import api from '@config/axios'

export const auditApi = {
  /**
   * Get audit logs
   * @param {object} params - Query params (page, limit, entity, action, etc.)
   */
  getLogs: async (params) => {
    return await api.get('/audit', { params })
  },
}
