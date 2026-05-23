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
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { whatsappApi } from '../../api/whatsapp.api'
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
  const [isSavingWa, setIsSavingWa] = useState(false)
  const [waConfig, setWaConfig] = useState({
    isEnabled: store?.whatsappConfig?.isEnabled || false,
    apiKey: store?.whatsappConfig?.apiKey || '',
    phoneNumber: store?.whatsappConfig?.phoneNumber || '',
    dailyReportEnabled: store?.whatsappConfig?.dailyReportEnabled || false,
    thankYouEnabled: store?.whatsappConfig?.thankYouEnabled || false,
    refillReminderEnabled: store?.whatsappConfig?.refillReminderEnabled || false,
    promotionsEnabled: store?.whatsappConfig?.promotionsEnabled || false,
    refillBufferDays: store?.whatsappConfig?.refillBufferDays || 2,
  })

  const [campaign, setCampaign] = useState({ cohort: 'ALL', messageText: '' })
  const [isSendingCampaign, setIsSendingCampaign] = useState(false)
  const [isTestingDaily, setIsTestingDaily] = useState(false)
  const [isTestingRefill, setIsTestingRefill] = useState(false)
  const [logs, setLogs] = useState([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true)
      const res = await whatsappApi.getLogs({ limit: 10 })
      setLogs(res.data || [])
    } catch (err) {
      console.error('Error fetching WhatsApp logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (store?.whatsappConfig) {
      setWaConfig({
        isEnabled: store.whatsappConfig.isEnabled || false,
        apiKey: store.whatsappConfig.apiKey || '',
        phoneNumber: store.whatsappConfig.phoneNumber || '',
        dailyReportEnabled: store.whatsappConfig.dailyReportEnabled || false,
        thankYouEnabled: store.whatsappConfig.thankYouEnabled || false,
        refillReminderEnabled: store.whatsappConfig.refillReminderEnabled || false,
        promotionsEnabled: store.whatsappConfig.promotionsEnabled || false,
        refillBufferDays: store.whatsappConfig.refillBufferDays || 2,
      })
    }
  }, [store])

  useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchLogs()
    }
  }, [activeTab])

  const handleSaveWaConfig = async () => {
    try {
      setIsSavingWa(true)
      await updateStore({
        whatsappConfig: waConfig
      })
      toast.success('WhatsApp configuration updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update WhatsApp settings')
    } finally {
      setIsSavingWa(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!campaign.messageText.trim()) {
      toast.error('Campaign message text cannot be empty')
      return
    }
    try {
      setIsSendingCampaign(true)
      const res = await whatsappApi.sendPromotionCampaign(campaign)
      toast.success(res.message || 'Campaign sent successfully')
      setCampaign({ ...campaign, messageText: '' })
      fetchLogs()
    } catch (err) {
      toast.error(err.message || 'Failed to send campaign')
    } finally {
      setIsSendingCampaign(false)
    }
  }

  const handleTestDailyReport = async () => {
    try {
      setIsTestingDaily(true)
      await whatsappApi.sendTestDailyReport()
      toast.success('Test daily report simulated successfully')
      fetchLogs()
    } catch (err) {
      toast.error(err.message || 'Test daily report failed')
    } finally {
      setIsTestingDaily(false)
    }
  }

  const handleTestRefill = async () => {
    try {
      setIsTestingRefill(true)
      const res = await whatsappApi.sendTestRefillReminders()
      toast.success(res.message || 'Test refill reminders check completed')
      fetchLogs()
    } catch (err) {
      toast.error(err.message || 'Test refill reminders failed')
    } finally {
      setIsTestingRefill(false)
    }
  }
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
    { id: 'whatsapp', label: 'WhatsApp Alerts', icon: MessageSquare },
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
          {/* Logo Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Logo</h3>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center relative group">
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

      {/* WhatsApp Alerts Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          {/* Main Config */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">WhatsApp Integration</h3>
                <p className="text-sm text-gray-500 mt-1">Configure your WhatsApp Gateway to send reports, receipts, and refills.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={waConfig.isEnabled}
                  onChange={(e) => setWaConfig({ ...waConfig, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="WhatsApp Gateway API Key"
                type="password"
                placeholder="Enter API key"
                value={waConfig.apiKey}
                onChange={(e) => setWaConfig({ ...waConfig, apiKey: e.target.value })}
                disabled={!waConfig.isEnabled}
                description="Leave empty to run in Simulated Mode (logs messages without sending)"
              />
              <Input
                label="Owner WhatsApp Number"
                type="tel"
                placeholder="9876543210"
                value={waConfig.phoneNumber}
                onChange={(e) => setWaConfig({ ...waConfig, phoneNumber: e.target.value })}
                disabled={!waConfig.isEnabled}
                description="Receives the Daily Dashboard Reports"
              />
            </div>
          </div>

          {/* Trigger Alerts Toggles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Automated WhatsApp Triggers</h3>
            <div className="space-y-4">
              {/* Daily Report Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Daily Store Report (Owner)</p>
                  <p className="text-sm text-gray-500">Sends daily revenue, profit, and stock alert summary to owner at 9:00 PM.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.dailyReportEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, dailyReportEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!waConfig.isEnabled}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Thank You Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Customer Purchase Receipt</p>
                  <p className="text-sm text-gray-500">Sends digital receipt & thank-you message to customer immediately after purchase.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.thankYouEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, thankYouEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!waConfig.isEnabled}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Refill Reminder Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Personalized Medicine Refill Reminders</p>
                  <p className="text-sm text-gray-500">Estimates usage from dosage, reminding customers before their supply runs out.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.refillReminderEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, refillReminderEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!waConfig.isEnabled}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Refill Buffer Days */}
              {waConfig.refillReminderEnabled && (
                <div className="pt-2">
                  <Input
                    label="Reminder Buffer Days"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="2"
                    value={waConfig.refillBufferDays}
                    onChange={(e) => setWaConfig({ ...waConfig, refillBufferDays: parseInt(e.target.value) || 2 })}
                    disabled={!waConfig.isEnabled}
                    description="Days before estimated medicine depletion to dispatch the notification"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveWaConfig}
                isLoading={isSavingWa}
                disabled={!waConfig.isEnabled && !store?.whatsappConfig?.isEnabled}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save WhatsApp Settings
              </Button>
            </div>
          </div>

          {/* Test Operations & Campaigns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Run Tests Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Simulate / Trigger Alerts</h3>
                <p className="text-sm text-gray-500 mb-6">Manually dispatch reports or check refills immediately (useful for testing & validation).</p>
              </div>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-700 border-gray-300 hover:bg-gray-50"
                  leftIcon={<Play className="h-4 w-4 text-brand-600" />}
                  onClick={handleTestDailyReport}
                  isLoading={isTestingDaily}
                  disabled={!waConfig.isEnabled}
                >
                  Trigger Daily Performance Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-700 border-gray-300 hover:bg-gray-50"
                  leftIcon={<Play className="h-4 w-4 text-brand-600" />}
                  onClick={handleTestRefill}
                  isLoading={isTestingRefill}
                  disabled={!waConfig.isEnabled}
                >
                  Run Customer Refill Reminders Check
                </Button>
              </div>
            </div>

            {/* Campaign Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Marketing / Promo Campaign</h3>
              <p className="text-sm text-gray-500 mb-4">Send a general offer, alert or greeting to specific customer lists.</p>
              <div className="space-y-4">
                <Select
                  label="Target Cohort"
                  options={[
                    { value: 'ALL', label: 'All Registered Customers' },
                    { value: 'VIP', label: 'VIP Customers' },
                    { value: 'REPEAT', label: 'Repeat Buyers' },
                  ]}
                  value={campaign.cohort}
                  onChange={(e) => setCampaign({ ...campaign, cohort: e.target.value })}
                  disabled={!waConfig.isEnabled}
                />
                <Textarea
                  label="Promo Message"
                  placeholder="e.g. Special offer: Get 10% off on all wellness supplements this weekend! Visit us at..."
                  rows={2}
                  value={campaign.messageText}
                  onChange={(e) => setCampaign({ ...campaign, messageText: e.target.value })}
                  disabled={!waConfig.isEnabled}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendCampaign}
                    isLoading={isSendingCampaign}
                    disabled={!waConfig.isEnabled || !campaign.messageText.trim()}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Broadcast Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Audit Logs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">WhatsApp Delivery History</h3>
                <p className="text-sm text-gray-500 mt-1">Audit log of all sent, failed, or simulated WhatsApp messages.</p>
              </div>
              <button
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingLogs && "animate-spin")} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {isLoadingLogs && logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3 text-gray-400" />
                  <p>Retrieving dispatch logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No WhatsApp communications found</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Message Body</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">{log.recipientName}</p>
                          <p className="text-xs text-gray-500">{log.recipientPhone}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {log.messageType?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate" title={log.content}>
                          {log.content}
                        </td>
                        <td className="p-4">
                          {log.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-700 bg-success-50 px-2 py-1 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Sent
                            </span>
                          ) : log.status === 'SIMULATED' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-full">
                              <AlertCircle className="h-3 w-3" /> Simulated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-700 bg-danger-50 px-2 py-1 rounded-full" title={log.errorMessage}>
                              <XCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {new Date(log.sentAt || log.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-150 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Subscription Status</h3>
              <p className="text-sm text-gray-500 mt-1">Manage store billing preferences and plans.</p>
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
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
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
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                      >
                        Downgrade to Free
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50/30 rounded-xl p-5 border border-amber-100">
                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-600" /> Included Premium Benefits
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
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
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300">
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

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning-500" /> Active Free Limitations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
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
