/**
 * pages/settings/StoreSettings.jsx
 * 
 * RESPONSIBILITY:
 * - Store profile settings
 * - Business information
 * - Preferences
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Save,
  Upload,
  Globe,
  Clock,
  IndianRupee,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useStore } from '@context/StoreContext'
import { useToast } from '@context/UIContext'
import Button from '@components/common/Button'
import { Input, Textarea, Select } from '@components/common/Input'

/**
 * Store Settings Page (Owner Only)
 */
export default function StoreSettings() {
  const { store, updateStore, isUpdatingStore } = useStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      name: store?.name || '',
      phone: store?.phone || '',
      email: store?.email || '',
      address: store?.address || '',
      drugLicenseNumber: store?.drugLicenseNumber || '',
      gstNumber: store?.gstNumber || '',
      website: store?.website || '',
    },
  })

  const onSubmit = async (data) => {
    try {
      await updateStore(data)
      toast.success('Store settings updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update settings')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Store Profile', icon: Building2 },
    { id: 'preferences', label: 'Preferences', icon: Clock },
    { id: 'billing', label: 'Billing', icon: IndianRupee },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-500 mt-1">Manage your store profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
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
          {/* Logo Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Logo</h3>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-xl bg-brand-100 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-brand-600" />
              </div>
              <div>
                <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 2MB. Recommended: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Name"
                placeholder="Your Medical Store"
                leftIcon={<Building2 className="h-5 w-5" />}
                error={errors.name?.message}
                {...register('name', { required: 'Store name is required' })}
              />
              <Input
                label="Website"
                placeholder="www.yourstore.com"
                leftIcon={<Globe className="h-5 w-5" />}
                {...register('website')}
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
                placeholder="store@example.com"
                leftIcon={<Mail className="h-5 w-5" />}
                {...register('email')}
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
            <Textarea
              label="Full Address"
              placeholder="Shop No, Street, Area, City, State, PIN"
              rows={3}
              {...register('address')}
            />
          </div>

          {/* Legal Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Drug License Number"
                placeholder="DL-XX-XXXX"
                leftIcon={<FileText className="h-5 w-5" />}
                {...register('drugLicenseNumber')}
              />
              <Input
                label="GST Number"
                placeholder="22AAAAA0000A1Z5"
                leftIcon={<FileText className="h-5 w-5" />}
                {...register('gstNumber')}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isUpdatingStore}
              disabled={!isDirty}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Currency"
                options={[
                  { value: 'INR', label: 'Indian Rupee (₹)' },
                  { value: 'USD', label: 'US Dollar ($)' },
                ]}
                defaultValue="INR"
              />
              <Select
                label="Timezone"
                options={[
                  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
                  { value: 'UTC', label: 'UTC' },
                ]}
                defaultValue="Asia/Kolkata"
              />
              <Select
                label="Date Format"
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                ]}
                defaultValue="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-4">
              {[
                { id: 'lowStock', label: 'Low stock alerts', description: 'Get notified when stock falls below threshold' },
                { id: 'expiry', label: 'Expiry alerts', description: 'Get notified about expiring medicines' },
                { id: 'orders', label: 'Order updates', description: 'Get notified about purchase order status' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white">
              <div>
                <p className="text-brand-100">Current Plan</p>
                <p className="text-2xl font-bold">Professional</p>
                <p className="text-sm text-brand-200 mt-1">Unlimited medicines, 5 staff accounts</p>
              </div>
              <Button variant="secondary" className="bg-white text-brand-600 hover:bg-brand-50">
                Upgrade
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No billing history available</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
