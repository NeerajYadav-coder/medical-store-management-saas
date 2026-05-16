/**
 * App.jsx
 * 
 * Main application component
 * - Route definitions
 * - Layout switching
 * - Protected/Public route guards
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { ROUTES } from '@config/routes.config'
import { PageLoader } from '@components/common/Loader'

// Layouts
import AuthLayout from '@layouts/AuthLayout'
import DashboardLayout from '@layouts/DashboardLayout'

// Auth Pages
// Login is now handled by LandingPage
import Register from '@pages/auth/Register'
import LandingPage from '@pages/LandingPage'

// Dashboard Pages
import DashboardHome from '@pages/dashboard/DashboardHome'
import Inventory from '@pages/dashboard/Inventory'
import Sales from '@pages/dashboard/Sales'
import Purchase from '@pages/dashboard/Purchase'
import Staff from '@pages/dashboard/Staff'
import Reports from '@pages/dashboard/Reports'
import ActivityLogs from '@pages/dashboard/ActivityLogs'

// Smart Feature Pages
import BillingPage from '@pages/billing/BillingPage'
import CustomersPage from '@pages/customers/CustomersPage'
import SuppliersPage from '@pages/suppliers/SuppliersPage'

// Settings Pages
import StoreSettings from '@pages/settings/StoreSettings'
import UserSettings from '@pages/settings/UserSettings'

// Error Pages
import NotFound from '@pages/NotFound'

/**
 * Protected Route Guard
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized, isLoadingUser } = useAuth()
  const location = useLocation()

  // Show loader while checking auth
  if (!isInitialized || isLoadingUser) {
    return <PageLoader text="Loading..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return children
}

/**
 * Public Route Guard
 * Redirects to dashboard if already authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isInitialized, isLoadingUser } = useAuth()

  // Show loader while checking auth
  if (!isInitialized || isLoadingUser) {
    return <PageLoader text="Loading..." />
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}

/**
 * Owner Only Route Guard
 */
function OwnerRoute({ children }) {
  const { user, isOwner } = useAuth()

  if (!isOwner) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes (Landing Page/Login) */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } 
      />

      <Route 
        path={ROUTES.LOGIN} 
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } 
      />

      {/* Public Routes (Register) - Using AuthLayout */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path={ROUTES.REGISTER} element={<Register />} />
      </Route>

      {/* Protected Routes (Dashboard) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="purchase" element={<Purchase />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route
          path="staff"
          element={
            <OwnerRoute>
              <Staff />
            </OwnerRoute>
          }
        />
        <Route path="audit-logs" element={<OwnerRoute><ActivityLogs /></OwnerRoute>} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings">
          <Route path="store" element={<OwnerRoute><StoreSettings /></OwnerRoute>} />
          <Route path="user" element={<UserSettings />} />
        </Route>
      </Route>

      {/* Default redirects */}


      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
