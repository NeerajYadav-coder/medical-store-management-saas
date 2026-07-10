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
import { exportToPDF } from '@utils/exportPDF'
import { getImageUrl } from '@utils/image'
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
  const { store, storeName, storeOwner } = useStore()
  const [page, setPage] = useState(1)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null })
  const [batchModal, setBatchModal] = useState({ isOpen: false, medicine: null })
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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

  // Handle CSV Import
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading('Reading CSV file...');
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) throw new Error('CSV must contain a header and at least one row');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const formIdx = headers.findIndex(h => h.includes('form'));
      const dosageIdx = headers.findIndex(h => h.includes('dosage'));
      const mrpIdx = headers.findIndex(h => h.includes('mrp'));
      
      if (nameIdx === -1 || formIdx === -1 || dosageIdx === -1 || mrpIdx === -1) {
        throw new Error('CSV must contain: Name, Form, Dosage, and MRP columns');
      }

      toast.loading(`Importing ${lines.length - 1} medicines...`, { id: toastId });
      let successCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 4) continue;
        
        try {
          await inventoryApi.createMedicine({
            name: cols[nameIdx],
            form: cols[formIdx].toUpperCase(),
            dosage: cols[dosageIdx],
            defaultMRP: parseFloat(cols[mrpIdx]) || 0,
            defaultSellingPrice: parseFloat(cols[mrpIdx]) || 0,
            unitType: 'STRIP'
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to import row ${i}:`, err);
        }
      }
      
      toast.success(`Successfully imported ${successCount} out of ${lines.length - 1} medicines`, { id: toastId });
      queryClient.invalidateQueries(['medicines']);
    } catch (error) {
      toast.error(error.message || 'Failed to import CSV', { id: toastId });
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
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
      return { label: 'Out of Stock', color: 'bg-system-red/10 text-system-red', priority: 3 }
    }
    if (stock <= reorder) {
      return { label: 'Low Stock', color: 'bg-system-orange/10 text-system-orange', priority: 2 }
    }
    return { label: 'In Stock', color: 'bg-system-green/10 text-system-green', priority: 1 }
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
          <div className="h-10 w-10 rounded-xl bg-system-blue/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-system-blue" />
          </div>
          <div>
            <p className="text-apple-headline font-semibold text-label-primary">{medicine.name}</p>
            <p className="text-apple-caption-1 text-label-secondary">{medicine.genericName || medicine.manufacturer || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'form',
      label: 'Form',
      render: (value, medicine) => (
        <div>
          <span className="px-2.5 py-0.5 text-apple-footnote font-semibold rounded-full bg-secondary-background text-label-secondary border border-separator-apple/10">
            {getFormLabel(value)}
          </span>
          <p className="text-[10px] text-label-tertiary mt-1 font-mono">{medicine.dosage}</p>
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
            <span className="text-apple-body font-semibold text-label-primary text-tabular-nums">{stock} units</span>
            <span className={cn('ml-2 px-2 py-0.5 text-apple-caption-2 font-semibold rounded-full', status.color)}>
              {status.label}
            </span>
            <p className="text-[10px] text-label-tertiary mt-0.5">Reorder at {medicine.reorderLevel ?? 10}</p>
          </div>
        )
      },
    },
    {
      key: 'defaultMRP',
      label: 'MRP',
      render: (value) => <span className="text-apple-body font-semibold text-label-primary text-tabular-nums">{formatCurrency(value ?? 0)}</span>,
    },
    {
      key: 'nearestExpiry',
      label: 'Nearest Expiry',
      render: (value) => {
        if (!value) return <span className="text-label-tertiary text-apple-subheadline">No batches</span>
        const expiry = formatExpiryDate(value)
        return (
          <div className="flex items-center gap-2">
            {expiry.status === 'expired' && <AlertTriangle className="h-4 w-4 text-system-red" />}
            {expiry.status === 'critical' && <Clock className="h-4 w-4 text-system-orange" />}
            <span className={cn(
              'text-apple-subheadline font-medium',
              expiry.status === 'expired' && 'text-system-red font-semibold',
              expiry.status === 'critical' && 'text-system-orange font-semibold',
              expiry.status === 'warning' && 'text-system-orange',
              expiry.status === 'ok' && 'text-label-secondary',
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
          'text-apple-body font-semibold text-tabular-nums',
          value > 0 ? 'text-system-blue' : 'text-label-tertiary'
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
            className="p-2 rounded-lg text-label-secondary hover:text-system-blue hover:bg-system-blue/10 transition-apple-micro active-apple-press"
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
              className="p-2 rounded-lg text-label-secondary hover:text-system-blue hover:bg-system-blue/10 transition-apple-micro active-apple-press"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, item: medicine })}
              className="p-2 rounded-lg text-label-secondary hover:text-system-red hover:bg-system-red/10 transition-apple-micro active-apple-press"
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
          ],
          storeName,
          storeOwner,
          storeLogo: store?.logo ? getImageUrl(store.logo) : ''
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
        ],
        storeName,
        storeOwner,
        storeLogo: store?.logo ? getImageUrl(store.logo) : ''
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
          <h1 className="text-apple-title-1 font-semibold text-label-primary tracking-tight">Inventory</h1>
          <p className="text-apple-subheadline text-label-secondary mt-1">Live stock from batches · <span className="font-semibold text-tabular-nums">{pagination.total ?? 0}</span> medicines</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportAll} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          {canManageInventory && (
          <>
            <label className={cn(
              "inline-flex items-center justify-center gap-2 px-4 h-9 text-apple-subheadline font-semibold transition-apple-micro rounded-xl border border-separator-apple/20 bg-secondary-background text-label-primary hover:bg-secondary-background/80 cursor-pointer active-apple-press shadow-sm",
              isImporting && "opacity-50 cursor-not-allowed"
            )}>
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import'}
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingMedicine(null)
                setShowFormModal(true)
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
        <div className="card p-4">
          <p className="text-apple-footnote text-label-secondary">Total Medicines</p>
          <p className="text-apple-title-2 font-bold text-label-primary mt-1 text-tabular-nums">{stats.total}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-system-orange">
          <p className="text-apple-footnote text-system-orange font-semibold">Low Stock</p>
          <p className="text-apple-title-2 font-bold text-label-primary mt-1 text-tabular-nums">{stats.lowStock}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-system-red">
          <p className="text-apple-footnote text-system-red font-semibold">Out of Stock</p>
          <p className="text-apple-title-2 font-bold text-label-primary mt-1 text-tabular-nums">{stats.outOfStock}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-system-orange">
          <p className="text-apple-footnote text-system-orange font-semibold">Expiring Soon</p>
          <p className="text-apple-title-2 font-bold text-label-primary mt-1 text-tabular-nums">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 bg-card">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select
              options={FORM_FILTERS}
              value={formFilter}
              onChange={(e) => updateFilter('form', e.target.value)}
              className="w-full sm:w-40"
            />
            <Select
              options={STOCK_FILTERS}
              value={stockFilter}
              onChange={(e) => updateFilter('filter', e.target.value)}
              className="w-full sm:w-40"
            />
            <Button
              variant="ghost"
              onClick={refetch}
              className={cn("w-full sm:w-auto flex justify-center", isFetching && 'animate-spin')}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(formFilter || stockFilter || search) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-separator-apple/10">
            <span className="text-apple-subheadline text-label-secondary">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-system-blue/10 text-system-blue border border-system-blue/20 rounded-full text-apple-footnote">
                Search: {search}
                <button onClick={clearSearch} className="hover:opacity-80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {formFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-system-blue/10 text-system-blue border border-system-blue/20 rounded-full text-apple-footnote">
                {FORM_FILTERS.find(f => f.value === formFilter)?.label}
                <button onClick={() => updateFilter('form', '')} className="hover:opacity-80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {stockFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-system-blue/10 text-system-blue border border-system-blue/20 rounded-full text-apple-footnote">
                {STOCK_FILTERS.find(f => f.value === stockFilter)?.label}
                <button onClick={() => updateFilter('filter', '')} className="hover:opacity-80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                clearSearch()
                setSearchParams({})
              }}
              className="text-apple-subheadline font-semibold text-system-blue hover:text-system-blue/80"
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
    return <div className="text-center py-8 text-label-secondary text-apple-subheadline">Loading batches...</div>
  }

  if (!batchList.length) {
    return (
      <div className="text-center py-12 text-label-secondary text-apple-subheadline">
        <Layers className="h-10 w-10 mx-auto mb-3 opacity-30 text-label-tertiary" />
        <p>No active batches found for this medicine.</p>
        <p className="text-apple-footnote mt-1 text-label-tertiary">Purchase this medicine to create a batch.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {batchList.map((batch) => {
        const expiry = formatExpiryDate(batch.expiryDate)
        return (
          <div key={batch._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 p-4 bg-secondary-background/60 dark:bg-secondary-background/30 rounded-xl border border-separator-apple/10">
            <div>
              <p className="text-apple-headline font-bold text-label-primary font-mono">{batch.batchNumber}</p>
              <p className={cn(
                'text-apple-caption-1 mt-0.5',
                expiry.status === 'expired' ? 'text-system-red font-semibold' :
                expiry.status === 'critical' ? 'text-system-orange font-semibold' : 'text-label-secondary'
              )}>
                Expiry: {expiry.text}
              </p>
            </div>
            <div className="flex justify-between sm:block sm:text-right w-full sm:w-auto">
              <p className="text-[10px] text-label-tertiary sm:hidden">Units Remaining</p>
              <div>
                <p className="text-apple-headline font-bold text-system-blue text-tabular-nums">{batch.quantityRemaining}</p>
                <p className="text-[10px] text-label-secondary hidden sm:block">units remaining</p>
              </div>
            </div>
            <div className="flex justify-between sm:block sm:text-right sm:ml-6 w-full sm:w-auto">
              <p className="text-[10px] text-label-tertiary sm:hidden">Selling Price</p>
              <div>
                <p className="text-apple-headline font-semibold text-label-primary text-tabular-nums">{formatCurrency(batch.sellingPrice)}</p>
                <p className="text-[10px] text-label-secondary hidden sm:block">selling price</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
