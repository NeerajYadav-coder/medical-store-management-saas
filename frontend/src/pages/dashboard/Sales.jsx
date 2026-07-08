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
  Ban
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
import { useStore } from '@context/StoreContext'

export default function Sales() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const { store, storeName, storeAddress, storePhone, drugLicense, gstNumber } = useStore()

  // Permissions
  const showFinancials = hasPermission('VIEW_FINANCIAL_REPORTS')
  const canDeleteSale = hasPermission('DELETE_SALE') || useAuth().user?.role === 'OWNER'

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
        <span className="font-mono text-apple-headline font-bold text-label-primary">{value}</span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (value, row) => (
        <div>
          <p className="text-apple-headline font-semibold text-label-primary">{value || 'Walk-in'}</p>
          {row.customerPhone && (
            <p className="text-apple-caption-1 text-label-secondary mt-0.5">{row.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (items) => <span className="text-apple-subheadline text-label-secondary text-tabular-nums">{items?.length || 0}</span>,
    },
    {
      key: 'grandTotal',
      label: 'Total',
      render: (value) => (
        <span className="text-apple-headline font-bold text-label-primary text-tabular-nums">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'paymentMode',
      label: 'Payment',
      render: (value) => (
        <span className={cn(
          'px-2.5 py-0.5 text-apple-caption-2 font-bold rounded-full uppercase tracking-wider',
          value === 'CASH' && 'bg-system-green/10 text-system-green',
          value === 'UPI' && 'bg-system-blue/10 text-system-blue',
          value === 'CARD' && 'bg-system-blue/15 text-system-blue',
          value === 'CREDIT' && 'bg-system-orange/10 text-system-orange'
        )}>
          {value}
        </span>
      ),
    },
    {
      key: 'billDate',
      label: 'Date & Time',
      render: (value) => (
        <div className="text-apple-caption-1 font-mono">
          <p className="text-label-primary">{formatDate(value)}</p>
          <p className="text-label-secondary">{formatTime(value)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (_, sale) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewSale(sale);
            }}
            className="p-2 rounded-lg text-label-secondary hover:text-system-blue hover:bg-system-blue/10 active-apple-press transition-apple-micro"
            title="View Details"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handlePrintSale(sale);
            }}
            className="p-2 rounded-lg text-label-secondary hover:text-system-blue hover:bg-system-blue/10 active-apple-press transition-apple-micro"
            title="Print Receipt"
          >
            <Printer className="h-4.5 w-4.5" />
          </button>
          {canDeleteSale && sale.status !== 'VOID' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleVoidSale(sale);
              }}
              className="p-2 rounded-lg text-label-secondary hover:text-system-red hover:bg-system-red/10 active-apple-press transition-apple-micro"
              title="Void Sale"
            >
              <Ban className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleViewSale = async (sale) => {
    try {
      // Fetch full details including items
      const response = await saleApi.getById(sale._id);
      // The Axios interceptor already unwraps `data.data` which contains the full sale object + items
      // Fallback to response.sale just in case another controller format is used
      const invoiceData = response.sale ? { ...response.sale, items: response.items || [] } : response;
      
      setViewInvoice(invoiceData);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const handlePrintSale = async (sale) => {
    try {
      const response = await saleApi.getById(sale._id);
      const invoiceData = response.sale ? { ...response.sale, items: response.items || [] } : response;
      handlePrint(invoiceData);
    } catch (error) {
      toast.error('Failed to prepare receipt for printing');
    }
  };

  const handleVoidSale = async (sale) => {
    if (!window.confirm(`Are you sure you want to void Bill #${sale.billNumber}? This will restore the inventory and cannot be undone.`)) return;
    
    try {
      const reason = window.prompt("Reason for voiding sale:");
      if (reason === null) return; // User cancelled
      
      await saleApi.void(sale._id, reason || 'Customer requested cancellation');
      toast.success('Sale voided and inventory restored.');
      
      // We don't have queryClient in scope easily, so we just force a refresh of the page
      window.location.reload();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to void sale');
    }
  };

  const handlePrint = (sale) => {
    if (!sale) return;

    const escapeHtml = (unsafe) => {
      if (!unsafe) return '';
      return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    const storeNamePrint = escapeHtml(storeName || 'Medical Store');
    const storeAddressPrint = escapeHtml(storeAddress || '');
    const storePhonePrint = escapeHtml(storePhone || '');
    const ownerNamePrint = escapeHtml(store?.ownerName || '');
    const dlNumberPrint = escapeHtml(drugLicense || '');
    const gstNumberPrint = escapeHtml(gstNumber || '');

    const WinPrint = window.open('', '', 'width=900,height=650');
    if (!WinPrint) {
      toast.error('Pop-up blocker is preventing print window. Please allow popups.');
      return;
    }

    WinPrint.document.write('<html><head><title>Invoice_' + sale.billNumber + '</title>');
    WinPrint.document.write(`
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1f2937;
          max-width: 450px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .store-name {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }
        .store-owner {
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          margin: 0 0 8px 0;
        }
        .store-subtitle {
          font-size: 11px;
          color: #6b7280;
          margin: 2px 0;
          line-height: 1.4;
        }
        .divider {
          border-top: 1px dashed #d1d5db;
          margin: 14px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 12px;
        }
        .info-label { color: #6b7280; }
        .info-value { font-weight: 600; color: #1f2937; }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin: 12px 0;
        }
        .items-table th {
          border-bottom: 2px solid #374151;
          padding: 8px 0;
          font-weight: 700;
          color: #374151;
        }
        .items-table td {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
        }
        
        .totals-table {
          width: 100%;
          font-size: 12px;
          margin-top: 10px;
        }
        .totals-table td {
          padding: 4px 0;
        }
        .grand-total-row {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          border-top: 2px solid #374151;
          border-bottom: 2px solid #374151;
        }
        .grand-total-row td {
          padding: 10px 0;
        }
        
        .personalized-footer {
          margin-top: 24px;
          text-align: center;
          background: #f0fdf4;
          border-radius: 8px;
          padding: 12px;
          border: 1px solid #d1fae5;
        }
        .hindi-message {
          font-size: 14px;
          font-weight: 700;
          color: #065f46;
          margin: 0 0 4px 0;
        }
        .english-message {
          font-size: 11px;
          font-style: italic;
          color: #047857;
          margin: 0;
        }
      </style>
    `);
    WinPrint.document.write('</head><body>');
    WinPrint.document.write(`
      <div class="text-center">
        <h1 class="store-name">${storeNamePrint}</h1>
        ${ownerNamePrint ? `<p class="store-owner">Proprietor: ${ownerNamePrint}</p>` : ''}
        <p class="store-subtitle">${storeAddressPrint}</p>
        ${storePhonePrint ? `<p class="store-subtitle">Phone: ${storePhonePrint}</p>` : ''}
        ${dlNumberPrint ? `<p class="store-subtitle">Drug License: ${dlNumberPrint}</p>` : ''}
        ${gstNumberPrint ? `<p class="store-subtitle">GSTIN: ${gstNumberPrint}</p>` : ''}
      </div>
      <div class="divider"></div>
    `);

    WinPrint.document.write(`
      <div class="info-grid">
        <div>
          <span class="info-label">Bill No:</span>
          <span class="info-value">${escapeHtml(sale.billNumber)}</span>
        </div>
        <div class="text-right">
          <span class="info-label">Date:</span>
          <span class="info-value">${new Date(sale.billDate || sale.createdAt).toLocaleDateString('en-IN')}</span>
        </div>
        <div>
          <span class="info-label">Customer:</span>
          <span class="info-value">${escapeHtml(sale.customerName || 'Walk-in Customer')}</span>
        </div>
        ${sale.customerPhone ? `
        <div class="text-right">
          <span class="info-label">Phone:</span>
          <span class="info-value">${sale.customerPhone}</span>
        </div>
        ` : ''}
      </div>
      <div class="divider"></div>
    `);

    WinPrint.document.write(`
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%;">Item Description</th>
            <th class="text-right" style="width: 15%;">Qty</th>
            <th class="text-right" style="width: 15%;">Price</th>
            <th class="text-right" style="width: 20%;">Total</th>
          </tr>
        </thead>
        <tbody>
    `);

    sale.items.forEach(item => {
      const price = item.sellingPrice || 0;
      const total = item.totalAmount || (item.quantity * price);
      WinPrint.document.write(`
        <tr>
          <td>${escapeHtml(item.medicineName)}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(price)}</td>
          <td class="text-right">${formatCurrency(total)}</td>
        </tr>
      `);
    });

    WinPrint.document.write(`
        </tbody>
      </table>
      <div class="divider"></div>
    `);

    WinPrint.document.write(`
      <table class="totals-table">
        <tr>
          <td>Subtotal</td>
          <td class="text-right">${formatCurrency(sale.subtotal)}</td>
        </tr>
    `);

    if (sale.discountAmount > 0) {
      WinPrint.document.write(`
        <tr style="color: #059669; font-weight: 600;">
          <td>Discount Applied</td>
          <td class="text-right">-${formatCurrency(sale.discountAmount)}</td>
        </tr>
      `);
    }

    if (sale.totalGst > 0) {
      WinPrint.document.write(`
        <tr>
          <td>Tax (GST)</td>
          <td class="text-right">${formatCurrency(sale.totalGst)}</td>
        </tr>
      `);
    }

    WinPrint.document.write(`
        <tr class="grand-total-row">
          <td>Grand Total</td>
          <td class="text-right">${formatCurrency(sale.grandTotal)}</td>
        </tr>
      </table>
    `);

    WinPrint.document.write(`
      <div class="personalized-footer">
        <p class="hindi-message">दवाई भी, दुआ भी — स्वस्थ रहें, खुश रहें!</p>
        <p class="english-message">Thank you for trusting us with your health. Get well soon!</p>
      </div>
      <div style="text-align: center; margin-top: 15px; font-size: 10px; color: #9ca3af;">
        Powered by MedStore — An initiative by <a href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html" target="_blank" rel="noopener noreferrer" style="color: #6b7280; text-decoration: none; font-weight: 600;">Krishna Pharmacy</a>
      </div>
    `);

    WinPrint.document.write('</body></html>');
    WinPrint.document.close();
    WinPrint.focus();

    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 250);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-apple-title-1 font-semibold text-label-primary tracking-tight">Sales History</h1>
          <p className="text-apple-subheadline text-label-secondary mt-0.5">Track and manage all your pharmacy transactions</p>
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
          >
            New Sale (POS)
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {showFinancials && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-apple-footnote text-label-secondary uppercase tracking-wider">Total Sales</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-apple-title-2 font-bold text-label-primary tracking-tight text-tabular-nums">{summary.totalBills || 0}</h2>
              <span className="text-apple-caption-2 font-semibold text-system-green bg-system-green/10 px-1.5 py-0.5 rounded">Invoices</span>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-apple-footnote text-label-secondary uppercase tracking-wider">Gross Revenue</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-apple-title-2 font-bold text-label-primary tracking-tight text-tabular-nums">{formatCurrency(summary.totalRevenue || 0)}</h2>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-apple-footnote text-label-secondary uppercase tracking-wider">Net Profit</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-apple-title-2 font-bold text-system-green tracking-tight text-tabular-nums">{formatCurrency(summary.netProfit || 0)}</h2>
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-system-blue to-system-blue/80 text-white border-0">
            <p className="text-apple-footnote text-white/80 uppercase tracking-wider">Action Needed</p>
            <p className="text-apple-headline font-semibold mt-2">You have 0 pending credit bills today.</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="card overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-4 border-b border-separator-apple/10 bg-secondary-background/60 dark:bg-secondary-background/30 flex flex-col md:flex-row gap-4 items-center justify-between">
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
                  'px-4 py-2 text-apple-footnote font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider',
                  dateRange === range
                    ? 'bg-system-blue text-white shadow-md'
                    : 'bg-secondary-background hover:bg-secondary-background/80 text-label-secondary border border-separator-apple/10'
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
            emptyIcon={<Receipt className="h-10 w-10 text-label-tertiary" />}
            onRowClick={(sale) => handleViewSale(sale)}
            hoverable
          />
        </div>
        
        {/* Pagination placeholder */}
        {pagination.pages > 1 && (
            <div className="p-4 border-t border-separator-apple/10 flex justify-center gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button 
                        key={p}
                        onClick={() => setHistoryPage(p)}
                        className={cn(
                            "w-8 h-8 rounded-lg text-apple-footnote font-bold transition-all",
                            historyPage === p ? "bg-system-blue text-white shadow-lg" : "bg-secondary-background text-label-secondary hover:bg-secondary-background/80"
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
                    onClick={() => handlePrint(viewInvoice)}
                >
                Download PDF
                </Button>
            </div>
          </div>
        }
      >
        {viewInvoice && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-secondary-background/60 dark:bg-secondary-background/30 rounded-2xl border border-separator-apple/10">
              <div>
                <p className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-widest">Customer Information</p>
                <p className="text-apple-title-3 font-bold text-label-primary mt-1">{viewInvoice.customerName || 'Walk-in Customer'}</p>
                {viewInvoice.customerPhone && (
                  <p className="text-apple-subheadline text-label-secondary flex items-center gap-1.5 mt-1">
                    <ArrowRight className="h-3 w-3 text-label-tertiary" /> {viewInvoice.customerPhone}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-widest">Transaction Meta</p>
                <p className="text-apple-subheadline font-semibold text-label-primary mt-1 font-mono">{formatDate(viewInvoice.billDate)}</p>
                <p className="text-apple-footnote text-label-secondary font-mono">{formatTime(viewInvoice.billDate)}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-system-blue/10 text-system-blue text-apple-caption-2 font-bold rounded-lg border border-system-blue/10">
                    Billed By: {viewInvoice.billedBy?.name || 'System'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-widest mb-3">Itemized Bill</p>
              <div className="border border-separator-apple/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-apple-subheadline">
                    <thead className="bg-secondary-background/60 dark:bg-secondary-background/30 text-label-secondary font-bold text-apple-caption-2 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Medicine</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator-apple/10">
                      {viewInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-secondary-background/40">
                          <td className="px-4 py-3">
                            <p className="text-apple-headline font-semibold text-label-primary whitespace-nowrap">{item.medicineName}</p>
                            <p className="text-apple-caption-2 text-label-secondary font-mono mt-0.5">Batch: {item.batchNumber}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-tabular-nums whitespace-nowrap">{formatCurrency(item.sellingPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium text-tabular-nums">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-label-primary text-tabular-nums whitespace-nowrap">
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
                <div className="p-4 bg-secondary-background/60 dark:bg-secondary-background/30 rounded-2xl border border-separator-apple/10">
                    <p className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-widest mb-2">Payment Info</p>
                    <div className="flex justify-between items-center text-apple-subheadline">
                        <span className="text-label-secondary font-medium">Method</span>
                        <span className="px-2 py-0.5 bg-secondary-background border border-separator-apple/10 rounded text-apple-caption-2 font-bold uppercase">{viewInvoice.paymentMode}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-apple-subheadline">
                        <span className="text-label-secondary font-medium">Status</span>
                        <span className="text-system-green font-bold text-apple-caption-1">● SUCCESSFUL</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-apple-subheadline">
                        <span className="text-label-secondary font-medium">Subtotal</span>
                        <span className="font-semibold text-tabular-nums">{formatCurrency(viewInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-apple-subheadline">
                        <span className="text-label-secondary font-medium">Discount</span>
                        <span className="text-system-green font-semibold text-tabular-nums">-{formatCurrency(viewInvoice.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-apple-subheadline">
                        <span className="text-label-secondary font-medium">Taxation (GST)</span>
                        <span className="font-semibold text-tabular-nums">{formatCurrency(viewInvoice.totalGst)}</span>
                    </div>
                    <div className="pt-2 border-t border-separator-apple/10 flex justify-between">
                        <span className="text-apple-headline font-black text-label-primary">GRAND TOTAL</span>
                        <span className="text-apple-headline font-black text-system-blue text-tabular-nums">{formatCurrency(viewInvoice.grandTotal)}</span>
                    </div>
                </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
