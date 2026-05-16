/**
 * pages/dashboard/Inventory.jsx
 * 
 * RESPONSIBILITY:
 * - Medicine inventory management
 * - Stock tracking and alerts
 * - Batch management
 * - Search, filter, and pagination
 */

import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Package,
  AlertTriangle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCcw,
  ChevronDown,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@utils/formatCurrency'
import { formatDate, formatExpiryDate, getDaysUntil } from '@utils/formatDate'
import { inventoryApi } from '@api/inventory.api'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'
import { Input, Select, SearchInput } from '@components/common/Input'
import { Table, TablePagination } from '@components/common/Table'
import { Modal, DeleteModal } from '@components/common/Modal'
import { Skeleton, SkeletonTableRows } from '@components/common/Loader'
import { useDebouncedSearch } from '@hooks/useDebounce'
import { useAuth } from '@context/AuthContext'

// Medicine categories
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'tablets', label: 'Tablets' },
  { value: 'capsules', label: 'Capsules' },
  { value: 'syrups', label: 'Syrups' },
  { value: 'injections', label: 'Injections' },
  { value: 'ointments', label: 'Ointments' },
  { value: 'drops', label: 'Drops' },
  { value: 'powders', label: 'Powders' },
  { value: 'others', label: 'Others' },
]

