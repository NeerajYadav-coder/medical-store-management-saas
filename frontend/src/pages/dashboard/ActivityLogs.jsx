import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@api/audit.api'
import { formatDate, formatRelativeTime } from '@utils/formatDate'
import { useAuth } from '@context/AuthContext'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  FileText, 
  ShoppingCart, 
  Truck, 
  AlertTriangle 
} from 'lucide-react'
import Button from '@components/common/Button'
import { Skeleton } from '@components/common/Loader'
import { cn } from '@utils/cn'
import { useStore } from '@context/StoreContext'
import PremiumLockOverlay from '@components/common/PremiumLockOverlay'
import PremiumModal from '@components/common/PremiumModal'
import { exportToPDF } from '@utils/exportPDF'
import toast from 'react-hot-toast'

export default function ActivityLogs() {
  const { user } = useAuth()
  const { store } = useStore()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
    search: ''
  })

  const isFree = store?.plan !== 'PREMIUM'

  // Fetch logs - only when not free
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => auditApi.getLogs({ page, limit: 20, ...filters }),
    keepPreviousData: true,
    enabled: !isFree,
  })

  const logs = data?.data || []
  const pagination = data?.pagination || {}

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleExport = async () => {
    const toastId = toast.loading('Preparing Activity Logs PDF...')
    try {
      const response = await auditApi.getLogs({
        page: 1,
        limit: 10000,
        ...filters
      })
      const allLogs = response?.data || []
      if (!allLogs.length) {
        toast.error('No activity logs found to export.', { id: toastId })
        return
      }

      const createCount = allLogs.filter(l => l.action === 'CREATE').length;
      const updateCount = allLogs.filter(l => l.action === 'UPDATE').length;
      const deleteCount = allLogs.filter(l => l.action === 'DELETE').length;

      exportToPDF(
        allLogs,
        [
          { label: 'Timestamp', key: 'createdAt', align: 'center', format: (val) => val ? new Date(val).toLocaleString('en-IN') : '—' },
          { label: 'User Name', key: 'userId.name', align: 'left', format: (val) => val || 'System' },
          { label: 'User Role', key: 'userId.role', align: 'center', format: (val) => val || 'SYSTEM' },
          { label: 'Action', key: 'action', align: 'center' },
          { label: 'Entity', key: 'entity', align: 'center' },
          { label: 'Method', key: 'details.method', align: 'center', format: (val) => val || '—' },
          { label: 'Details', key: 'details.url', align: 'left', format: (val) => val || '—' }
        ],
        {
          title: 'System Activity Logs',
          subtitle: `Comprehensive Audit Trail Ledger · Filtered Logs`,
          summaryCards: [
            { label: 'Total Operations', value: allLogs.length.toString() },
            { label: 'Data Creations', value: createCount.toString() },
            { label: 'Data Updates', value: updateCount.toString() },
            { label: 'Data Deletions', value: deleteCount.toString() }
          ]
        }
      )
      toast.success(`Successfully generated Activity Logs PDF.`, { id: toastId })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export activity logs PDF.', { id: toastId })
    }
  }

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE': 
        return { label: 'Added', color: 'text-green-700 bg-green-50 border border-green-200' }
      case 'UPDATE': 
        return { label: 'Changed', color: 'text-blue-700 bg-blue-50 border border-blue-200' }
      case 'DELETE': 
        return { label: 'Removed', color: 'text-red-700 bg-red-50 border border-red-200' }
      case 'LOGIN': 
        return { label: 'Signed In', color: 'text-purple-700 bg-purple-50 border border-purple-200' }
      default: 
        return { label: action, color: 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700' }
    }
  }

  const getFriendlyEntity = (entity) => {
    switch (entity) {
      case 'SALE': return 'Sale Bill'
      case 'PURCHASE': return 'Purchase Bill'
      case 'MEDICINE': return 'Medicine'
      case 'USER': return 'Staff / Helper'
      case 'SUPPLIER': return 'Supplier'
      case 'CUSTOMER': return 'Customer'
      default: return entity
    }
  }

  const getEntityIcon = (entity) => {
    switch (entity) {
      case 'SALE': return <ShoppingCart className="h-3.5 w-3.5" />
      case 'PURCHASE': return <Truck className="h-3.5 w-3.5" />
      case 'MEDICINE': return <FileText className="h-3.5 w-3.5" />
      case 'USER': return <User className="h-3.5 w-3.5" />
      case 'CUSTOMER': return <User className="h-3.5 w-3.5" />
      default: return <History className="h-3.5 w-3.5" />
    }
  }

  const getFriendlyDescription = (log) => {
    const body = log.details?.body || {}
    const action = log.action
    const entity = log.entityType || log.entity

    if (action === 'LOGIN') {
      return 'Logged in to the app.'
    }

    switch (entity) {
      case 'SALE':
        if (action === 'CREATE') {
          return (
            <span>
              Sold medicines to <strong className="text-gray-900 dark:text-white font-semibold">{body.customerName || 'Walk-in Customer'}</strong> for <strong className="text-brand-600 font-semibold">{formatCurrency(body.grandTotal || 0)}</strong>.
            </span>
          )
        }
        if (action === 'DELETE') {
          return 'Canceled and deleted a sale bill.'
        }
        return 'Changed details of a sale bill.'

      case 'PURCHASE':
        if (action === 'CREATE') {
          return (
            <span>
              Bought stock bill <strong className="text-gray-900 dark:text-white font-semibold font-mono">#{body.supplierBillNumber || ''}</strong> from supplier <strong className="text-gray-900 dark:text-white font-semibold">{body.supplierName || 'Unknown Supplier'}</strong> for <strong className="text-brand-600 font-semibold">{formatCurrency(body.grandTotal || 0)}</strong>.
            </span>
          )
        }
        return 'Changed details of a purchase bill.'

      case 'MEDICINE':
        if (action === 'CREATE') {
          return (
            <span>
              Added new medicine <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong> ({body.dosage || 'N/A'}) to inventory.
            </span>
          )
        }
        if (action === 'UPDATE') {
          return (
            <span>
              Changed details or stock level for medicine <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong>.
            </span>
          )
        }
        if (action === 'DELETE') {
          return 'Deleted medicine from the shop.'
        }
        return 'Changed medicine details.'

      case 'USER':
        if (action === 'CREATE') {
          return (
            <span>
              Added new helper <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong> as role <span className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 font-bold tracking-wide uppercase">{body.role || 'STAFF'}</span>.
            </span>
          )
        }
        if (action === 'UPDATE') {
          return (
            <span>
              Changed details for helper <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong>.
            </span>
          )
        }
        if (action === 'DELETE') {
          return 'Removed helper from the shop.'
        }
        return 'Changed helper details.'

      case 'SUPPLIER':
        if (action === 'CREATE') {
          return (
            <span>
              Added new supplier <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong>.
            </span>
          )
        }
        if (action === 'UPDATE') {
          return (
            <span>
              Changed details for supplier <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong>.
            </span>
          )
        }
        if (action === 'DELETE') {
          return 'Deleted supplier from the shop.'
        }
        return 'Changed supplier details.'

      case 'CUSTOMER':
        if (action === 'CREATE') {
          return (
            <span>
              Added new customer <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Walk-in Customer'}</strong> ({body.phone || 'N/A'}).
            </span>
          )
        }
        if (action === 'UPDATE') {
          return (
            <span>
              Changed details for customer <strong className="text-gray-900 dark:text-white font-semibold">{body.name || 'Unknown'}</strong>.
            </span>
          )
        }
        if (action === 'DELETE') {
          return 'Deleted customer from the shop.'
        }
        return 'Changed customer details.'

      default:
        return `${action.toLowerCase()}d ${entity?.toLowerCase() || 'item'}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">See a list of all sales, purchases, and changes made in your shop.</p>
        </div>
        {!isFree && (
          <div className="flex items-center gap-3">
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport} leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
        )}
      </div>

      {isFree ? (
        <PremiumLockOverlay 
          title="History Page Locked"
          description="Shop history is a Premium feature. Upgrade to the Premium Plan to see a history of all sales, purchases, and changes made by your helpers."
          onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        />
      ) : (
        <>
          {/* Filters (Simplified for now) */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search history..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <select 
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Add New</option>
              <option value="UPDATE">Change Details</option>
              <option value="DELETE">Remove</option>
              <option value="LOGIN">Sign In</option>
            </select>
            <select 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              value={filters.entity}
              onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
            >
              <option value="">All Pages</option>
              <option value="SALE">Sales</option>
              <option value="PURCHASE">Purchases</option>
              <option value="MEDICINE">Medicines</option>
              <option value="USER">Staff / Helpers</option>
              <option value="CUSTOMER">Customers</option>
              <option value="SUPPLIER">Suppliers</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-950/75 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Who Did It</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">What Happened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    // Loading Skeleton
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      </tr>
                    ))
                  ) : logs.length > 0 ? (
                    logs.map((log) => {
                      const actionBadge = getActionBadge(log.action)
                      return (
                        <tr key={log._id} className="hover:bg-gray-55/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(log.createdAt, 'MMM d, h:mm a')}</div>
                            <div className="text-xs text-gray-400">{formatRelativeTime(log.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm mr-3">
                                {log.userId?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{log.userId?.name || 'System'}</div>
                                <div className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full inline-block mt-0.5">{log.userId?.role || 'SYSTEM'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", actionBadge.color)}>
                              {actionBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="p-1 rounded bg-slate-100 text-slate-500">
                                {getEntityIcon(log.entityType || log.entity)}
                              </span>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{getFriendlyEntity(log.entityType || log.entity)}</span>
                            </div>
                            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{getFriendlyDescription(log)}</div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white">No logs found</p>
                        <p className="text-sm">Adjust filters or check back later.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <PremiumModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </div>
  )
}
