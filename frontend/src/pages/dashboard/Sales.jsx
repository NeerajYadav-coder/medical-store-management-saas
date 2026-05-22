/**
 * pages/dashboard/Sales.jsx
 * 
 * RESPONSIBILITY:
 * - Sales History management
 * - View detailed invoices
 * - Filter and monitor past sales
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Receipt,
  Printer,
  Eye,
  Calendar,
  Filter,
  ArrowRight,
  Download,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@utils/formatCurrency'
import { formatDate, formatTime } from '@utils/formatDate'
import saleApi from '@api/sale.api'
import { ROUTES } from '@config/routes.config'
import { useToast } from '@context/UIContext'
import Button from '@components/common/Button'
import { SearchInput } from '@components/common/Input'
import { Table } from '@components/common/Table'
import { Modal } from '@components/common/Modal'
import { useAuth } from '@context/AuthContext'

export default function Sales() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = useAuth()

  // Permissions
  const showFinancials = hasPermission('VIEW_FINANCIAL_REPORTS')

  // State
  const [historyPage, setHistoryPage] = useState(1)
  const [dateRange, setDateRange] = useState('today')
  const [viewInvoice, setViewInvoice] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Sales History
  const { data: salesResponse, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales', historyPage, dateRange, searchQuery],
    queryFn: () => saleApi.getAll({ 
      page: historyPage, 
      date: dateRange === 'today' ? new Date().toISOString().split('T')[0] : undefined,
      search: searchQuery 
    }),
  })

  // Fetch Summary (Daily)
  const { data: summaryResponse } = useQuery({
    queryKey: ['sales', 'summary', dateRange],
    queryFn: () => saleApi.getDailySummary(dateRange === 'today' ? new Date().toISOString().split('T')[0] : null),
    enabled: showFinancials
  })

  const salesHistory = salesResponse?.data || []
  const pagination = salesResponse?.pagination || { page: 1, total: 0, pages: 1 }
  const summary = summaryResponse || { totalBills: 0, totalRevenue: 0, netProfit: 0 }

  // Sales history columns
  const historyColumns = [
    {
      key: 'billNumber',
      label: 'Bill No',
      render: (value) => (
        <span className="font-mono text-sm font-bold text-gray-900">{value}</span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value || 'Walk-in'}</p>
          {row.customerPhone && (
            <p className="text-xs text-gray-500">{row.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (items) => <span className="text-gray-600">{items?.length || 0}</span>,
    },
    {
      key: 'grandTotal',
      label: 'Total',
      render: (value) => (
        <span className="font-bold text-gray-900">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'paymentMode',
      label: 'Payment',
      render: (value) => (
        <span className={cn(
          'px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider',
          value === 'CASH' && 'bg-emerald-100 text-emerald-700',
          value === 'UPI' && 'bg-indigo-100 text-indigo-700',
          value === 'CARD' && 'bg-blue-100 text-blue-700',
          value === 'CREDIT' && 'bg-orange-100 text-orange-700'
        )}>
          {value}
        </span>
      ),
    },
    {
      key: 'billDate',
      label: 'Date & Time',
      render: (value) => (
        <div className="text-xs">
          <p className="text-gray-900">{formatDate(value)}</p>
          <p className="text-gray-400">{formatTime(value)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (_, sale) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewSale(sale);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="View Details"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handlePrintSale(sale);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Print Receipt"
          >
            <Printer className="h-4.5 w-4.5" />
          </button>
        </div>
      ),
    },
  ];

  const handleViewSale = async (sale) => {
    try {
      // Fetch full details including items
      const response = await saleApi.getById(sale._id);
      setViewInvoice(response);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const handlePrintSale = async (sale) => {
    try {
      const response = await saleApi.getById(sale._id);
      handlePrint(response);
    } catch (error) {
      toast.error('Failed to prepare receipt for printing');
    }
  };

  const handlePrint = (sale) => {
    // Basic print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill #${sale.billNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; font-size: 12px; }
            td { font-size: 11px; padding: 4px 0; }
            .total-row { border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3 style="margin:0">MEDICAL STORE</h3>
            <p style="font-size:10px;margin:5px 0">Bill No: ${sale.billNumber}</p>
            <p style="font-size:10px;margin:0">${formatDate(sale.billDate)} ${formatTime(sale.billDate)}</p>
          </div>
          <div>
            <p style="font-size:11px;margin:2px 0">Customer: ${sale.customerName || 'Walk-in'}</p>
          </div>
          <table style="margin: 10px 0">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.medicineName}</td>
                  <td style="text-align:right">${item.quantity}</td>
                  <td style="text-align:right">${(item.totalAmount || (item.quantity * item.sellingPrice)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-row">
            <div class="flex"><span>Subtotal:</span> <span>${sale.subtotal?.toFixed(2)}</span></div>
            <div class="flex"><span>Discount:</span> <span>-${sale.discountAmount?.toFixed(2)}</span></div>
            <div class="flex"><span>GST:</span> <span>${sale.totalGst?.toFixed(2)}</span></div>
            <div class="flex bold" style="font-size:14px;margin-top:5px">
              <span>Grand Total:</span> <span style="margin-left:auto">₹${sale.grandTotal?.toFixed(2)}</span>
            </div>
          </div>
          <p style="text-align:center;font-size:10px;margin-top:20px">Thank you! Visit Again.</p>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales History</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage all your pharmacy transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setDateRange(dateRange === 'all' ? 'today' : 'all')}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            {dateRange === 'today' ? 'Showing Today' : 'Showing All'}
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.BILLING)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-lg shadow-brand-500/20"
          >
            New Sale (POS)
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {showFinancials && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Sales</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-bold text-gray-900">{summary.totalBills || 0}</h2>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">Invoices</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gross Revenue</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue || 0)}</h2>
              <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Profit</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.netProfit || 0)}</h2>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm bg-gradient-to-br from-brand-500 to-brand-600 text-white border-0">
            <p className="text-xs font-semibold text-brand-100 uppercase tracking-wider">Action Needed</p>
            <p className="text-sm font-medium mt-2">You have 0 pending credit bills today.</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96">
            <SearchInput 
              placeholder="Search bill no, customer name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
            {['today', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider',
                  dateRange === range
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="p-0">
          <Table
            columns={historyColumns}
            data={salesHistory}
            isLoading={isLoadingSales}
            emptyMessage="No sale records found in the selected range."
            emptyIcon={<Receipt className="h-10 w-10 text-gray-200" />}
            onRowClick={(sale) => handleViewSale(sale)}
            hoverable
          />
        </div>
        
        {/* Pagination placeholder */}
        {pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-50 flex justify-center gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button 
                        key={p}
                        onClick={() => setHistoryPage(p)}
                        className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                            historyPage === p ? "bg-brand-600 text-white shadow-lg" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        {p}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={viewInvoice ? `Bill Details #${viewInvoice.billNumber}` : ''}
        size="lg"
        footer={
          <div className="flex flex-col-reverse sm:flex-row justify-between w-full gap-3 sm:gap-0">
            <div className="flex gap-2 w-full sm:w-auto">
                 <Button variant="outline" className="w-full sm:w-auto justify-center" onClick={() => setViewInvoice(null)}>
                    Close
                </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                    variant="secondary" 
                    className="w-full sm:w-auto justify-center"
                    leftIcon={<Printer className="h-4 w-4" />}
                    onClick={() => handlePrint(viewInvoice)}
                >
                Print Receipt
                </Button>
                <Button 
                    variant="primary" 
                    className="w-full sm:w-auto justify-center"
                    leftIcon={<Download className="h-4 w-4" />}
                    disabled
                >
                Download PDF
                </Button>
            </div>
          </div>
        }
      >
        {viewInvoice && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Information</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{viewInvoice.customerName || 'Walk-in Customer'}</p>
                {viewInvoice.customerPhone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <ArrowRight className="h-3 w-3" /> {viewInvoice.customerPhone}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Meta</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(viewInvoice.billDate)}</p>
                <p className="text-xs text-gray-500">{formatTime(viewInvoice.billDate)}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100">
                    Billed By: {viewInvoice.billedBy?.name || 'System'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Itemized Bill</p>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 text-gray-500 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Medicine</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {viewInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{item.medicineName}</p>
                            <p className="text-[10px] text-gray-400">Batch: {item.batchNumber}</p>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(item.sellingPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                              {formatCurrency(item.totalAmount || (item.quantity * item.sellingPrice))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Info</p>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Method</span>
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold uppercase">{viewInvoice.paymentMode}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="text-emerald-600 font-bold text-xs">● SUCCESSFUL</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(viewInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Discount</span>
                        <span className="text-emerald-600 font-semibold">-{formatCurrency(viewInvoice.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Taxation (GST)</span>
                        <span className="font-semibold">{formatCurrency(viewInvoice.totalGst)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex justify-between">
                        <span className="text-lg font-black text-gray-900">GRAND TOTAL</span>
                        <span className="text-lg font-black text-brand-600">{formatCurrency(viewInvoice.grandTotal)}</span>
                    </div>
                </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
