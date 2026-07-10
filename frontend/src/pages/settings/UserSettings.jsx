/**
 * pages/settings/UserSettings.jsx
 * 
 * RESPONSIBILITY:
 * - User profile settings
 * - Password change
 * - Account preferences
 */

import { useState, useEffect } from 'react'
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
  Edit3,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/UIContext'
import { authApi } from '@api/auth.api'
import Button from '@components/common/Button'
import { Input, PasswordInput, Select } from '@components/common/Input'
import { Modal } from '@components/common/Modal'
import { getImageUrl } from '@/utils/image'

/**
 * User Settings Page
 */
export default function UserSettings() {
  const { user, logout, refetchUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [profilePhotoStr, setProfilePhotoStr] = useState(null)
  const [profilePhotoFile, setProfilePhotoFile] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' })
  const [isChangingPass, setIsChangingPass] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  // Synchronize dynamic user settings values when context user changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
      if (user.profilePhoto) {
        setProfilePhotoStr(user.profilePhoto)
      } else {
        setProfilePhotoStr(null)
      }
      setProfilePhotoFile(null)
      setRemovePhoto(false)
    }
  }, [user, reset])

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return
      }
      setProfilePhotoFile(file)
      setRemovePhoto(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhotoStr(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data) => {
    setIsUpdating(true)
    try {
      // Use FormData to support multipart/form-data for the file upload
      const formData = new FormData()
      if (data.name !== user?.name) formData.append('name', data.name)
      if (data.phone !== user?.phone) formData.append('phone', data.phone)
      if (data.email !== user?.email) formData.append('email', data.email)
      
      if (profilePhotoFile) {
        formData.append('profilePhoto', profilePhotoFile)
      } else if (removePhoto) {
        formData.append('removePhoto', 'true')
      }

      await authApi.updateProfile(formData)
      await refetchUser()
      toast.success('Profile updated successfully')
      reset(data)
      setIsEditing(false)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passForm.new !== passForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    setIsChangingPass(true)
    try {
      await authApi.changePassword(passForm.current, passForm.new)
      toast.success('Password changed successfully')
      setShowPasswordModal(false)
      setPassForm({ current: '', new: '', confirm: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsChangingPass(false)
    }
  }

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to sign out from all other devices?')) return
    try {
      await authApi.logoutAll()
      toast.success('Signed out from all other devices successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign out other devices')
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profilePhotoStr ? (
                  <img src={getImageUrl(profilePhotoStr)} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-sm" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-brand-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <label className={cn(
                  "absolute bottom-0 right-0 h-8 w-8 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                  !isEditing && "opacity-50 cursor-not-allowed pointer-events-none"
                )}>
                  <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={!isEditing} />
                </label>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                
                {isEditing && profilePhotoStr && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setProfilePhotoStr(null)
                      setProfilePhotoFile(null)
                      setRemovePhoto(true)
                    }}
                    className="mt-3 text-sm font-medium text-danger-600 hover:text-danger-700 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Your name"
                leftIcon={<User className="h-5 w-5" />}
                error={errors.name?.message}
                disabled={!isEditing}
                {...register('name', { required: 'Name is required' })}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                leftIcon={<Phone className="h-5 w-5" />}
                disabled={!isEditing}
                {...register('phone')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-5 w-5" />}
                disabled={!isEditing}
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {!isEditing ? (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit3 className="h-4 w-4" />}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isUpdating}
                  disabled={!isDirty && !profilePhotoFile && !removePhoto}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Password</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Change your password</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Add extra security to your account</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Not enabled</p>
              </div>
              <Button variant="outline" leftIcon={<Shield className="h-4 w-4" />} onClick={() => toast.info('2FA integration coming soon!')}>
                Enable 2FA
              </Button>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    🖥️
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Current Device</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Windows • Chrome • Hyderabad</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogoutAll}
              className="w-full mt-4 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { id: 'salesSummary', label: 'Daily sales summary', description: 'Receive daily sales report via email' },
                { id: 'stockAlerts', label: 'Stock alerts', description: 'Get notified about low stock and expiry' },
                { id: 'orderUpdates', label: 'Order updates', description: 'Updates on purchase orders' },
                { id: 'marketing', label: 'Product updates', description: 'News and feature announcements' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{setting.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Push Notifications</h3>
            <div className="space-y-4">
              {[
                { id: 'newSale', label: 'New sale', description: 'Get notified for each new sale' },
                { id: 'lowStock', label: 'Low stock warning', description: 'When inventory falls below threshold' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{setting.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
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
            <Button onClick={handlePasswordChange} isLoading={isChangingPass}>Update Password</Button>
          </>
        }
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <PasswordInput
            label="Current Password"
            placeholder="Enter current password"
            value={passForm.current}
            onChange={(e) => setPassForm(p => ({ ...p, current: e.target.value }))}
            required
          />
          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            value={passForm.new}
            onChange={(e) => setPassForm(p => ({ ...p, new: e.target.value }))}
            required
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={passForm.confirm}
            onChange={(e) => setPassForm(p => ({ ...p, confirm: e.target.value }))}
            required
          />
        </form>
      </Modal>
    </div>
  )
}
