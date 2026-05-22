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
  const { data: stats, isLoading: isLoadingStats, isFetching, refetch } = useQuery({
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
  const trends = stats?.trends || []
  
  // Chart calculation
  let chartData = []
  if (dateRange === '7d') {
    chartData = trends.slice(-7)
  } else if (dateRange === '30d') {
    chartData = trends.slice(-30)
  } else {
    chartData = trends
  }
  const maxSales = Math.max(...chartData.map(d => d.sales), 1)

  // Weekly stats
  const thisWeekSales = trends.slice(-7).reduce((sum, d) => sum + (d.sales || 0), 0)
  const lastWeekSales = trends.slice(-14, -7).reduce((sum, d) => sum + (d.sales || 0), 0)
  const weeklyGrowth = lastWeekSales ? ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100 : 0

  const dashboardData = {
    todaySales: stats?.daily?.sales || 0,
    todayTransactions: stats?.daily?.bills || 0,
    lowStockCount: stats?.alerts?.lowStock || 0,
    expiringCount: stats?.alerts?.expiry || 0,
    pendingPurchases: 0, // Placeholder if backend doesn't support yet
    activeStaff: 0, // Placeholder
    
    // Trends
    salesGrowth: stats?.monthly?.sales > 0 ? (((stats?.daily?.sales || 0) - ((stats?.monthly?.sales || 0) / 30)) / ((stats?.monthly?.sales || 1) / 30)) * 100 : 0, 
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
            leftIcon={!isFetching ? <RefreshCcw className="h-4 w-4" /> : undefined}
            isLoading={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
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

            {/* Simple CSS Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-1 mt-6">
              {chartData.length > 0 ? (
                chartData.map((day, idx) => {
                  const heightPercent = Math.max((day.sales / maxSales) * 100, 2);
                  return (
                    <div key={idx} className="relative group w-full flex flex-col items-center justify-end h-full">
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                        {formatCurrency(day.sales)}<br/>
                        <span className="text-gray-300">{new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="w-full bg-brand-500 hover:bg-brand-600 rounded-t-sm transition-all duration-300" 
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-100 rounded-lg">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No sales data for this period</p>
                </div>
              )}
            </div>

            {/* Quick stats below chart */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(thisWeekSales)}</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats?.monthly?.sales || 0)}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
              <div className="text-center">
                <p className={cn("text-2xl font-bold", weeklyGrowth >= 0 ? "text-success-600" : "text-danger-600")}>
                  {weeklyGrowth > 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Growth (vs last wk)</p>
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
                    <p className="font-semibold text-gray-900">{formatCurrency(sale.grandTotal)}</p>
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
