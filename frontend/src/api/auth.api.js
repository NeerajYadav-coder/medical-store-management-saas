/**
 * api/auth.api.js
 * 
 * Authentication API endpoints
 */

import api from '@config/axios'

/**
 * Auth API functions
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (credentials) => {
    return await api.post('/auth/login', credentials)
  },

  /**
   * Register new store (OWNER signup)
   */
  register: async (registrationData) => {
    return await api.post('/auth/signup', registrationData)
  },

  /**
   * Logout user
   */
  logout: async () => {
    return await api.post('/auth/logout')
  },

  /**
   * Logout all devices
   */
  logoutAll: async () => {
    return await api.post('/auth/logout-all')
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    return await api.get('/auth/me')
  },

  /**
   * Refresh token
   */
  refreshToken: async () => {
    return await api.post('/auth/refresh')
  },

  /**
   * Send OTP (phone or email)
   * @param {'phone' | 'email'} type
   * @param {string} destination - phone number or email
   * @param {string} purpose - 'signup', 'login', 'reset_password'
   */
  sendOTP: async (type, destination, purpose = 'signup') => {
    return await api.post('/auth/send-otp', { type, destination, purpose })
  },

  /**
   * Verify OTP
   * @param {'phone' | 'email'} type
   * @param {string} destination
   * @param {string} otp
   * @param {string} purpose
   */
  verifyOTP: async (type, destination, otp, purpose = 'signup') => {
    return await api.post('/auth/verify-otp', { type, destination, otp, purpose })
  },

  /**
   * Check verification status
   * @param {'phone' | 'email'} type
   * @param {string} destination
   * @param {string} purpose
   */
  checkVerification: async (type, destination, purpose = 'signup') => {
    return await api.get('/auth/check-verification', {
      params: { type, destination, purpose },
    })
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email })
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    return await api.post('/auth/reset-password', { token, newPassword })
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    return await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
  },

  /**
   * Update profile
   */
  updateProfile: async (profileData) => {
    const isFormData = profileData instanceof FormData;
    return await api.put('/auth/profile', profileData, {
      headers: {
        'Content-Type': isFormData ? undefined : 'application/json'
      }
    })
  },

  /**
   * Verify email
   */
  verifyEmail: async (token) => {
    return await api.post('/auth/verify-email', { token })
  },
  /**
   * Create staff (OWNER only)
   */
  createStaff: async (staffData) => {
    return await api.post('/auth/staff', staffData)
  },

  /**
   * Get staff list (OWNER only)
   */
  getStaff: async () => {
    return await api.get('/auth/staff')
  },

  /**
   * Update staff member (OWNER only)
   */
  updateStaff: async (id, staffData) => {
    return await api.put(`/auth/staff/${id}`, staffData)
  },

  /**
   * Delete staff member (OWNER only)
   */
  deleteStaff: async (id) => {
    return await api.delete(`/auth/staff/${id}`)
  },

  /**
   * Check email uniqueness
   */
  checkEmailUniqueness: async (email, type) => {
    return await api.post('/auth/check-email-uniqueness', { email, type })
  },

  /**
   * Submit contact support ticket
   */
  submitSupportTicket: async (ticketData) => {
    return await api.post('/auth/contact', ticketData)
  },
}

export default authApi
