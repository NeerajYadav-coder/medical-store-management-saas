/**
 * context/AuthContext.jsx
 * 
 * RESPONSIBILITY:
 * - Global authentication state management
 * - Session validation and persistence
 * - Login/logout flow orchestration
 * - Protected route access control
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '@api/auth.api'
import { ROUTES } from '@config/routes.config'
import { PERMISSIONS } from '@config/permissions'

// Auth context
const AuthContext = createContext(null)

/**
 * Auth Provider Component
 * Wraps the app and provides auth state to all children
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Auth state
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Mutation states
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [signupError, setSignupError] = useState(null)

  // Prevent double initialization
  const initRef = useRef(false)
  // Track whether we're in the middle of the initial auth check
  const isCheckingAuthRef = useRef(false)

  // ==================== INITIAL AUTH CHECK ====================
  useEffect(() => {
    // Prevent double execution in StrictMode
    if (initRef.current) return
    initRef.current = true

    const checkAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        // No token stored → user is definitely not logged in
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      isCheckingAuthRef.current = true
      try {
        const response = await authApi.getCurrentUser()
        // /auth/me returns { success: true, user: {...} } — no 'data' key
        // so axios interceptor returns the full object
        const userData = response?.user || response
        // /auth/me returns full Mongoose doc with _id
        if (userData && (userData._id || userData.id)) {
          setUser(userData)
        } else {
          // Unexpected response shape — treat as unauthenticated
          localStorage.removeItem('token')
          setUser(null)
        }
      } catch (error) {
        // 401 / network error → clear stale token, user stays null
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        isCheckingAuthRef.current = false
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    checkAuth()
  }, [])

  // ==================== EVENT LISTENERS ====================
  useEffect(() => {
    const handleUnauthorized = () => {
      // Don't act on 401s that happen during the initial auth check —
      // those are handled by checkAuth() itself.
      // Also don't fire if user was never authenticated (no token in storage)
      if (isCheckingAuthRef.current) return
      if (!localStorage.getItem('token')) return

      setUser(null)
      localStorage.removeItem('token')
      navigate(ROUTES.LOGIN, { 
        replace: true,
        state: { message: 'Session expired. Please login again.' }
      })
    }

    const handleForbidden = () => {
      navigate(ROUTES.FORBIDDEN || ROUTES.DASHBOARD)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    window.addEventListener('auth:forbidden', handleForbidden)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
      window.removeEventListener('auth:forbidden', handleForbidden)
    }
  }, [navigate])

  // ==================== LOGIN ====================
  const login = useCallback(async (credentials) => {
    setIsLoggingIn(true)
    setLoginError(null)
    
    try {
      const response = await authApi.login(credentials)
      // Login returns { success, token, user } — no 'data' key
      // axios interceptor returns the full object since there's no 'data' key
      const token = response?.token || response?.data?.token
      // login returns { user: { id, name, role, medicalStoreId } } — note 'id' not '_id'
      const userData = response?.user || response?.data?.user
      
      // Save token — this is what persists the session across refreshes
      if (token) {
        localStorage.setItem('token', token)
      }
      
      // Accept both 'id' and '_id' shapes from the server
      if (userData && (userData._id || userData.id)) {
        setUser(userData)
      }
      
      // Navigate to intended destination or dashboard
      const from = location.state?.from?.pathname || ROUTES.DASHBOARD
      navigate(from, { replace: true })
      
      return userData
    } catch (error) {
      localStorage.removeItem('token') // Clear potential stale token
      setLoginError(error)
      throw error
    } finally {
      setIsLoggingIn(false)
    }
  }, [navigate, location.state])

  // ==================== LOGOUT ====================
  const logout = useCallback(async () => {
    setIsLoggingOut(true)
    
    try {
      await authApi.logout()
    } catch (error) {
      // Logout anyway even if API fails
      console.error('[Auth] Logout API error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setIsLoggingOut(false)
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }, [navigate])

  // ==================== SIGNUP ====================
  const signup = useCallback(async (registrationData) => {
    setIsSigningUp(true)
    setSignupError(null)
    
    try {
      const response = await authApi.register(registrationData)
      
      // Save token if present (some flows auto-login after signup)
      if (response?.token) {
        localStorage.setItem('token', response.token)
      }
      
      // After signup, redirect to login with success message
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { message: 'Account created successfully! Please login.' },
      })
      
      return response
    } catch (error) {
      localStorage.removeItem('token')
      setSignupError(error)
      throw error
    } finally {
      setIsSigningUp(false)
    }
  }, [navigate])

  // ==================== REFETCH USER ====================
  const refetchUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser()
      const userData = response?.user || response
      setUser(userData)
      return userData
    } catch (error) {
      setUser(null)
      throw error
    }
  }, [])

  // ==================== COMPUTED VALUES ====================
  const isAuthenticated = !!user
  const isOwner = user?.role === 'OWNER'
  const isStaff = user?.role === 'STAFF'

  // Permission helper
  // Owner has all permissions implicitly
  const hasPermission = useCallback((permission) => {
    if (!user) return false
    if (user.role === 'OWNER') return true 
    
    return user.permissions?.includes(permission) || false
  }, [user])

  // ==================== CONTEXT VALUE ====================
  const value = {
    // User state
    user,
    isAuthenticated,
    isInitialized,
    isLoadingUser: isLoading,
    isOwner,
    isStaff,
    hasPermission,
    PERMISSIONS, // Expose constants for convenience

    // Auth actions
    login,
    logout,
    signup,
    refetchUser,

    // Mutation states
    isLoggingIn,
    isLoggingOut,
    isSigningUp,
    loginError,
    signupError,

    // Clear errors
    clearLoginError: () => setLoginError(null),
    clearSignupError: () => setSignupError(null),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 * @returns Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isInitialized, isLoadingUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (isInitialized && !isLoadingUser && !isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { from: location },
      })
    }
  }, [isAuthenticated, isInitialized, isLoadingUser, navigate, location])

  return { isAuthenticated, isInitialized, isLoadingUser }
}

/**
 * Hook to require specific role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function useRequireRole(allowedRoles) {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const navigate = useNavigate()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && !hasRedirectedRef.current) {
      if (!allowedRoles.includes(user.role)) {
        hasRedirectedRef.current = true
        navigate(ROUTES.FORBIDDEN, { replace: true })
      }
    }
  }, [user, isAuthenticated, isInitialized, allowedRoles, navigate])

  return { hasAccess: allowedRoles.includes(user?.role) }
}

export default AuthContext
