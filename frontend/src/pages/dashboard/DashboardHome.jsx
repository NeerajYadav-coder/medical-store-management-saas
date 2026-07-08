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
import ReorderSuggestionsWidget from '@components/dashboard/ReorderSuggestionsWidget'

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
    pendingPurchases: stats?.pendingPurchases || 0,
    activeStaff: stats?.activeStaff || 0,
    
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
          <h1 className="text-apple-title-1 font-semibold text-label-primary tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-apple-subheadline text-label-secondary mt-1">
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
            className="text-apple-subheadline font-medium"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.BILLING)}
            className="text-apple-subheadline font-semibold"
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
          iconBg="bg-system-green/10"
          iconColor="text-system-green"
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
          iconBg="bg-system-blue/10"
          iconColor="text-system-blue"
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
          iconBg="bg-system-orange/10"
          iconColor="text-system-orange"
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
          iconBg="bg-system-red/10"
          iconColor="text-system-red"
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
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="card-title">Sales Overview</h3>
                <p className="card-description">Revenue trend for the last 7 days</p>
              </div>
              <div className="flex items-center gap-1 bg-secondary-background p-1 rounded-xl border border-separator-apple/10">
                {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    className={cn(
                      'px-3 py-1.5 text-apple-footnote font-semibold rounded-lg transition-apple-micro active-apple-press',
                      dateRange === range
                        ? 'bg-system-blue text-white shadow-sm'
                        : 'text-label-secondary hover:text-label-primary'
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
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-label-primary text-system-background text-apple-footnote py-1.5 px-2.5 rounded-xl shadow-dropdown z-10 pointer-events-none text-center">
                        <span className="font-semibold text-tabular-nums">{formatCurrency(day.sales)}</span><br/>
                        <span className="text-[10px] text-label-secondary">{new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="w-full bg-system-blue hover:bg-system-blue/85 rounded-t-md transition-apple-default" 
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-label-secondary bg-secondary-background/30 border border-dashed border-separator-apple/40 rounded-2xl">
                  <BarChart3 className="h-8 w-8 mb-2 text-label-tertiary" />
                  <p className="text-apple-subheadline font-medium">No sales data for this period</p>
                </div>
              )}
            </div>

            {/* Quick stats below chart */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-separator-apple/20">
              <div className="text-center">
                <p className="text-apple-title-2 font-bold text-label-primary tracking-tight text-tabular-nums">{formatCompactCurrency(thisWeekSales)}</p>
                <p className="text-apple-footnote text-label-secondary mt-1">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-apple-title-2 font-bold text-label-primary tracking-tight text-tabular-nums">{formatCompactCurrency(stats?.monthly?.sales || 0)}</p>
                <p className="text-apple-footnote text-label-secondary mt-1">This Month</p>
              </div>
              <div className="text-center">
                <p className={cn("text-apple-title-2 font-bold tracking-tight text-tabular-nums", weeklyGrowth >= 0 ? "text-system-green" : "text-system-red")}>
                  {weeklyGrowth > 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}%
                </p>
                <p className="text-apple-footnote text-label-secondary mt-1">Growth (vs last wk)</p>
              </div>
            </div>
          </div>
          )}

          {/* Recent Sales */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Recent Sales</h3>
              <Link
                to={ROUTES.SALES}
                className="text-apple-subheadline font-medium text-system-blue hover:text-system-blue/80 flex items-center gap-1 transition-apple-micro"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-1">
              {dashboardData.recentSales.length > 0 ? (
                dashboardData.recentSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-background/60 active-apple-press transition-apple-micro cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-system-blue/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-system-blue" />
                      </div>
                      <div>
                        <p className="text-apple-headline font-semibold text-label-primary">{sale.customerName || sale.customerId?.name || 'Walk-in Customer'}</p>
                        <p className="text-apple-subheadline text-label-secondary mt-0.5">
                          {sale.totalItems} item{sale.totalItems !== 1 ? 's' : ''} • {formatRelativeTime(sale.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-apple-headline font-semibold text-label-primary text-tabular-nums">{formatCurrency(sale.grandTotal)}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-label-secondary text-apple-subheadline">
                  No recent sales found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Smart Reorder Suggestions */}
          {canPurchase && <ReorderSuggestionsWidget />}

          {/* Alerts */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Alerts</h3>
              <span className="px-2.5 py-0.5 text-apple-caption-1 font-semibold rounded-full bg-system-red/10 text-system-red text-tabular-nums">
                {dashboardData.alerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {dashboardData.alerts.length > 0 ? (
                dashboardData.alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert._id}
                    className={cn(
                      'p-3 rounded-xl border-l-4 cursor-pointer transition-apple-micro active-apple-press',
                      alert.priority === 'CRITICAL' || alert.priority === 'HIGH'
                        ? 'bg-system-red/5 border-system-red hover:bg-system-red/10'
                        : 'bg-system-orange/5 border-system-orange hover:bg-system-orange/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={cn(
                          'h-5 w-5 flex-shrink-0 mt-0.5',
                          alert.priority === 'CRITICAL' || alert.priority === 'HIGH' ? 'text-system-red' : 'text-system-orange'
                        )}
                      />
                      <p className="text-apple-subheadline font-semibold text-label-primary leading-snug">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-label-secondary text-apple-subheadline">
                  All good! No pending alerts.
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 text-apple-subheadline"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate(ROUTES.INVENTORY + '?filter=expiring')}
            >
              View All Alerts
            </Button>
          </div>


          {/* Today's Summary Card */}
          <div className="card p-6 border border-separator-apple/10 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-system-blue/10 rounded-xl">
                <Calendar className="h-6 w-6 text-system-blue" />
              </div>
              <div>
                <h3 className="text-apple-headline font-semibold text-label-primary tracking-tight">Today's Summary</h3>
                <p className="text-apple-subheadline text-label-secondary">{formatDate(new Date())}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-separator-apple/10">
                <span className="text-apple-subheadline text-label-secondary font-medium">Total Sales</span>
                <span className="text-apple-title-3 font-bold text-label-primary tracking-tight text-tabular-nums">{formatCurrency(dashboardData.todaySales)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-separator-apple/10">
                <span className="text-apple-subheadline text-label-secondary font-medium">Transactions</span>
                <span className="text-apple-title-3 font-bold text-label-primary tracking-tight text-tabular-nums">{dashboardData.todayTransactions}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-apple-subheadline text-label-secondary font-medium">Pending Orders</span>
                <span className="text-apple-title-3 font-bold text-label-primary tracking-tight text-tabular-nums">{dashboardData.pendingPurchases}</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-separator-apple/10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-label-secondary" />
                <span className="text-apple-subheadline text-label-secondary font-medium">
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
