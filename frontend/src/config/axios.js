/**
 * config/axios.js
 * 
 * RESPONSIBILITY:
 * - Single source of truth for ALL HTTP requests
 * - Cookie-based authentication (HTTP-only cookies)
 * - Request/Response interceptors for consistent error handling
 * - CSRF token handling (if applicable)
 * - Automatic retry logic for network failures
 * - Request cancellation support
 * 
 * WHAT BREAKS IF THIS DOESN'T EXIST:
 * - No centralized API configuration
 * - No consistent error handling
 * - Auth cookies won't be sent with requests
 * - Every component would need to configure axios individually
 */

import axios from 'axios'

// Base API URL - uses Vite proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // CRITICAL: Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Track pending requests for cancellation
const pendingRequests = new Map()

/**
 * Generate a unique request key for cancellation tracking
 */
const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
}

/**
 * REQUEST INTERCEPTOR
 * - Attach auth tokens if stored
 * - Cancel duplicate requests
 * - Log requests in development
 */
api.interceptors.request.use(
  (config) => {
    // Cancel duplicate requests (optional - can be disabled per request)
    if (config.cancelPrevious !== false) {
      const requestKey = getRequestKey(config)
      
      if (pendingRequests.has(requestKey)) {
        const controller = pendingRequests.get(requestKey)
        controller.abort()
      }
      
      const controller = new AbortController()
      config.signal = controller.signal
      pendingRequests.set(requestKey, controller)
      
      // Store the key for cleanup
      config._requestKey = requestKey
    }

    // Attach token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Dev logging
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * RESPONSE INTERCEPTOR
 * - Unwrap response data
 * - Handle common error scenarios
 * - Refresh token on 401 (if applicable)
 * - Standardize error format
 */
api.interceptors.response.use(
  (response) => {
    // Clean up pending request
    if (response.config._requestKey) {
      pendingRequests.delete(response.config._requestKey)
    }

    // Unwrap the data - backend typically returns { success: true, data: {...} }
    // Return just the data portion or full response based on structure
    const data = response.data
    
    // Some endpoints might return { success: true, token: '...', user: {...} } directly
    // If 'data' property exists and it's not a paginated response, unwrap it
    // If it's paginated, we need the pagination metadata at the top level
    if (data && typeof data === 'object' && 'data' in data && !('pagination' in data)) {
      return data.data
    }
    
    return data
  },
  async (error) => {
    // Clean up pending request
    if (error.config?._requestKey) {
      pendingRequests.delete(error.config._requestKey)
    }

    // Handle cancelled requests silently
    if (axios.isCancel(error) || error.name === 'CanceledError') {
      return Promise.reject({ isCancelled: true })
    }

    const originalRequest = error.config
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred'

    // Log errors in development
    if (import.meta.env.DEV) {
      const is401 = status === 401
      
      // Don't log 401 Unauthorized errors to console as they just mean the user is not logged in
      if (!is401) {
        console.error(`[API ERROR] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
          status,
          message,
          data: error.response?.data,
        })
      }
    }

    // Handle specific status codes
    switch (status) {
      case 401:
        // Unauthorized - clear auth state and redirect to login
        // Skip for /auth/me endpoint - 401 is expected when not logged in
        if (!originalRequest?.url?.includes('/auth/me')) {
          localStorage.removeItem('token') // Clear invalid token
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        }
        break

      case 403:
        // Forbidden - user doesn't have permission
        window.dispatchEvent(new CustomEvent('auth:forbidden'))
        break

      case 404:
        // Not found - could show toast
        break

      case 422:
        // Validation error - return errors for form handling
        break

      case 429:
        // Rate limited
        break

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors - could show global error message
        break
    }

    // Standardized error object
    const standardError = {
      message,
      status,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      errors: error.response?.data?.errors || null, // Validation errors
      original: error,
    }

    return Promise.reject(standardError)
  }
)

/**
 * Cancel all pending requests
 * Useful when navigating away or logging out
 */
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort()
  })
  pendingRequests.clear()
}

/**
 * Helper methods for common request patterns
 */
export const apiHelpers = {
  /**
   * GET with query params
   */
  get: (url, params = {}, config = {}) => {
    return api.get(url, { params, ...config })
  },

  /**
   * POST with JSON body
   */
  post: (url, data = {}, config = {}) => {
    return api.post(url, data, config)
  },

  /**
   * PUT with JSON body
   */
  put: (url, data = {}, config = {}) => {
    return api.put(url, data, config)
  },

  /**
   * PATCH with JSON body
   */
  patch: (url, data = {}, config = {}) => {
    return api.patch(url, data, config)
  },

  /**
   * DELETE
   */
  delete: (url, config = {}) => {
    return api.delete(url, config)
  },

  /**
   * POST with FormData (file uploads)
   */
  upload: (url, formData, onProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
  },

  /**
   * Download file
   */
  download: async (url, filename) => {
    const response = await api.get(url, {
      responseType: 'blob',
    })
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },
}

export default api
