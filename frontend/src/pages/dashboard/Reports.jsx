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
import { inventoryApi } from '@api/inventory.api'
import saleApi from '@api/sale.api'
import purchaseApi from '@api/purchase.api'
import { useStore } from '@context/StoreContext'
import { exportToPDF } from '@utils/exportPDF'
import toast from 'react-hot-toast'

/**
 * Reports Page
 */
export default function Reports() {
  const { store } = useStore()
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

  const handlePrintReport = () => {
    if (!stats) {
      toast.error('Report data is still loading');
      return;
    }

    const printWindow = window.open('', '_blank');
    const title = `Business_Report_${dateRange.toUpperCase()}_${new Date().toISOString().split('T')[0]}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #111827; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .store-name { font-size: 24px; font-weight: 800; margin: 0; color: #4f46e5; }
            .report-title { font-size: 18px; font-weight: 600; margin: 5px 0 0 0; color: #374151; }
            .meta { font-size: 12px; color: #6b7280; margin-top: 10px; }
            
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; background: #f9fafb; }
            .stat-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; }
            .stat-val { font-size: 20px; font-weight: 800; margin-top: 5px; color: #111827; }
            
            .section-title { font-size: 16px; font-weight: 700; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 10px; }
            td { font-size: 13px; padding: 12px 10px; border-bottom: 1px solid #f3f4f6; }
            .text-right { text-align: right; }
            .font-semibold { font-weight: 600; }
            
            @media print {
              body { padding: 20px; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="store-name">PHARMACY PERFORMANCE REPORT</h1>
            <p class="report-title">Business Analytics Summary — ${dateRange.toUpperCase()}</p>
            <p class="meta">Generated on: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <p class="stat-label">Total Revenue</p>
              <p class="stat-val">₹${monthlySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Total Transactions</p>
              <p class="stat-val">${monthlyBills}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Avg. Order Value</p>
              <p class="stat-val">₹${avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Total Profit</p>
              <p class="stat-val" style="color: ${monthlyProfit >= 0 ? '#10b981' : '#ef4444'}">
                ₹${monthlyProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div>
            <h3 class="section-title">Top Selling Products</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px">#</th>
                  <th>Product Details</th>
                  <th class="text-right">Quantity Sold</th>
                  <th class="text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map((product, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td class="font-semibold">${product.name} ${product.dosage || ''}</td>
                    <td class="text-right">${product.totalQuantity}</td>
                    <td class="text-right font-semibold">₹${product.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                ${!topProducts.length ? `<tr><td colspan="4" style="text-align:center;color:#6b7280;">No sales data available yet</td></tr>` : ''}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af;">
            End of Report · Generated Securely by Medical Store Platform
          </div>
          
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSalesReport = async () => {
    const toastId = toast.loading('Preparing Sales PDF Report...');
    try {
      const response = await saleApi.getAll({ limit: 1000 });
      const sales = response?.data || [];
      if (!sales.length) {
        toast.error('No sales records to export', { id: toastId });
        return;
      }
      
      exportToPDF(
        sales,
        [
          { label: 'Bill Number', key: 'billNumber', align: 'center' },
          { label: 'Customer Name', key: 'customerName', align: 'left', format: (val) => val || 'Walk-in' },
          { label: 'Billed Date', key: 'billDate', align: 'center', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
          { label: 'Mode', key: 'paymentMode', align: 'center' },
          { label: 'Subtotal', key: 'subtotal', align: 'right', format: (val) => `₹${val.toLocaleString('en-IN')}` },
          { label: 'Discount', key: 'discountAmount', align: 'right', format: (val) => `₹${val.toLocaleString('en-IN')}` },
          { label: 'GST Tax', key: 'totalGst', align: 'right', format: (val) => `₹${val.toLocaleString('en-IN')}` },
          { label: 'Grand Total', key: 'grandTotal', align: 'right', format: (val) => `₹${val.toLocaleString('en-IN')}` }
        ],
        {
          title: 'Sales Register Report',
          subtitle: `Completed Sales Transactions Ledgers`,
          summaryCards: [
            { label: 'Total Invoices', value: sales.length.toString() },
            { label: 'Total Revenue Collected', value: `₹${sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0).toLocaleString('en-IN')}` },
            { label: 'Total Discounts Allowed', value: `₹${sales.reduce((sum, s) => sum + (s.discountAmount || 0), 0).toLocaleString('en-IN')}` },
            { label: 'Total Tax Collected', value: `₹${sales.reduce((sum, s) => sum + (s.totalGst || 0), 0).toLocaleString('en-IN')}` }
          ]
        }
      );
      toast.success(`Successfully generated Sales PDF report.`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Sales Report', { id: toastId });
    }
  };

  const handleDownloadInventoryReport = async () => {
    const toastId = toast.loading('Preparing Inventory PDF Report...');
    try {
      const response = await inventoryApi.getMedicines({ limit: 1000 });
      const medicines = response?.data || [];
      if (!medicines.length) {
        toast.error('No medicines to export', { id: toastId });
        return;
      }
      
      exportToPDF(
        medicines,
        [
          { label: 'Medicine Name', key: 'name', align: 'left' },
          { label: 'Generic Name', key: 'genericName', align: 'left', format: (val) => val || '—' },
          { label: 'Dosage', key: 'dosage', align: 'center' },
          { label: 'Form', key: 'form', align: 'center' },
          { label: 'Current Stock', key: 'currentStock', align: 'right', format: (val) => val ?? 0 },
          { label: 'Default MRP', key: 'defaultMRP', align: 'right', format: (val) => `₹${val || 0}` },
          { label: 'GST (%)', key: 'gstRate', align: 'center', format: (val) => `${val || 0}%` },
          { label: 'Nearest Expiry', key: 'nearestExpiry', align: 'center', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' }
        ],
        {
          title: 'Stock Ledger Report',
          subtitle: `Active Medicines Catalog Inventory`,
          summaryCards: [
            { label: 'Total Products', value: medicines.length.toString() },
            { label: 'Out of Stock', value: medicines.filter(m => (m.currentStock || 0) === 0).length.toString() },
            { label: 'Low Stock Items', value: medicines.filter(m => (m.currentStock || 0) <= (m.reorderLevel || 10)).length.toString() }
          ]
        }
      );
      toast.success(`Successfully generated Inventory PDF report.`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Inventory Report', { id: toastId });
    }
  };

  const handleDownloadPurchaseReport = async () => {
    const toastId = toast.loading('Preparing Purchase PDF Report...');
    try {
      const response = await purchaseApi.getAll({ limit: 1000 });
      const purchases = response?.data || [];
      if (!purchases.length) {
        toast.error('No purchase records to export', { id: toastId });
        return;
      }
      
      exportToPDF(
        purchases,
        [
          { label: 'Invoice No.', key: 'invoiceNumber', align: 'center' },
          { label: 'Supplier Name', key: 'supplierId.name', align: 'left', format: (val) => val || '—' },
          { label: 'Invoice Date', key: 'invoiceDate', align: 'center', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
          { label: 'Status', key: 'paymentStatus', align: 'center' },
          { label: 'Subtotal', key: 'subtotal', align: 'right', format: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { label: 'GST Tax', key: 'gstAmount', align: 'right', format: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { label: 'Grand Total', key: 'totalAmount', align: 'right', format: (val) => `₹${(val || 0).toLocaleString('en-IN')}` }
        ],
        {
          title: 'Purchase Ledger Report',
          subtitle: `Settled Inward Stock Procurements`,
          summaryCards: [
            { label: 'Total Invoices', value: purchases.length.toString() },
            { label: 'Total Procurement Cost', value: `₹${purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
            { label: 'Outstanding Payments', value: purchases.filter(p => p.paymentStatus !== 'PAID').length.toString() }
          ]
        }
      );
      toast.success(`Successfully generated Purchase PDF report.`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Purchase Report', { id: toastId });
    }
  };

  const handleDownloadGSTReport = async () => {
    const toastId = toast.loading('Preparing GST Tax PDF Report...');
    try {
      const response = await saleApi.getAll({ limit: 1000 });
      const sales = response?.data || [];
      if (!sales.length) {
        toast.error('No sales records found for GST analysis', { id: toastId });
        return;
      }
      
      const gstRows = sales.map(sale => {
        const totalGst = sale.totalGst || 0;
        const cgst = totalGst / 2;
        const sgst = totalGst / 2;
        return {
          ...sale,
          cgst,
          sgst
        };
      });

      exportToPDF(
        gstRows,
        [
          { label: 'Bill Number', key: 'billNumber', align: 'center' },
          { label: 'Date', key: 'billDate', align: 'center', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
          { label: 'Taxable Subtotal', key: 'subtotal', align: 'right', format: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { label: 'CGST (Central)', key: 'cgst', align: 'right', format: (val) => `₹${val.toFixed(2)}` },
          { label: 'SGST (State)', key: 'sgst', align: 'right', format: (val) => `₹${val.toFixed(2)}` },
          { label: 'Total Tax Collected', key: 'totalGst', align: 'right', format: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { label: 'Grand Total', key: 'grandTotal', align: 'right', format: (val) => `₹${(val || 0).toLocaleString('en-IN')}` }
        ],
        {
          title: 'GST Tax Compliance Report',
          subtitle: `CGST & SGST Split Ledger Summary`,
          summaryCards: [
            { label: 'Taxable Invoices', value: gstRows.length.toString() },
            { label: 'Taxable Value Gross', value: `₹${gstRows.reduce((sum, r) => sum + (r.subtotal || 0), 0).toLocaleString('en-IN')}` },
            { label: 'Total SGST Tax Collected', value: `₹${gstRows.reduce((sum, r) => sum + (r.sgst || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
            { label: 'Total CGST Tax Collected', value: `₹${gstRows.reduce((sum, r) => sum + (r.cgst || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` }
          ]
        }
      );
      toast.success(`Successfully generated GST PDF report.`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export GST Report', { id: toastId });
    }
  };

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
    brand: 'bg-system-blue/10 text-system-blue',
    success: 'bg-system-green/10 text-system-green',
    purple: 'bg-system-blue/15 text-system-blue',
    warning: 'bg-system-orange/10 text-system-orange',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-apple-title-1 font-semibold text-label-primary tracking-tight">Reports & Analytics</h1>
          <p className="text-apple-subheadline text-label-secondary mt-1">Track your business performance</p>
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
          <Button variant="outline" size="sm" onClick={handlePrintReport} leftIcon={<Download className="h-4 w-4" />}>
            Export PDF
          </Button>
          <Button size="sm" onClick={handlePrintReport} leftIcon={<FileText className="h-4 w-4" />}>
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
              <div key={stat.title} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colorMap[stat.color].split(' ')[0])}>
                    <Icon className={cn('h-5 w-5', colorMap[stat.color].split(' ')[1])} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-apple-caption-1 font-semibold',
                    stat.isPositive ? 'text-system-green' : 'text-system-red'
                  )}>
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-apple-title-2 font-bold text-label-primary tracking-tight text-tabular-nums">{stat.value}</p>
                  <p className="text-apple-footnote text-label-secondary mt-1">{stat.title}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 card p-6 bg-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-apple-headline font-semibold text-label-primary">Revenue Trend</h3>
              <p className="text-apple-subheadline text-label-secondary mt-0.5">Monthly revenue overview</p>
            </div>
            <div className="flex items-center gap-4 text-apple-footnote">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-system-blue"></span>
                <span className="text-label-secondary font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-label-tertiary"></span>
                <span className="text-label-secondary font-medium">Orders</span>
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
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary-background text-label-primary border border-separator-apple/20 text-[11px] py-1 px-2 rounded-xl whitespace-nowrap z-10 pointer-events-none shadow-lg font-mono">
                      {formatCurrency(day.sales)}<br/>
                      <span className="text-label-secondary">{new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                    </div>
                    <div
                      className="w-full max-w-[40px] bg-system-blue hover:bg-system-blue/80 rounded-t-lg transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-label-secondary hidden sm:block font-mono">
                      {new Date(day._id).getDate()}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-label-secondary bg-secondary-background/30 border-2 border-dashed border-separator-apple/10 rounded-xl">
                <BarChart3 className="h-8 w-8 mb-2 opacity-50 text-label-tertiary" />
                <p className="text-apple-subheadline">No trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-apple-headline font-semibold text-label-primary">Top Selling Products</h3>
            <p className="text-apple-subheadline text-label-secondary mt-0.5">Based on selected period</p>
          </div>
          <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
            View All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-separator-apple/10">
                <th className="text-left py-3 px-4 text-apple-footnote font-semibold text-label-secondary uppercase tracking-wider">#</th>
                <th className="text-left py-3 px-4 text-apple-footnote font-semibold text-label-secondary uppercase tracking-wider">Product</th>
                <th className="text-right py-3 px-4 text-apple-footnote font-semibold text-label-secondary uppercase tracking-wider">Quantity Sold</th>
                <th className="text-right py-3 px-4 text-apple-footnote font-semibold text-label-secondary uppercase tracking-wider">Revenue</th>
                <th className="text-right py-3 px-4 text-apple-footnote font-semibold text-label-secondary uppercase tracking-wider">Share</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={product._id || index} className="border-b border-separator-apple/10 hover:bg-secondary-background/40">
                    <td className="py-3 px-4 text-apple-subheadline text-label-secondary font-mono">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-system-blue/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-system-blue" />
                        </div>
                        <span className="text-apple-subheadline font-semibold text-label-primary">{product.name} {product.dosage}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-apple-subheadline text-label-secondary text-tabular-nums">{product.totalQuantity}</td>
                    <td className="py-3 px-4 text-right text-apple-subheadline font-semibold text-label-primary text-tabular-nums">{formatCurrency(product.totalRevenue)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-0.5 bg-system-blue/10 text-system-blue text-apple-footnote font-semibold rounded-full">
                        {((product.totalRevenue / topProducts.reduce((sum, p) => sum + p.totalRevenue, 0)) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-label-secondary text-apple-subheadline">
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
          { title: 'Sales Report', icon: ShoppingCart, color: 'bg-system-blue/10 text-system-blue', action: handleDownloadSalesReport },
          { title: 'Inventory Report', icon: Package, color: 'bg-system-green/10 text-system-green', action: handleDownloadInventoryReport },
          { title: 'Purchase Report', icon: TrendingUp, color: 'bg-system-blue/15 text-system-blue', action: handleDownloadPurchaseReport },
          { title: 'GST Report', icon: FileText, color: 'bg-system-orange/10 text-system-orange', action: handleDownloadGSTReport },
        ].map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.title}
              onClick={report.action}
              className="flex items-center gap-4 p-4 bg-secondary-background/60 hover:bg-secondary-background/80 border border-separator-apple/10 rounded-2xl active-apple-press transition-apple-micro text-left group shadow-sm"
            >
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', report.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-apple-headline font-bold text-label-primary">{report.title}</p>
                <p className="text-apple-caption-1 text-label-secondary mt-0.5">Download PDF</p>
              </div>
              <Download className="h-5 w-5 text-label-tertiary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
