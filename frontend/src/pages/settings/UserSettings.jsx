/**
 * pages/settings/UserSettings.jsx
 * 
 * RESPONSIBILITY:
 * - User profile settings
 * - Password change
 * - Account preferences
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Save,
  Camera,
  Key,
  LogOut,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/UIContext'
import Button from '@components/common/Button'
import { Input, PasswordInput, Select } from '@components/common/Input'
import { Modal } from '@components/common/Modal'

/**
 * User Settings Page
 */
export default function UserSettings() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  const onSubmit = async (data) => {
    setIsUpdating(true)
    try {
      // await authApi.updateProfile(data)
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-brand-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50"
                >
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.role}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Your name"
                leftIcon={<User className="h-5 w-5" />}
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                leftIcon={<Phone className="h-5 w-5" />}
                {...register('phone')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-5 w-5" />}
                disabled
                hint="Email cannot be changed"
                {...register('email')}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isUpdating}
              disabled={!isDirty}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Change your password</p>
                <p className="text-sm text-gray-500">Last changed 30 days ago</p>
              </div>
              <Button
                variant="outline"
                leftIcon={<Key className="h-4 w-4" />}
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>
          </div>

          {/* Two-Factor */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Add extra security to your account</p>
                <p className="text-sm text-gray-500">Not enabled</p>
              </div>
              <Button variant="outline" leftIcon={<Shield className="h-4 w-4" />}>
                Enable 2FA
              </Button>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    🖥️
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Current Device</p>
                    <p className="text-sm text-gray-500">Windows • Chrome • Hyderabad</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-danger-600 hover:bg-danger-50"
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sign out all other devices
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { id: 'salesSummary', label: 'Daily sales summary', description: 'Receive daily sales report via email' },
                { id: 'stockAlerts', label: 'Stock alerts', description: 'Get notified about low stock and expiry' },
                { id: 'orderUpdates', label: 'Order updates', description: 'Updates on purchase orders' },
                { id: 'marketing', label: 'Product updates', description: 'News and feature announcements' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h3>
            <div className="space-y-4">
              {[
                { id: 'newSale', label: 'New sale', description: 'Get notified for each new sale' },
                { id: 'lowStock', label: 'Low stock warning', description: 'When inventory falls below threshold' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button>Update Password</Button>
          </>
        }
      >
        <form className="space-y-4">
          <PasswordInput
            label="Current Password"
            placeholder="Enter current password"
            required
          />
          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            required
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            required
          />
        </form>
      </Modal>
    </div>
  )
}
