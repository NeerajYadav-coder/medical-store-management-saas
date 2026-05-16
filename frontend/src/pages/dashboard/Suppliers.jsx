/**
 * pages/dashboard/Suppliers.jsx
 * 
 * RESPONSIBILITY:
 * - Supplier management
 * - Supplier directory
 * - Contact and order history
 */

import { useState } from 'react'
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Package,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@utils/formatCurrency'
import Button from '@components/common/Button'
import { SearchInput, Select } from '@components/common/Input'
import { Table } from '@components/common/Table'
import { Modal, DeleteModal } from '@components/common/Modal'

/**
 * Suppliers Page
 */
export default function Suppliers() {
  const [page, setPage] = useState(1)
  const [viewSupplier, setViewSupplier] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null })
  const [showAddModal, setShowAddModal] = useState(false)

  // Mock data
  const mockSuppliers = [
    {
      _id: '1',
      name: 'ABC Pharmaceuticals',
      contactPerson: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'orders@abcpharma.com',
      address: 'Industrial Area, Hyderabad',
      gstNumber: '36AABCU9603R1ZM',
      totalOrders: 45,
      totalValue: 1250000,
      status: 'active',
    },
    {
      _id: '2',
      name: 'MedSupply India',
      contactPerson: 'Priya Sharma',
      phone: '9876543211',
      email: 'sales@medsupply.in',
      address: 'Pharma City, Mumbai',
      gstNumber: '27AABCU9603R1ZM',
      totalOrders: 32,
      totalValue: 890000,
      status: 'active',
    },
    {
      _id: '3',
      name: 'Global Pharma Ltd',
      contactPerson: 'Amit Shah',
      phone: '9876543212',
      email: 'orders@globalpharma.com',
      address: 'SEZ, Ahmedabad',
      gstNumber: '24AABCU9603R1ZM',
      totalOrders: 18,
      totalValue: 450000,
      status: 'inactive',
    },
  ]

  const columns = [
    {
      key: 'name',
      label: 'Supplier',
      render: (_, supplier) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{supplier.name}</p>
            <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (_, supplier) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5" />
            {supplier.phone}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-3.5 w-3.5" />
            {supplier.email}
          </div>
        </div>
      ),
    },
    {
      key: 'totalOrders',
      label: 'Orders',
      align: 'center',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'totalValue',
      label: 'Total Business',
      render: (value) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={cn(
          'px-2.5 py-1 text-xs font-medium rounded-full',
          value === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'
        )}>
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (_, supplier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewSupplier(supplier)}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50">
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, item: supplier })}
            className="p-2 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your supplier directory</p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockSuppliers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Suppliers</p>
          <p className="text-2xl font-bold text-success-600 mt-1">
            {mockSuppliers.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Business</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(mockSuppliers.reduce((sum, s) => sum + s.totalValue, 0))}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <SearchInput placeholder="Search suppliers by name, contact, or email..." />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={mockSuppliers}
        emptyMessage="No suppliers found"
        emptyIcon={<Building2 className="h-12 w-12" />}
        onRowClick={(supplier) => setViewSupplier(supplier)}
        hoverable
      />

      {/* Supplier Detail Modal */}
      <Modal
        isOpen={!!viewSupplier}
        onClose={() => setViewSupplier(null)}
        title="Supplier Details"
        size="lg"
      >
        {viewSupplier && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-brand-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-brand-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewSupplier.name}</h3>
                <p className="text-gray-500">{viewSupplier.contactPerson}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{viewSupplier.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{viewSupplier.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 col-span-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium">{viewSupplier.address}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">GST Number</p>
                <p className="font-mono font-medium">{viewSupplier.gstNumber}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="font-medium">{viewSupplier.totalOrders}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" className="flex-1" leftIcon={<Package className="h-4 w-4" />}>
                View Orders
              </Button>
              <Button className="flex-1" leftIcon={<Plus className="h-4 w-4" />}>
                New Order
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={() => {
          setDeleteModal({ isOpen: false, item: null })
        }}
        itemName={deleteModal.item?.name}
      />
    </div>
  )
}
