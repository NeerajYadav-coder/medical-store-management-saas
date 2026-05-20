/**
 * pages/dashboard/Inventory.jsx
 * 
 * RESPONSIBILITY:
 * - Medicine inventory management with LIVE stock data
 * - Stock tracking from MedicineBatch aggregation
 * - Search, filter by form type, stock status, pagination
 */

import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Eye,
  RefreshCcw,
  X,
  Download,
  Upload,
  Layers,
  TrendingDown,
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
import { useStore } from '@context/StoreContext'
import PremiumModal from '@components/common/PremiumModal'
import { exportToPDF } from '@utils/exportPDF'
import toast from 'react-hot-toast'
import MedicineForm from '@components/inventory/MedicineForm'

// Medicine form types matching backend enum
const FORM_FILTERS = [
  { value: '', label: 'All Forms' },
  { value: 'TABLET', label: 'Tablets' },
  { value: 'CAPSULE', label: 'Capsules' },
  { value: 'SYRUP', label: 'Syrups' },
  { value: 'INJECTION', label: 'Injections' },
  { value: 'CREAM', label: 'Creams' },
  { value: 'OINTMENT', label: 'Ointments' },
  { value: 'DROPS', label: 'Drops' },
  { value: 'POWDER', label: 'Powders' },
  { value: 'GEL', label: 'Gels' },
  { value: 'SUSPENSION', label: 'Suspensions' },
  { value: 'OTHER', label: 'Others' },
]

