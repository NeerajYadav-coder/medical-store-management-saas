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

  // ==================== INITIAL AUTH CHECK ====================
  // ==================== INITIAL AUTH CHECK ====================
  useEffect(() => {
    // Prevent double execution in StrictMode
    if (initRef.current) return
    initRef.current = true

    const checkAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      try {
        const response = await authApi.getCurrentUser()
        const userData = response?.user || response
        setUser(userData)
      } catch (error) {
        // 401 is expected when not logged in - just set user to null
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    checkAuth()
  }, [])

  // ==================== EVENT LISTENERS ====================
  useEffect(() => {
    const handleUnauthorized = () => {
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
      const userData = response?.user || response
      
      // Save token if present
      if (response?.token) {
        localStorage.setItem('token', response.token)
      }
      
      setUser(userData)
      
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
