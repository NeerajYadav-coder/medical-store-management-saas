/**
 * pages/dashboard/DashboardHome.jsx
 * 
 * RESPONSIBILITY:
 * - Dashboard overview with stats and charts
 * - Quick actions
 * - Recent activity
 * - Alerts and notifications
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Bell,
  RefreshCcw,
  IndianRupee,
  Calendar,
  Users,
  Truck,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatCurrency, formatCompactCurrency } from '@utils/formatCurrency'
import { formatDate, formatRelativeTime, getDaysUntil } from '@utils/formatDate'
import { useAuth } from '@context/AuthContext'
import { useStore } from '@context/StoreContext'
import { reportsApi } from '@api/reports.api'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'
import { Skeleton, SkeletonCard } from '@components/common/Loader'
import StatsCard from '@components/dashboard/StatsCard'

/**
 * Dashboard Home Page
 */
export default function DashboardHome() {
  const { user, hasPermission } = useAuth()
  const { storeName } = useStore()
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState('today')

  // Fetch dashboard stats (Unified Request)
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: reportsApi.getDashboardStats,
    staleTime: 60 * 1000, // 1 minute
  })

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }
  
  // Map real data to UI props
  const dashboardData = {
    todaySales: stats?.daily?.sales || 0,
    todayTransactions: stats?.daily?.bills || 0,
    lowStockCount: stats?.alerts?.lowStock || 0,
    expiringCount: stats?.alerts?.expiry || 0,
    pendingPurchases: 0, // Placeholder if backend doesn't support yet
    activeStaff: 0, // Placeholder
    
    // Trends (Simplified logic)
    salesGrowth: stats?.monthly?.sales > 0 ? ((stats?.daily?.sales / (stats?.monthly?.sales / 30)) * 100) : 0, 
    transactionsGrowth: 0,
    
    // Activity & Alerts
    alerts: stats?.alerts?.latest || [],
    recentSales: stats?.recentActivity || []
  }

  // Check permissions
  const showFinancials = hasPermission('VIEW_FULL_DASHBOARD')
  const canAddInventory = hasPermission('MANAGE_INVENTORY')
  const canPurchase = hasPermission('MANAGE_PURCHASES')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening at {storeName} today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCcw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.BILLING)}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showFinancials && (
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(dashboardData.todaySales)}
          icon={<IndianRupee className="h-5 w-5" />}
          iconBg="bg-success-100"
          iconColor="text-success-600"
          trend={{
            value: dashboardData.salesGrowth,
            label: 'vs avg daily',
            isPositive: dashboardData.salesGrowth >= 0,
          }}
          isLoading={isLoadingStats}
        />
        )}

        <StatsCard
          title="Transactions"
          value={dashboardData.todayTransactions}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconBg="bg-brand-100"
          iconColor="text-brand-600"
          trend={{
            value: dashboardData.transactionsGrowth,
            label: 'vs yesterday',
            isPositive: true,
          }}
          isLoading={isLoadingStats}
        />

        <StatsCard
          title="Low Stock Items"
          value={dashboardData.lowStockCount}
          icon={<Package className="h-5 w-5" />}
          iconBg="bg-warning-100"
          iconColor="text-warning-600"
          action={{
            label: 'View Items',
            href: ROUTES.INVENTORY + '?filter=low-stock',
          }}
          isLoading={isLoadingStats}
        />

        <StatsCard
          title="Expiring Soon"
          value={dashboardData.expiringCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-danger-100"
          iconColor="text-danger-600"
          action={{
            label: 'View All',
            href: ROUTES.INVENTORY + '?filter=expiring',
          }}
          isLoading={isLoadingStats}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart Placeholder */}
          {showFinancials && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
                <p className="text-sm text-gray-500">Revenue trend for the last 7 days</p>
              </div>
              <div className="flex items-center gap-2">
                {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                      dateRange === range
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                    onClick={() => setDateRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart placeholder */}
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sales chart will appear here</p>
                <p className="text-xs text-gray-400 mt-1">Integration with backend pending</p>
              </div>
            </div>

            {/* Quick stats below chart */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats?.weekly?.sales || 0)}</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats?.monthly?.sales || 0)}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600">+18.2%</p>
                <p className="text-sm text-gray-500">Growth</p>
              </div>
            </div>
          </div>
          )}

          {/* Recent Sales */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
              <Link
                to={ROUTES.SALES}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {dashboardData.recentSales.length > 0 ? (
                dashboardData.recentSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{sale.customerName || sale.customerId?.name || 'Walk-in Customer'}</p>
                        <p className="text-sm text-gray-500">
                          {sale.totalItems} item{sale.totalItems !== 1 ? 's' : ''} • {formatRelativeTime(sale.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(sale.finalAmount)}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No recent sales found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-600">
                {dashboardData.alerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {dashboardData.alerts.length > 0 ? (
                dashboardData.alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert._id}
                    className={cn(
                      'p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-gray-50',
                      alert.priority === 'CRITICAL' || alert.priority === 'HIGH'
                        ? 'bg-danger-50 border-danger-500'
                        : 'bg-warning-50 border-warning-500'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={cn(
                          'h-4 w-4 mt-0.5 flex-shrink-0',
                          alert.priority === 'CRITICAL' || alert.priority === 'HIGH' ? 'text-danger-600' : 'text-warning-600'
                        )}
                      />
                      <p className="text-sm text-gray-700">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  All good! No pending alerts.
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              View All Alerts
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Link
                to={ROUTES.BILLING}
                className="flex flex-col items-center p-4 rounded-xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
              >
                <ShoppingCart className="h-6 w-6 text-brand-600 mb-2" />
                <span className="text-sm font-medium text-brand-700">New Sale</span>
              </Link>

              {canAddInventory && (
              <Link
                to={ROUTES.INVENTORY_ADD}
                className="flex flex-col items-center p-4 rounded-xl bg-success-50 border border-success-100 hover:bg-success-100 transition-colors"
              >
                <Package className="h-6 w-6 text-success-600 mb-2" />
                <span className="text-sm font-medium text-success-700">Add Medicine</span>
              </Link>
              )}

              {canPurchase && (
              <Link
                to={ROUTES.PURCHASE_NEW}
                className="flex flex-col items-center p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                <Truck className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-700">New Purchase</span>
              </Link>
              )}

              {showFinancials && (
              <Link
                to={ROUTES.REPORTS}
                className="flex flex-col items-center p-4 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-700">View Reports</span>
              </Link>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Today's Summary</h3>
                <p className="text-sm text-brand-100">{formatDate(new Date())}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-brand-100">Total Sales</span>
                <span className="font-semibold">{formatCurrency(dashboardData.todaySales)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-100">Transactions</span>
                <span className="font-semibold">{dashboardData.todayTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-100">Pending Orders</span>
                <span className="font-semibold">{dashboardData.pendingPurchases}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-brand-500">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-200" />
                <span className="text-sm text-brand-100">
                  {dashboardData.activeStaff} staff members active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
