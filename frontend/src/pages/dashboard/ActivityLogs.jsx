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

export default function ActivityLogs() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
    search: ''
  })

  // Fetch logs
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => auditApi.getLogs({ page, limit: 20, ...filters }),
    keepPreviousData: true,
  })

  const logs = data?.data || []
  const pagination = data?.pagination || {}

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-50'
      case 'UPDATE': return 'text-blue-600 bg-blue-50'
      case 'DELETE': return 'text-red-600 bg-red-50'
      case 'LOGIN': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getEntityIcon = (entity) => {
    switch (entity) {
      case 'SALE': return <ShoppingCart className="h-4 w-4" />
      case 'PURCHASE': return <Truck className="h-4 w-4" />
      case 'MEDICINE': return <FileText className="h-4 w-4" />
      case 'USER': return <User className="h-4 w-4" />
      default: return <History className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-500 mt-1">Track comprehensive audit trail of all actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filter
          </Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Filters (Simplified for now) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search logs..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
          value={filters.action}
          onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
        </select>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
          value={filters.entity}
          onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
        >
          <option value="">All Entities</option>
          <option value="SALE">Sales</option>
          <option value="PURCHASE">Purchases</option>
          <option value="MEDICINE">Medicines</option>
          <option value="USER">Users</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
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
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{formatDate(log.createdAt, 'MMM d, HH:mm')}</div>
                      <div className="text-xs">{formatRelativeTime(log.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs mr-3">
                          {log.userId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.userId?.name || 'System'}</div>
                          <div className="text-xs text-gray-500">{log.userId?.role || 'SYSTEM'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getActionColor(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700 gap-2">
                        {getEntityIcon(log.entity)}
                        <span>{log.entity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                      {/* Show simplified details */}
                      {log.details?.url && <div className="truncate w-48" title={log.details.url}>{log.details.method} {log.details.url}</div>}
                      {log.entityId && <div className="text-xs text-gray-400">ID: {log.entityId}</div>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No logs found</p>
                    <p className="text-sm">Adjust filters or check back later.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-700">
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
    </div>
  )
}
