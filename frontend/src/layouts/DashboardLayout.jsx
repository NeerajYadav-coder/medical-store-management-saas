/**
 * layouts/DashboardLayout.jsx
 * 
 * RESPONSIBILITY:
 * - Main dashboard layout with sidebar
 * - Header with user menu
 * - Responsive navigation
 * - Breadcrumbs and page structure
 */

import { useState, useEffect, useRef, Suspense } from 'react'
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Store,
  Moon,
  Sun,
  HelpCircle,
  AlertTriangle,
  Lock,
  Building2,
  FileText,
} from 'lucide-react'
import { getImageUrl } from '@/utils/image'
import { cn } from '@/utils/cn'
import { useAuth } from '@context/AuthContext'
import { useUI, useSidebar, useTheme } from '@context/UIContext'
import { useStore } from '@context/StoreContext'
import { ROUTES, SIDEBAR_NAV_ITEMS } from '@config/routes.config'
import Button from '@components/common/Button'
import { Spinner } from '@components/common/Loader'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@api/reports.api'
import OfflineIndicator from '@components/common/OfflineIndicator'

// Icon mapping
const ICONS = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Building2,
  FileText,
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isLoggingOut, hasPermission } = useAuth()
  const { store, storeName } = useStore()
  const { isSidebarOpen, toggleSidebar, closeSidebar, isMobile, isSidebarCollapsed, toggleSidebarCollapse } = useUI()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Fetch stats from backend for alerts and notifications count
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: reportsApi.getDashboardStats,
    staleTime: 60 * 1000, // 1 minute
  })

  const expiringCount = stats?.alerts?.expiry || 0
  const latestAlerts = stats?.alerts?.latest || []

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      closeSidebar()
    }
  }, [location.pathname, isMobile, closeSidebar])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu')) setIsUserMenuOpen(false)
      if (!e.target.closest('.notifications-menu')) setIsNotificationsOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  // Filter nav items based on user role
  const filteredNavItems = SIDEBAR_NAV_ITEMS.filter(
    (item) => {
      if (user?.role === 'STAFF') {
        return item.path === ROUTES.BILLING || item.path === ROUTES.PURCHASE
      }
      return !item.permission || hasPermission(item.permission)
    }
  )

  const isBillingPage = location.pathname === ROUTES.BILLING || location.pathname === '/dashboard/billing'

  // Swipe-to-close handling with useRef to prevent stale closures
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  const handleTouchStart = (e) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50
    if (distance > minSwipeDistance) {
      closeSidebar()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  if (isBillingPage) {
    return (
      <div className="h-screen w-screen bg-gray-150 dark:bg-gray-950">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'sidebar',
          isSidebarCollapsed ? 'sidebar-collapsed' : 'w-72',
          'flex flex-col shadow-xl md:shadow-none',
          'md:relative md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/50">
          <Link to={user?.role === 'STAFF' ? ROUTES.BILLING : ROUTES.DASHBOARD} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0 text-primary">
              {store?.logo ? (
                <img src={getImageUrl(store.logo)} alt="Store Logo" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div>
                <span className="font-semibold text-lg text-foreground tracking-tight">MedStore</span>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{storeName}</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="md:hidden p-2.5 rounded-xl bg-gray-150 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground relative z-[60] cursor-pointer shadow-sm flex items-center justify-center border border-border/50 overflow-hidden"
            aria-label="Close Sidebar"
          >
            {/* Invisible full-cover hit-box to prevent SVG from swallowing touch events on Android Chrome */}
            <div 
              className="absolute inset-0 z-10 w-full h-full bg-transparent" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeSidebar();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeSidebar();
              }}
            />
            <X className="h-5 w-5 relative z-0 pointer-events-none" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = ICONS[item.icon]
              const isActive = location.pathname === item.path || 
                               (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'sidebar-nav-item',
                      isActive && 'sidebar-nav-item-active'
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                    <span>{item.label}</span>
                    {item.badge && stats?.alerts?.total > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-danger-500 text-white">
                        {stats.alerts.total}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Alerts Card */}
        {!isSidebarCollapsed && user?.role !== 'STAFF' && expiringCount > 0 && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-warning-500/20 to-warning-600/10 border border-warning-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning-500/20">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{expiringCount} item{expiringCount !== 1 ? 's' : ''} expiring soon</p>
                <p className="text-xs text-slate-400 mt-1">Check inventory alerts</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 overflow-hidden">
              {user?.profilePhoto ? (
                <img src={getImageUrl(user.profilePhoto)} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors shrink-0"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-40">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Sidebar Collapse Toggle (Desktop/Tablet) */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:flex p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb or page title */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {SIDEBAR_NAV_ITEMS.find(item => 
                  location.pathname === item.path || 
                  (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))
                )?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            
            <div className="hidden md:block mr-2">
              <OfflineIndicator />
            </div>
            {/* Quick Actions */}
            {user?.role !== 'STAFF' && (
              <Button
                variant="primary"
                size="sm"
                className="hidden sm:flex"
                onClick={() => navigate(ROUTES.BILLING)}
              >
                + New Sale
              </Button>
            )}

            {/* Notifications */}
            {user?.role !== 'STAFF' && (
              <div className="notifications-menu relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsNotificationsOpen(!isNotificationsOpen)
                  }}
                  className="relative p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {latestAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger-500" />
                  )}
                </button>

                {/* Notifications dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card rounded-2xl shadow-elevated border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-border/50">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {latestAlerts.length > 0 ? (
                        latestAlerts.slice(0, 5).map((alert) => (
                          <div key={alert._id} className="px-4 py-3 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-700 cursor-pointer">
                            <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          All good! No pending alerts.
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                      <button
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          navigate(ROUTES.INVENTORY + '?filter=expiring')
                        }}
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle (Header) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User menu */}
            <div className="user-menu relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsUserMenuOpen(!isUserMenuOpen)
                }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold overflow-hidden">
                  {user?.profilePhoto ? (
                    <img src={getImageUrl(user.profilePhoto)} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-elevated border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="font-semibold text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  {user?.role !== 'STAFF' && (
                    <div className="py-1">
                      <Link
                        to={ROUTES.ROUTES?.SETTINGS_USER || ROUTES.SETTINGS_USER}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-700"
                      >
                        <User className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <Link
                        to={ROUTES.SETTINGS_STORE}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-700"
                      >
                        <Store className="h-4 w-4" />
                        Store Settings
                      </Link>
                      <Link
                        to="/dashboard/help"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-700 w-full text-left"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Help & Support
                      </Link>
                    </div>
                  )}
                  <div className={cn("pt-1", user?.role !== 'STAFF' && "border-t border-gray-100 dark:border-gray-800")}>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 w-full text-left"
                    >
                      {isLoggingOut ? (
                        <Spinner size="sm" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 relative">
          <Suspense fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-50">
              <Spinner size="lg" className="text-brand-600" />
              <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading module...</p>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
