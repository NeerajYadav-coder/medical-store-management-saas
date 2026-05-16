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

/**
 * Reports Page
 */
export default function Reports() {
  const [dateRange, setDateRange] = useState('month')
  const [reportType, setReportType] = useState('sales')

  // Mock data
  const summaryStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(524000),
      change: '+12.5%',
      isPositive: true,
      icon: IndianRupee,
      color: 'brand',
    },
    {
      title: 'Total Sales',
      value: '1,248',
      change: '+8.3%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'success',
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(420),
      change: '+4.1%',
      isPositive: true,
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: 'New Customers',
      value: '156',
      change: '-2.4%',
      isPositive: false,
      icon: Users,
      color: 'warning',
    },
  ]

  const topProducts = [
    { name: 'Paracetamol 500mg', quantity: 450, revenue: 11250 },
    { name: 'Amoxicillin 250mg', quantity: 320, revenue: 27200 },
    { name: 'Pan 40', quantity: 280, revenue: 23800 },
    { name: 'Vitamin D3', quantity: 245, revenue: 85750 },
    { name: 'Cough Syrup', quantity: 210, revenue: 25200 },
  ]

  const revenueByCategory = [
    { category: 'Tablets', percentage: 35, value: 183400 },
    { category: 'Capsules', percentage: 28, value: 146720 },
    { category: 'Syrups', percentage: 18, value: 94320 },
    { category: 'Injections', percentage: 12, value: 62880 },
    { category: 'Others', percentage: 7, value: 36680 },
  ]

  const monthlyTrend = [
    { month: 'Jan', sales: 380000, orders: 890 },
    { month: 'Feb', sales: 420000, orders: 1024 },
    { month: 'Mar', sales: 390000, orders: 945 },
    { month: 'Apr', sales: 450000, orders: 1120 },
    { month: 'May', sales: 480000, orders: 1189 },
    { month: 'Jun', sales: 524000, orders: 1248 },
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
        {summaryStats.map((stat) => {
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
                  {stat.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            </div>
          )
        })}
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

          {/* Chart placeholder */}
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {monthlyTrend.map((item, index) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1">
                  <div
                    className="w-full bg-brand-500 rounded-t-md transition-all"
                    style={{ height: `${(item.sales / 600000) * 200}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          
          <div className="space-y-4">
            {revenueByCategory.map((item, index) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  <span className="text-sm text-gray-500">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      index === 0 && 'bg-brand-500',
                      index === 1 && 'bg-success-500',
                      index === 2 && 'bg-purple-500',
                      index === 3 && 'bg-warning-500',
                      index === 4 && 'bg-gray-400'
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatCurrency(item.value)}</p>
              </div>
            ))}
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
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-brand-600" />
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600">{product.quantity}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(product.revenue)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-full">
                      {((product.revenue / topProducts.reduce((sum, p) => sum + p.revenue, 0)) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
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
