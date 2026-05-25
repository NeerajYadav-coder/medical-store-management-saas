/**
 * pages/settings/StoreSettings.jsx
 * 
 * RESPONSIBILITY:
 * - Store profile settings
 * - Business information
 * - Preferences
 */

import { useState, useRef, useEffect } from 'react'
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
  Crown,
  Check,
  AlertTriangle,
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
  const { 
    store, 
    updateStore, 
    isUpdatingStore,
    upgradeStore,
    isUpgradingStore,
    downgradeStore,
    isDowngradingStore
  } = useStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const fileInputRef = useRef(null)
  const [logoBase64, setLogoBase64] = useState(store?.logo || '')

  // Reset logo state if store changes
  useEffect(() => {
    if (store?.logo) {
      setLogoBase64(store.logo)
    }
  }, [store])

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

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoBase64(reader.result)
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoBase64('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasChanges = isDirty || logoBase64 !== (store?.logo || '')

  const onSubmit = async (data) => {
    try {
      await updateStore({
        ...data,
        logo: logoBase64
      })
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your store profile and preferences</p>
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
                  'flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors',
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
          {/* Logo Upload */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Store Logo</h3>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 overflow-hidden flex items-center justify-center relative group">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Store Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Logo
                  </Button>
                  {logoBase64 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                      onClick={handleRemoveLogo}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PNG, JPG up to 2MB. Recommended: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h3>
            <Textarea
              label="Full Address"
              placeholder="Shop No, Street, Area, City, State, PIN"
              rows={3}
              {...register('address')}
            />
          </div>

          {/* Legal Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legal Information</h3>
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
              disabled={!hasChanges}
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional Settings</h3>
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

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
            <div className="space-y-4">
              {[
                { id: 'lowStock', label: 'Low stock alerts', description: 'Get notified when stock falls below threshold' },
                { id: 'expiry', label: 'Expiry alerts', description: 'Get notified about expiring medicines' },
                { id: 'orders', label: 'Order updates', description: 'Get notified about purchase order status' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{setting.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-150 bg-gray-50 dark:bg-gray-950/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage store billing preferences and plans.</p>
            </div>

            <div className="p-6 space-y-6">
              {store?.plan === 'PREMIUM' ? (
                // Premium Plan active UI
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-600 to-amber-700 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
                      <Crown className="h-64 w-64" />
                    </div>
                    <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                        <Crown className="h-3.5 w-3.5" />
                        Premium Active
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight">₹2,999<span className="text-sm font-normal text-amber-100">/year</span></p>
                      <p className="text-sm text-amber-100 font-medium">Enjoying unlimited features and data insights.</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0 relative z-10">
                      <Button 
                        variant="danger" 
                        isLoading={isDowngradingStore}
                        onClick={async () => {
                          try {
                            await downgradeStore()
                            toast.success('Successfully downgraded store to FREE plan.')
                          } catch (err) {
                            toast.error('Failed to downgrade store plan.')
                          }
                        }}
                        className="bg-white dark:bg-gray-900/10 hover:bg-white dark:bg-gray-900/20 text-white border border-white/20 backdrop-blur-md"
                      >
                        Downgrade to Free
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50/30 rounded-xl p-5 border border-amber-100">
                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-600" /> Included Premium Benefits
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                      {[
                        'Unlimited medicines catalog',
                        'Unlimited staff accounts & roles',
                        'Interactive sales & profit reports',
                        'Full compliance audit logs trail',
                        'Priority customer assistance',
                        'Automated stock alerts'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Free Plan UI
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gray-900 text-white shadow-md relative overflow-hidden">
                    <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900/10 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300">
                        Free Tier
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight">₹0<span className="text-sm font-normal text-gray-400">/forever</span></p>
                      <p className="text-sm text-gray-300 font-medium">Standard operations with basic capacities.</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0 relative z-10">
                      <Button 
                        isLoading={isUpgradingStore}
                        onClick={async () => {
                          try {
                            await upgradeStore()
                            toast.success('Congratulations! Upgraded to Premium Plan successfully.')
                          } catch (err) {
                            toast.error('Failed to upgrade store plan.')
                          }
                        }}
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                      >
                        Upgrade to Premium (₹2,999/yr)
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning-500" /> Active Free Limitations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                      {[
                        'Max 100 medicine listings cap',
                        'Max 2 staff members limitation',
                        'Interactive reports locked',
                        'Compliance audit logs locked'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing History</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No billing history available</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
