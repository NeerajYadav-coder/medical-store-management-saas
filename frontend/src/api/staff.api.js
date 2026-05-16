/**
 * api/staff.api.js
 * 
 * RESPONSIBILITY:
 * - All staff management API calls
 * - OWNER-only operations
 */

import api from '@config/axios'

export const staffApi = {
  /**
   * Get all staff members
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {boolean} [params.active] - Filter by active status
   */
  getStaff: async (params = {}) => {
    return api.get('/auth/staff', { params })
  },

  /**
   * Get single staff member by ID
   * @param {string} id - Staff ID
   */
  getStaffById: async (id) => {
    return api.get(`/auth/staff/${id}`)
  },

  /**
   * Create new staff member
   * @param {Object} data
   * @param {string} data.name - Staff name
   * @param {string} data.email - Email (login ID)
   * @param {string} data.phone - Phone number
   * @param {string} data.password - Initial password
   * @param {string} [data.role] - Role/position
   * @param {Array} [data.permissions] - Custom permissions
   */
  createStaff: async (data) => {
    return api.post('/auth/staff', data)
  },

  /**
   * Update staff member
   * @param {string} id - Staff ID
   * @param {Object} data - Fields to update
   */
  updateStaff: async (id, data) => {
    return api.put(`/auth/staff/${id}`, data)
  },

  /**
   * Deactivate staff member
   * @param {string} id - Staff ID
   */
  deactivateStaff: async (id) => {
    return api.post(`/auth/staff/${id}/deactivate`)
  },

  /**
   * Activate staff member
   * @param {string} id - Staff ID
   */
  activateStaff: async (id) => {
    return api.post(`/auth/staff/${id}/activate`)
  },

  /**
   * Reset staff password
   * @param {string} id - Staff ID
   * @param {Object} data
   * @param {string} data.newPassword - New password
   */
  resetStaffPassword: async (id, data) => {
    return api.post(`/auth/staff/${id}/reset-password`, data)
  },

  /**
   * Get staff activity log
   * @param {string} id - Staff ID
   * @param {Object} params
   */
  getStaffActivity: async (id, params = {}) => {
    return api.get(`/auth/staff/${id}/activity`, { params })
  },

  /**
   * Get staff performance metrics
   * @param {string} id - Staff ID
   * @param {Object} params
   * @param {string} [params.period='month']
   */
  getStaffMetrics: async (id, params = {}) => {
    return api.get(`/auth/staff/${id}/metrics`, { params })
  },
}

export default staffApi
