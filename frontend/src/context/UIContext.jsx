/**
 * context/UIContext.jsx
 * 
 * RESPONSIBILITY:
 * - Global UI state (sidebar, modals, toasts)
 * - Theme management
 * - Responsive breakpoint tracking
 * 
 * WHAT BREAKS IF THIS DOESN'T EXIST:
 * - UI state scattered or duplicated
 * - No centralized modal/toast management
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast as hotToast } from 'react-hot-toast'

const UIContext = createContext(null)

/**
 * UI Provider Component
 */
export function UIProvider({ children }) {
  // ==================== SIDEBAR STATE ====================
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // ==================== MODAL STATE ====================
  const [activeModal, setActiveModal] = useState(null)
  const [modalProps, setModalProps] = useState({})

  // ==================== TOAST STATE ====================
  const [toasts, setToasts] = useState([])

  // ==================== THEME STATE ====================
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  // ==================== RESPONSIVE STATE ====================
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  // Track window size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setIsDesktop(width >= 1024)
      
      // Auto-close sidebar on mobile, auto-collapse on tablet, auto-expand on desktop
      if (width < 768) {
        setIsSidebarOpen(false)
        setIsSidebarCollapsed(false)
      } else if (width >= 768 && width < 1024) {
        setIsSidebarOpen(true)
        setIsSidebarCollapsed(true)
      } else {
        setIsSidebarOpen(true)
        setIsSidebarCollapsed(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    localStorage.setItem('theme', theme)
  }, [theme])

  // ==================== SIDEBAR ACTIONS ====================
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev)
  }, [])

  // ==================== MODAL ACTIONS ====================
  const openModal = useCallback((modalName, props = {}) => {
    setActiveModal(modalName)
    setModalProps(props)
  }, [])

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setModalProps({})
  }, [])

  // ==================== TOAST ACTIONS ====================
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience toast methods
  const toast = {
    success: (message, options = {}) => {
      addToast({ type: 'success', message, ...options })
      return hotToast.success(message, options)
    },
    error: (message, options = {}) => {
      addToast({ type: 'error', message, ...options })
      return hotToast.error(message, options)
    },
    warning: (message, options = {}) => {
      addToast({ type: 'warning', message, ...options })
      return hotToast(message, { icon: '⚠️', ...options })
    },
    info: (message, options = {}) => {
      addToast({ type: 'info', message, ...options })
      return hotToast(message, { icon: 'ℹ️', ...options })
    },
  }

  // ==================== THEME ACTIONS ====================
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const setLightTheme = useCallback(() => {
    setTheme('light')
  }, [])

  const setDarkTheme = useCallback(() => {
    setTheme('dark')
  }, [])

  const value = {
    // Sidebar
    isSidebarOpen,
    isSidebarCollapsed,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleSidebarCollapse,

    // Modal
    activeModal,
    modalProps,
    openModal,
    closeModal,
    isModalOpen: (name) => activeModal === name,

    // Toast
    toasts,
    addToast,
    removeToast,
    clearToasts,
    toast,

    // Theme
    theme,
    isDarkMode: theme === 'dark',
    toggleTheme,
    setLightTheme,
    setDarkTheme,

    // Responsive
    isMobile,
    isTablet,
    isDesktop,
  }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}

/**
 * Hook to access UI context
 */
export function useUI() {
  const context = useContext(UIContext)
  
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  
  return context
}

/**
 * Hook for sidebar state only
 */
export function useSidebar() {
  const { 
    isSidebarOpen, 
    isSidebarCollapsed, 
    toggleSidebar, 
    openSidebar, 
    closeSidebar,
    toggleSidebarCollapse,
  } = useUI()
  
  return { 
    isSidebarOpen, 
    isSidebarCollapsed, 
    toggleSidebar, 
    openSidebar, 
    closeSidebar,
    toggleSidebarCollapse,
  }
}

/**
 * Hook for modal state only
 */
export function useModal() {
  const { activeModal, modalProps, openModal, closeModal, isModalOpen } = useUI()
  return { activeModal, modalProps, openModal, closeModal, isModalOpen }
}

/**
 * Hook for toast only
 */
export function useToast() {
  const { toast, toasts, addToast, removeToast, clearToasts } = useUI()
  return { toast, toasts, addToast, removeToast, clearToasts }
}

/**
 * Hook for theme only
 */
export function useTheme() {
  const { theme, isDarkMode, toggleTheme, setLightTheme, setDarkTheme } = useUI()
  return { theme, isDarkMode, toggleTheme, setLightTheme, setDarkTheme }
}

/**
 * Hook for responsive state only
 */
export function useResponsive() {
  const { isMobile, isTablet, isDesktop } = useUI()
  return { isMobile, isTablet, isDesktop }
}

export default UIContext
