/**
 * pages/dashboard/Reports.jsx
 * 
 * RESPONSIBILITY:
 * - Sales and inventory reports
 * - Analytics dashboard
 * - Export functionality
 */

import { useState } from 'react'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  FileText,
  IndianRupee,
  Package,
  ShoppingCart,
  Users,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatCurrency, formatCompactCurrency } from '@utils/formatCurrency'
import Button from '@components/common/Button'
import { Select } from '@components/common/Input'

import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@api/reports.api'
import { Skeleton } from '@components/common/Loader'

/**
 * Reports Page
 */
export default function Reports() {
  const [dateRange, setDateRange] = useState('month')

  // Fetch stats from backend
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: reportsApi.getDashboardStats,
  })

  // Map real data
  const monthlySales = stats?.monthly?.sales || 0;
  const monthlyBills = stats?.monthly?.bills || 0;
  const monthlyProfit = stats?.monthly?.profit || 0;
  const avgOrderValue = monthlyBills > 0 ? monthlySales / monthlyBills : 0;
  
  const trends = stats?.trends || [];
  let chartData = [];
  if (dateRange === 'week') {
    chartData = trends.slice(-7);
  } else if (dateRange === 'month') {
    chartData = trends.slice(-30);
  } else {
    chartData = trends;
  }
  const maxSales = Math.max(...chartData.map(d => d.sales), 1);

  const topProducts = stats?.topMedicines || [];

  const summaryStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(monthlySales),
      change: 'This Month',
      isPositive: true,
      icon: IndianRupee,
      color: 'brand',
    },
    {
      title: 'Total Transactions',
      value: monthlyBills.toString(),
      change: 'This Month',
      isPositive: true,
      icon: ShoppingCart,
      color: 'success',
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(avgOrderValue),
      change: 'This Month',
      isPositive: true,
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(monthlyProfit),
      change: 'This Month',
      isPositive: monthlyProfit >= 0,
      icon: IndianRupee,
      color: 'warning',
    },
  ]

  const colorMap = {
    brand: 'bg-brand-100 text-brand-600',
    success: 'bg-success-100 text-success-600',
    purple: 'bg-purple-100 text-purple-600',
    warning: 'bg-warning-100 text-warning-600',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Track your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
            ]}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-36"
          />
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export PDF
          </Button>
          <Button size="sm" leftIcon={<FileText className="h-4 w-4" />}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          summaryStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colorMap[stat.color].split(' ')[0])}>
                    <Icon className={cn('h-5 w-5', colorMap[stat.color].split(' ')[1])} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    stat.isPositive ? 'text-success-600' : 'text-danger-600'
                  )}>
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500">Monthly revenue overview</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-brand-500"></span>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-300"></span>
                <span className="text-gray-600">Orders</span>
              </div>
            </div>
          </div>

          {/* Real Dynamic CSS Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2 px-4 mt-8">
            {chartData.length > 0 ? (
              chartData.map((day, index) => {
                const heightPercent = Math.max((day.sales / maxSales) * 100, 2);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                      {formatCurrency(day.sales)}<br/>
                      <span className="text-gray-300">{new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                    </div>
                    <div
                      className="w-full max-w-[40px] bg-brand-500 hover:bg-brand-600 rounded-t-sm transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-gray-500 hidden sm:block">
                      {new Date(day._id).getDate()}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-100 rounded-lg">
                <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
            <p className="text-sm text-gray-500">Based on selected period</p>
          </div>
          <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
            View All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Quantity Sold</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Share</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={product._id || index} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-brand-600" />
                        </div>
                        <span className="font-medium text-gray-900">{product.name} {product.dosage}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">{product.totalQuantity}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-full">
                        {((product.totalRevenue / topProducts.reduce((sum, p) => sum + p.totalRevenue, 0)) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No sales data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Sales Report', icon: ShoppingCart, color: 'bg-brand-500' },
          { title: 'Inventory Report', icon: Package, color: 'bg-success-500' },
          { title: 'Purchase Report', icon: TrendingUp, color: 'bg-purple-500' },
          { title: 'GST Report', icon: FileText, color: 'bg-warning-500' },
        ].map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.title}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all group"
            >
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-white', report.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{report.title}</p>
                <p className="text-sm text-gray-500">Download PDF</p>
              </div>
              <Download className="h-5 w-5 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
