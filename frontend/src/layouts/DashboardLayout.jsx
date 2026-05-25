/**
 * layouts/DashboardLayout.jsx
 * 
 * RESPONSIBILITY:
 * - Main dashboard layout with sidebar
 * - Header with user menu
 * - Responsive navigation
 * - Breadcrumbs and page structure
 */

import { useState, useEffect } from 'react'
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
import { cn } from '@/utils/cn'
import { useAuth } from '@context/AuthContext'
import { useUI, useSidebar, useTheme } from '@context/UIContext'
import { useStore } from '@context/StoreContext'
import { ROUTES, SIDEBAR_NAV_ITEMS } from '@config/routes.config'
import Button from '@components/common/Button'
import { Spinner } from '@components/common/Loader'

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
  const { isSidebarOpen, toggleSidebar, closeSidebar, isMobile } = useUI()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col shadow-2xl',
          'lg:relative lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
          <Link to={user?.role === 'STAFF' ? ROUTES.BILLING : ROUTES.DASHBOARD} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-700/50">
              {store?.logo ? (
                <img src={store.logo} alt="Store Logo" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )}
            </div>
            <div>
              <span className="font-bold text-lg">MedStore</span>
              <p className="text-xs text-slate-400 truncate max-w-[140px]">{storeName}</p>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = ICONS[item.icon]
              const isActive = location.pathname === item.path ||
                (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))
              const isFree = store?.plan !== 'PREMIUM'
              const isPremiumItem = item.path === ROUTES.REPORTS || item.path === ROUTES.AUDIT_LOGS

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-brand-600 text-white '
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                    <span>{item.label}</span>
                    {isFree && isPremiumItem && (
                      <Lock className="ml-auto h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
                    )}
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-danger-500 text-white">
                        3
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Alerts Card */}
        {user?.role !== 'STAFF' && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-warning-500/20 to-warning-600/10 border border-warning-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning-500/20">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">5 items expiring soon</p>
                <p className="text-xs text-slate-400 mt-1">Check inventory alerts</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb or page title */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {SIDEBAR_NAV_ITEMS.find(item =>
                  location.pathname === item.path ||
                  (item.path !== ROUTES.DASHBOARD && location.pathname.startsWith(item.path))
                )?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            {user?.role !== 'STAFF' && (
              <Button
                variant="primary"
                size="sm"
                className="hidden sm:flex"
                onClick={() => navigate(ROUTES.SALES_NEW)}
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
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger-500" />
                </button>

                {/* Notifications dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 hover:bg-gray-50 dark:bg-gray-950 cursor-pointer">
                          <p className="text-sm text-gray-900 dark:text-white">Low stock alert for Paracetamol</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 hours ago</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                      <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User menu */}
            <div className="user-menu relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsUserMenuOpen(!isUserMenuOpen)
                }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800"
              >
                <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  {user?.role !== 'STAFF' && (
                    <div className="py-1">
                      <Link
                        to={ROUTES.SETTINGS_USER}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-950"
                      >
                        <User className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <Link
                        to={ROUTES.SETTINGS_STORE}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-950"
                      >
                        <Store className="h-4 w-4" />
                        Store Settings
                      </Link>
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-950 w-full text-left"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Help & Support
                      </button>
                    </div>
                  )}
                  <div className={cn("pt-1", user?.role !== 'STAFF' && "border-t border-gray-100 dark:border-gray-800")}>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 w-full text-left"
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
        <main className="flex-1 overflow-auto p-2 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
