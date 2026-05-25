/**
 * pages/dashboard/Staff.jsx
 * 
 * RESPONSIBILITY:
 * - Staff management (Owner only)
 * - User roles and permissions
 * - Activity tracking
 */

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Key,
  Edit,
  CheckCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/utils/cn'
import { formatDate, formatRelativeTime } from '@utils/formatDate'
import { useAuth } from '@context/AuthContext'
import { authApi } from '@api/auth.api'
import { useStore } from '@context/StoreContext'
import PremiumModal from '@components/common/PremiumModal'
import Button from '@components/common/Button'
import { Input, SearchInput, Select, PasswordInput } from '@components/common/Input'
import { Table } from '@components/common/Table'
import { Modal, DeleteModal } from '@components/common/Modal'
import { toast } from 'react-hot-toast'

// Role configurations
const ROLES = [
  { value: 'STAFF', label: 'Staff', description: 'Basic access to sales and inventory' },
  { value: 'MANAGER', label: 'Manager', description: 'Full access except settings' }, // Backend currently treats both as 'STAFF' usually, but let's send 'MANAGER' if backend schema allows or map it
]

/**
 * Staff Management Page (Owner Only)
 */
export default function Staff() {
  const { user: currentUser } = useAuth()
  const { store } = useStore()
  const queryClient = useQueryClient()
  
  // State
  const [showAddModal, setShowAddModal] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null })
  const [resetPasswordModal, setResetPasswordModal] = useState({ isOpen: false, user: null })
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    password: ''
  })

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    isActive: true,
    password: ''
  })

  useEffect(() => {
    if (editUser) {
      setEditFormData({
        name: editUser.name || '',
        email: editUser.email || '',
        phone: editUser.phone || '',
        role: editUser.role || 'STAFF',
        isActive: editUser.isActive !== false,
        password: ''
      })
    }
  }, [editUser])

  // Fetch Staff
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: authApi.getStaff,
  })

  // Create Staff Mutation
  const createMutation = useMutation({
    mutationFn: authApi.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      setShowAddModal(false)
      setFormData({ name: '', email: '', phone: '', role: 'STAFF', password: '' })
      toast.success('Staff member created successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create staff'
      // Handle conflict specifically to be more helpful
      if (error.response?.status === 409) {
        toast.error('A user with this email or phone number already exists.')
      } else {
        toast.error(message)
      }
    }
  })

  // Update Staff Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => authApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      setEditUser(null)
      toast.success('Staff member updated successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update staff'
      if (error.response?.status === 409) {
        toast.error('A user with this email or phone number already exists.')
      } else {
        toast.error(message)
      }
    }
  })

  // Delete Staff Mutation
  const deleteMutation = useMutation({
    mutationFn: authApi.deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      setDeleteModal({ isOpen: false, item: null })
      toast.success('Staff member deleted successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete staff member'
      toast.error(message)
    }
  })

  const staffList = (Array.isArray(staffData) ? staffData : staffData?.data) || []

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (editUser?._id) {
      updateMutation.mutate({
        id: editUser._id,
        data: {
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          role: editFormData.role,
          isActive: editFormData.isActive,
          password: editFormData.password || undefined
        }
      })
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Staff Member',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold',
            user.role === 'MANAGER' ? 'bg-purple-500' : 'bg-brand-500'
          )}>
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className={cn(
          'px-2.5 py-1 text-xs font-medium rounded-full',
          value === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'
        )}>
          {value}
        </span>
      ),
    },
    {
      key: 'isActive', // Backed uses isActive boolean
      label: 'Status',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            'h-2 w-2 rounded-full',
            value ? 'bg-success-500' : 'bg-gray-300'
          )} />
          <span className={cn(
            'text-sm',
            value ? 'text-success-600' : 'text-gray-500 dark:text-gray-400'
          )}>
            {value ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Last Active',
      render: (value) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{value ? formatRelativeTime(value) : 'Never'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(value)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (_, user) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditUser(user)}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, item: user })}
            className="p-2 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  // Stats calculation
  const totalStaff = staffList.length
  const activeStaff = staffList.filter(s => s.isActive).length
  // const managers = staffList.filter(s => s.role === 'MANAGER').length // If we use MANAGER role

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team members and permissions</p>
        </div>
        <Button
          size="sm"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={() => {
            const isFree = store?.plan !== 'PREMIUM'
            if (isFree && staffList.length >= 2) {
              setIsUpgradeModalOpen(true)
            } else {
              setShowAddModal(true)
            }
          }}
        >
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Staff</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalStaff}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-xl font-bold text-success-600">{activeStaff}</p>
            </div>
          </div>
        </div>
        {/* 
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Managers</p>
              <p className="text-xl font-bold text-purple-600">{managers}</p>
            </div>
          </div>
        </div>
        */}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={staffList}
        isLoading={isLoading}
        emptyMessage="No staff members found. Add your first staff member!"
        emptyIcon={<Users className="h-12 w-12" />}
        hoverable
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Staff"
        size="md"
        footer={null} // Custom footer in form
      >
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={createMutation.isLoading}
            autoComplete="off"
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="staff@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={createMutation.isLoading}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            disabled={createMutation.isLoading}
          />
          <Select
            label="Role"
            options={ROLES}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            disabled={createMutation.isLoading}
          />
          <PasswordInput
            label="Initial Password"
            placeholder="Create password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={createMutation.isLoading}
            autoComplete="new-password"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowAddModal(false)}
              disabled={createMutation.isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={createMutation.isLoading}
            >
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit Staff Member"
        size="md"
        footer={null}
      >
        {editUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
              disabled={updateMutation.isLoading}
              autoComplete="off"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="staff@example.com"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              required
              disabled={updateMutation.isLoading}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              required
              disabled={updateMutation.isLoading}
            />
            <Select
              label="Role"
              options={ROLES}
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              disabled={updateMutation.isLoading}
            />
            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' }
              ]}
              value={editFormData.isActive.toString()}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
              disabled={updateMutation.isLoading}
            />
            <PasswordInput
              label="New Password (optional)"
              placeholder="Leave blank to keep current password"
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              disabled={updateMutation.isLoading}
              autoComplete="new-password"
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setEditUser(null)}
                disabled={updateMutation.isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                isLoading={updateMutation.isLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={() => {
          if (deleteModal.item?._id) {
            deleteMutation.mutate(deleteModal.item._id)
          }
        }}
        isLoading={deleteMutation.isLoading}
        itemName={deleteModal.item?.name}
      />

      <PremiumModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </div>
  )
}
