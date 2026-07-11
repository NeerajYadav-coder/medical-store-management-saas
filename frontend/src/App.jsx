/**
 * App.jsx
 * 
 * Main application component
 * - Route definitions
 * - Layout switching
 * - Protected/Public route guards
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { ROUTES } from '@config/routes.config'
import { PageLoader } from '@components/common/Loader'

// Layouts
import AuthLayout from '@layouts/AuthLayout'
import DashboardLayout from '@layouts/DashboardLayout'

// Auth Pages (Lazy)
const Register = lazy(() => import('@pages/auth/Register'))
const ForgotPassword = lazy(() => import('@pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@pages/auth/ResetPassword'))
const LandingPage = lazy(() => import('@pages/LandingPage'))
const PrivacyPolicy = lazy(() => import('@pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('@pages/TermsOfService'))
const ContactSupport = lazy(() => import('@pages/ContactSupport'))

// Dashboard Pages (Lazy)
const DashboardHome = lazy(() => import('@pages/dashboard/DashboardHome'))
const Inventory = lazy(() => import('@pages/dashboard/Inventory'))
const Sales = lazy(() => import('@pages/dashboard/Sales'))
const Purchase = lazy(() => import('@pages/dashboard/Purchase'))
const Staff = lazy(() => import('@pages/dashboard/Staff'))
const Reports = lazy(() => import('@pages/dashboard/Reports'))
const ActivityLogs = lazy(() => import('@pages/dashboard/ActivityLogs'))

// Smart Feature Pages (Lazy)
const BillingPage = lazy(() => import('@pages/billing/BillingPage'))
const CustomersPage = lazy(() => import('@pages/customers/CustomersPage'))
const SuppliersPage = lazy(() => import('@pages/suppliers/SuppliersPage'))

// Settings Pages (Lazy)
const StoreSettings = lazy(() => import('@pages/settings/StoreSettings'))
const UserSettings = lazy(() => import('@pages/settings/UserSettings'))
const HelpSupport = lazy(() => import('@pages/settings/HelpSupport'))

// Error Pages (Lazy)
const NotFound = lazy(() => import('@pages/NotFound'))

/**
 * Protected Route Guard
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized, isLoadingUser, user } = useAuth()
  const location = useLocation()

  // Show loader while checking auth
  if (!isInitialized || isLoadingUser) {
    return <PageLoader text="Loading..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // If staff, restrict access ONLY to billing and purchase routes
  if (user?.role === 'STAFF' && 
      !location.pathname.startsWith('/dashboard/billing') && 
      !location.pathname.startsWith('/dashboard/purchase')) {
    return <Navigate to="/dashboard/billing" replace />
  }

  return children
}

/**
 * Public Route Guard
 * Redirects to dashboard if already authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isInitialized, isLoadingUser, user } = useAuth()

  // Show loader while checking auth
  if (!isInitialized || isLoadingUser) {
    return <PageLoader text="Loading..." />
  }

  // Redirect to appropriate page if already authenticated
  if (isAuthenticated) {
    const to = user?.role === 'STAFF' ? '/dashboard/billing' : ROUTES.DASHBOARD
    return <Navigate to={to} replace />
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
    <Suspense fallback={<PageLoader text="Loading..." />}>
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

        {/* Public Routes (Register, Forgot Password, Reset Password) - Using AuthLayout */}
        <Route
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        </Route>

        {/* Policy & Support Routes */}
        <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
        <Route path={ROUTES.TERMS} element={<TermsOfService />} />
        <Route path={ROUTES.SUPPORT} element={<ContactSupport />} />

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
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