// Stock filters
const STOCK_FILTERS = [
  { value: '', label: 'All Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

/**
 * Inventory Page
 */
export default function Inventory() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission } = useAuth()
  
  const canManageInventory = hasPermission('MANAGE_INVENTORY')

  // State
  const [page, setPage] = useState(1)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null })

  // Search with debounce
  const { value: searchValue, debouncedValue: search, onChange: onSearchChange, clear: clearSearch } = useDebouncedSearch()

  // Filters from URL params
  const category = searchParams.get('category') || ''
  const stockFilter = searchParams.get('filter') || ''
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') || 'asc'

  // Fetch medicines
  const {
    data: medicinesData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['medicines', { page, search, category, stockFilter, sortBy, sortOrder }],
    queryFn: () => inventoryApi.getMedicines({
      page,
      limit: 20,
      search,
      category,
      lowStock: stockFilter === 'low',
      outOfStock: stockFilter === 'out',
      expiring: stockFilter === 'expiring',
      expired: stockFilter === 'expired',
      sortBy,
      sortOrder,
    }),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  })

  // Mock data for demonstration
  const mockMedicines = [
    {
      _id: '1',
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      category: 'Tablets',
      manufacturer: 'Cipla Ltd',
      currentStock: 45,
      minStockLevel: 50,
      mrp: 25.50,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      batches: 3,
    },
    {
      _id: '2',
      name: 'Amoxicillin 250mg',
      genericName: 'Amoxicillin Trihydrate',
      category: 'Capsules',
      manufacturer: 'Sun Pharma',
      currentStock: 120,
      minStockLevel: 30,
      mrp: 85.00,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      batches: 2,
    },
    {
      _id: '3',
      name: 'Omeprazole 20mg',
      genericName: 'Omeprazole',
      category: 'Capsules',
      manufacturer: 'Dr. Reddy\'s',
      currentStock: 8,
      minStockLevel: 25,
      mrp: 45.00,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      batches: 1,
    },
    {
      _id: '4',
      name: 'Cough Syrup',
      genericName: 'Dextromethorphan',
      category: 'Syrups',
      manufacturer: 'Lupin Ltd',
      currentStock: 0,
      minStockLevel: 15,
      mrp: 120.00,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      batches: 0,
    },
    {
      _id: '5',
      name: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      category: 'Tablets',
      manufacturer: 'Abbott',
      currentStock: 200,
      minStockLevel: 50,
      mrp: 350.00,
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      batches: 4,
    },
  ]

  const medicines = medicinesData?.data || mockMedicines
  const pagination = medicinesData?.pagination || { total: mockMedicines.length, totalPages: 1, page: 1 }

  // Get stock status
  const getStockStatus = (medicine) => {
    if (medicine.currentStock === 0) {
      return { label: 'Out of Stock', color: 'bg-danger-100 text-danger-700', priority: 3 }
    }
    if (medicine.currentStock <= medicine.minStockLevel) {
      return { label: 'Low Stock', color: 'bg-warning-100 text-warning-700', priority: 2 }
    }
    return { label: 'In Stock', color: 'bg-success-100 text-success-700', priority: 1 }
  }

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Medicine',
      render: (_, medicine) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{medicine.name}</p>
            <p className="text-sm text-gray-500">{medicine.genericName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {value}
        </span>
      ),
    },
    {
      key: 'currentStock',
      label: 'Stock',
      render: (value, medicine) => {
        const status = getStockStatus(medicine)
        return (
          <div>
            <span className="font-medium text-gray-900">{value} units</span>
            <span className={cn('ml-2 px-2 py-0.5 text-xs rounded-full', status.color)}>
              {status.label}
            </span>
          </div>
        )
      },
    },
    {
      key: 'mrp',
      label: 'MRP',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'expiryDate',
      label: 'Nearest Expiry',
      render: (value) => {
        const expiry = formatExpiryDate(value)
        return (
          <div className="flex items-center gap-2">
            {expiry.status === 'expired' && <AlertTriangle className="h-4 w-4 text-danger-500" />}
            {expiry.status === 'critical' && <Clock className="h-4 w-4 text-warning-500" />}
            <span className={cn(
              expiry.status === 'expired' && 'text-danger-600',
              expiry.status === 'critical' && 'text-warning-600',
              expiry.status === 'warning' && 'text-orange-600'
            )}>
              {expiry.text}
            </span>
          </div>
        )
      },
    },
    {
      key: 'batches',
      label: 'Batches',
      align: 'center',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (_, medicine) => (
        <div className="flex items-center justify-end gap-1">
          <button
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canManageInventory && (
          <>
            <button
              className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, item: medicine })}
              className="p-2 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
          )}
        </div>
      ),
    },
  ]

  // Handle filter changes
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
    setPage(1)
  }

  // Stats summary
  const stats = useMemo(() => {
    const total = medicines.length
    const lowStock = medicines.filter(m => m.currentStock <= m.minStockLevel && m.currentStock > 0).length
    const outOfStock = medicines.filter(m => m.currentStock === 0).length
    const expiringSoon = medicines.filter(m => getDaysUntil(m.expiryDate) <= 30 && getDaysUntil(m.expiryDate) > 0).length

    return { total, lowStock, outOfStock, expiringSoon }
  }, [medicines])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">Manage your medicine stock and batches</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          {canManageInventory && (
          <>
            <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>
              Import
            </Button>
            <Link to={ROUTES.INVENTORY_ADD}>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Medicine
              </Button>
            </Link>
          </>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Medicines</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-warning-50 rounded-lg border border-warning-200 p-4">
          <p className="text-sm text-warning-600">Low Stock</p>
          <p className="text-2xl font-bold text-warning-700 mt-1">{stats.lowStock}</p>
        </div>
        <div className="bg-danger-50 rounded-lg border border-danger-200 p-4">
          <p className="text-sm text-danger-600">Out of Stock</p>
          <p className="text-2xl font-bold text-danger-700 mt-1">{stats.outOfStock}</p>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <p className="text-sm text-orange-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              onClear={clearSearch}
              placeholder="Search medicines by name, generic name, or manufacturer..."
            />
          </div>

          {/* Filter toggles */}
          <div className="flex items-center gap-2">
            <Select
              options={CATEGORIES}
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-40"
            />
            <Select
              options={STOCK_FILTERS}
              value={stockFilter}
              onChange={(e) => updateFilter('filter', e.target.value)}
              className="w-40"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              className={cn(isFetching && 'animate-spin')}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(category || stockFilter || search) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-sm">
                Search: {search}
                <button onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-sm">
                {CATEGORIES.find(c => c.value === category)?.label}
                <button onClick={() => updateFilter('category', '')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {stockFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-sm">
                {STOCK_FILTERS.find(f => f.value === stockFilter)?.label}
                <button onClick={() => updateFilter('filter', '')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                clearSearch()
                setSearchParams({})
              }}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={medicines}
        isLoading={isLoading}
        emptyMessage="No medicines found"
        emptyIcon={<Package className="h-12 w-12" />}
        selectable
        selectedRows={selectedMedicines}
        onSelectRows={setSelectedMedicines}
        onRowClick={(medicine) => {
          // Navigate to medicine detail
        }}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: 20,
        }}
        onPageChange={setPage}
        hoverable
      />

      {/* Bulk actions */}
      {selectedMedicines.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-40">
          <span className="text-sm">{selectedMedicines.length} selected</span>
          <div className="w-px h-4 bg-gray-600" />
          <button className="text-sm hover:text-brand-300 transition-colors">
            Export Selected
          </button>
          {canManageInventory && (
          <button className="text-sm hover:text-danger-300 transition-colors">
            Delete Selected
          </button>
          )}
          <button
            onClick={() => setSelectedMedicines([])}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={() => {
          // Handle delete
          setDeleteModal({ isOpen: false, item: null })
        }}
        itemName={deleteModal.item?.name}
      />
    </div>
  )
}