// Stock status filters
const STOCK_FILTERS = [
  { value: '', label: 'All Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

// PDF columns configuration
const EXPORT_COLUMNS = [
  { label: 'Medicine Name', key: 'name', align: 'left' },
  { label: 'Generic Name', key: 'genericName', align: 'left' },
  { label: 'Form', key: 'form', align: 'center', format: (val) => val || '—' },
  { label: 'Dosage', key: 'dosage', align: 'center' },
  { label: 'Current Stock', key: 'currentStock', align: 'right', format: (val) => val ?? 0 },
  { label: 'Reorder Level', key: 'reorderLevel', align: 'right', format: (val) => val ?? 10 },
  { label: 'Default MRP', key: 'defaultMRP', align: 'right', format: (val) => val ? `₹${val}` : '₹0' },
  { label: 'Manufacturer', key: 'manufacturer', align: 'left' },
  { label: 'Nearest Expiry', key: 'nearestExpiry', align: 'center', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
  { label: 'Active Batches', key: 'batchCount', align: 'center', format: (val) => val ?? 0 }
]

/**
 * Inventory Page — Live data from backend
 */
export default function Inventory() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission } = useAuth()
  
  const canManageInventory = hasPermission('MANAGE_INVENTORY')

  // State
  const { store } = useStore()
  const [page, setPage] = useState(1)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null })
  const [batchModal, setBatchModal] = useState({ isOpen: false, medicine: null })
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle delete
  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      if (deleteModal.isBulk) {
        const promises = selectedMedicines.map(id => inventoryApi.deleteMedicine(id))
        await Promise.all(promises)
        toast.success(`${selectedMedicines.length} medicines deleted successfully`)
        setSelectedMedicines([])
      } else {
        if (!deleteModal.item?._id) return
        await inventoryApi.deleteMedicine(deleteModal.item._id)
        toast.success(`${deleteModal.item.name} deleted successfully`)
      }
      queryClient.invalidateQueries(['medicines'])
      setDeleteModal({ isOpen: false, item: null, isBulk: false })
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error(error.response?.data?.message || 'Failed to delete medicine(s)')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle create/update
  const handleSaveMedicine = async (formData) => {
    setFormLoading(true)
    try {
      if (editingMedicine) {
        await inventoryApi.updateMedicine(editingMedicine._id, formData)
        toast.success('Medicine updated successfully')
      } else {
        await inventoryApi.createMedicine(formData)
        toast.success('Medicine created successfully')
      }
      setShowFormModal(false)
      setEditingMedicine(null)
      queryClient.invalidateQueries(['medicines'])
    } catch (error) {
      console.error('Save failed:', error)
      toast.error(error.response?.data?.message || 'Failed to save medicine')
    } finally {
      setFormLoading(false)
    }
  }

  // Search with debounce
  const { value: searchValue, debouncedValue: search, onChange: onSearchChange, clear: clearSearch } = useDebouncedSearch()

  // Filters from URL params
  const formFilter = searchParams.get('form') || ''
  const stockFilter = searchParams.get('filter') || ''
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') || 'asc'

  // Fetch medicines with live stock data
  const {
    data: medicinesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['medicines', { page, search, formFilter, stockFilter, sortBy, sortOrder }],
    queryFn: () => inventoryApi.getMedicines({
      page,
      limit: 20,
      search,
      form: formFilter,
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

  // The axios interceptor does NOT unwrap paginated responses (they have 'pagination' key)
  // so medicinesResponse = { success, data, pagination }
  const medicines = medicinesResponse?.data || []
  const pagination = medicinesResponse?.pagination || { total: 0, pages: 1, page: 1 }

  // Get stock status for a medicine
  const getStockStatus = (medicine) => {
    const stock = medicine.currentStock ?? 0
    const reorder = medicine.reorderLevel ?? 10
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-danger-100 text-danger-700', priority: 3 }
    }
    if (stock <= reorder) {
      return { label: 'Low Stock', color: 'bg-warning-100 text-warning-700', priority: 2 }
    }
    return { label: 'In Stock', color: 'bg-success-100 text-success-700', priority: 1 }
  }

  // Form display label
  const getFormLabel = (form) => {
    const map = {
      TABLET: 'Tablet', CAPSULE: 'Capsule', SYRUP: 'Syrup',
      INJECTION: 'Injection', CREAM: 'Cream', OINTMENT: 'Ointment',
      DROPS: 'Drops', POWDER: 'Powder', GEL: 'Gel',
      SPRAY: 'Spray', INHALER: 'Inhaler', SUSPENSION: 'Suspension',
      LOTION: 'Lotion', PATCH: 'Patch', SUPPOSITORY: 'Suppository', OTHER: 'Other',
    }
    return map[form] || form || '—'
  }

  // Table columns — mapped to real backend fields
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
            <p className="font-semibold text-gray-900">{medicine.name}</p>
            <p className="text-xs text-gray-500">{medicine.genericName || medicine.manufacturer || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'form',
      label: 'Form',
      render: (value, medicine) => (
        <div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            {getFormLabel(value)}
          </span>
          <p className="text-[10px] text-gray-400 mt-1">{medicine.dosage}</p>
        </div>
      ),
    },
    {
      key: 'currentStock',
      label: 'Stock',
      render: (value, medicine) => {
        const status = getStockStatus(medicine)
        const stock = value ?? 0
        return (
          <div>
            <span className="font-semibold text-gray-900">{stock} units</span>
            <span className={cn('ml-2 px-2 py-0.5 text-xs rounded-full', status.color)}>
              {status.label}
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">Reorder at {medicine.reorderLevel ?? 10}</p>
          </div>
        )
      },
    },
    {
      key: 'defaultMRP',
      label: 'MRP',
      render: (value) => <span className="font-medium">{formatCurrency(value ?? 0)}</span>,
    },
    {
      key: 'nearestExpiry',
      label: 'Nearest Expiry',
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">No batches</span>
        const expiry = formatExpiryDate(value)
        return (
          <div className="flex items-center gap-2">
            {expiry.status === 'expired' && <AlertTriangle className="h-4 w-4 text-danger-500" />}
            {expiry.status === 'critical' && <Clock className="h-4 w-4 text-warning-500" />}
            <span className={cn(
              'text-sm',
              expiry.status === 'expired' && 'text-danger-600 font-medium',
              expiry.status === 'critical' && 'text-warning-600 font-medium',
              expiry.status === 'warning' && 'text-orange-600',
              expiry.status === 'ok' && 'text-gray-600',
            )}>
              {expiry.text}
            </span>
          </div>
        )
      },
    },
    {
      key: 'batchCount',
      label: 'Batches',
      align: 'center',
      render: (value) => (
        <span className={cn(
          'font-semibold text-sm',
          value > 0 ? 'text-brand-600' : 'text-gray-400'
        )}>
          {value ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (_, medicine) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setBatchModal({ isOpen: true, medicine })}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="View Batches"
          >
            <Layers className="h-4 w-4" />
          </button>
          {canManageInventory && (
          <>
            <button
              onClick={() => {
                setEditingMedicine(medicine)
                setShowFormModal(true)
              }}
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

  // Export all matching current filters
  const handleExportAll = async () => {
    const toastId = toast.loading('Preparing PDF report...')
    try {
      const response = await inventoryApi.getMedicines({
        page: 1,
        limit: 10000,
        search,
        form: formFilter,
        lowStock: stockFilter === 'low',
        outOfStock: stockFilter === 'out',
        expiring: stockFilter === 'expiring',
        expired: stockFilter === 'expired',
        sortBy,
        sortOrder,
      })

      const allMedicines = response?.data || []
      if (!allMedicines.length) {
        toast.error('No medicines match your current filters to export.', { id: toastId })
        return
      }

      exportToPDF(
        allMedicines,
        EXPORT_COLUMNS,
        {
          title: 'Inventory Audit Report',
          subtitle: `Active Inventory Items · Filter: ${stockFilter || 'All Stock'}`,
          summaryCards: [
            { label: 'Total Medicines', value: stats.total.toString() },
            { label: 'Low Stock Items', value: stats.lowStock.toString() },
            { label: 'Out of Stock', value: stats.outOfStock.toString() },
            { label: 'Expiring Soon', value: stats.expiringSoon.toString() }
          ]
        }
      )
      toast.success(`Successfully generated PDF report.`, { id: toastId })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export inventory PDF. Please try again.', { id: toastId })
    }
  }

  // Export selected items
  const handleExportSelected = () => {
    if (!selectedMedicines.length) return
    const selectedData = medicines.filter(m => selectedMedicines.includes(m._id))
    if (!selectedData.length) {
      toast.error('Details of selected medicines not found on this page.')
      return
    }

    exportToPDF(
      selectedData,
      EXPORT_COLUMNS,
      {
        title: 'Selected Inventory Audit Report',
        subtitle: `Selected ${selectedData.length} Medicines List`,
        summaryCards: [
          { label: 'Selected Medicines', value: selectedData.length.toString() },
          { label: 'Low Stock Checked', value: selectedData.filter(m => (m.currentStock ?? 0) <= (m.reorderLevel ?? 10)).length.toString() }
        ]
      }
    )
    toast.success(`Successfully generated PDF report for selected medicines.`)
  }

  // Live stats from real data
  const stats = useMemo(() => {
    const total = pagination.total || medicines.length
    const lowStock = medicines.filter(m => {
      const s = m.currentStock ?? 0
      const r = m.reorderLevel ?? 10
      return s > 0 && s <= r
    }).length
    const outOfStock = medicines.filter(m => (m.currentStock ?? 0) === 0).length
    const expiringSoon = medicines.filter(m => {
      const days = getDaysUntil(m.nearestExpiry)
      return days !== null && days <= 30 && days > 0
    }).length

    return { total, lowStock, outOfStock, expiringSoon }
  }, [medicines, pagination.total])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">Live stock from batches · {pagination.total ?? 0} medicines</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportAll} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          {canManageInventory && (
          <>
            <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>
              Import
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                const isFree = store?.plan !== 'PREMIUM'
                if (isFree && stats.total >= 100) {
                  setIsUpgradeModalOpen(true)
                } else {
                  setEditingMedicine(null)
                  setShowFormModal(true)
                }
              }}
            >
              Add Medicine
            </Button>
          </>
          )}
        </div>
      </div>

      {/* Stats Summary — from live API data */}
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
              options={FORM_FILTERS}
              value={formFilter}
              onChange={(e) => updateFilter('form', e.target.value)}
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
        {(formFilter || stockFilter || search) && (
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
            {formFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-sm">
                {FORM_FILTERS.find(f => f.value === formFilter)?.label}
                <button onClick={() => updateFilter('form', '')}>
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
        emptyMessage={
          search || formFilter || stockFilter
            ? 'No medicines match your filters'
            : 'No medicines found. Add medicines via Purchase (Inward) to see stock here.'
        }
        emptyIcon={<Package className="h-12 w-12" />}
        selectable
        selectedRows={selectedMedicines}
        onSelectRows={setSelectedMedicines}
        pagination={{
          currentPage: page,
          totalPages: pagination.pages,
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
          <button onClick={handleExportSelected} className="text-sm hover:text-brand-300 transition-colors">
            Export Selected
          </button>
          {canManageInventory && (
          <button
            onClick={() => setDeleteModal({ isOpen: true, item: null, isBulk: true })}
            className="text-sm hover:text-danger-300 transition-colors"
          >
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

      {/* Batch Detail Modal */}
      <Modal
        isOpen={batchModal.isOpen}
        onClose={() => setBatchModal({ isOpen: false, medicine: null })}
        title={batchModal.medicine ? `Batches — ${batchModal.medicine.name}` : ''}
        size="lg"
      >
        {batchModal.medicine && (
          <BatchDetailView medicine={batchModal.medicine} />
        )}
      </Modal>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isBulk: false })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteModal.isBulk ? `${selectedMedicines.length} selected medicines` : deleteModal.item?.name}
        isLoading={isDeleting}
      />

      <PremiumModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />

      {/* Medicine Form Modal */}
      {showFormModal && (
        <MedicineForm
          medicine={editingMedicine}
          onSubmit={handleSaveMedicine}
          onClose={() => {
            setShowFormModal(false)
            setEditingMedicine(null)
          }}
          isLoading={formLoading}
        />
      )}
    </div>
  )
}

/**
 * Mini component to show batch details in the modal
 */
function BatchDetailView({ medicine }) {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['medicine-batches', medicine._id],
    queryFn: () => inventoryApi.getBatches(medicine._id),
  })

  const batchList = Array.isArray(batches) ? batches : (batches?.data || [])

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading batches...</div>
  }

  if (!batchList.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>No active batches found for this medicine.</p>
        <p className="text-sm mt-1">Purchase this medicine to create a batch.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {batchList.map((batch) => {
        const expiry = formatExpiryDate(batch.expiryDate)
        return (
          <div key={batch._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900 font-mono">{batch.batchNumber}</p>
              <p className={cn(
                'text-xs mt-0.5',
                expiry.status === 'expired' ? 'text-danger-600' :
                expiry.status === 'critical' ? 'text-warning-600' : 'text-gray-500'
              )}>
                Expiry: {expiry.text}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-700 text-lg">{batch.quantityRemaining}</p>
              <p className="text-[10px] text-gray-400">units remaining</p>
            </div>
            <div className="text-right ml-6">
              <p className="font-medium text-gray-700">{formatCurrency(batch.sellingPrice)}</p>
              <p className="text-[10px] text-gray-400">selling price</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
