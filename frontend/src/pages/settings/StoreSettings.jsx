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
  AlertTriangle,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RefreshCw,
  Edit3
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { whatsappApi } from '../../api/whatsapp.api'
import { useStore } from '@context/StoreContext'
import { useToast } from '@context/UIContext'
import { useAuth } from '@context/AuthContext'
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
  } = useStore()
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingWa, setIsSavingWa] = useState(false)
  const [waStatus, setWaStatus] = useState({
    connected: false,
    businessName: '',
    businessPhone: '',
    connectedAt: null,
    connectionStatus: 'DISCONNECTED',
  })
  const [qrCodeData, setQrCodeData] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  const [waConfig, setWaConfig] = useState({
    isEnabled: false,
    dailyReportEnabled: false,
    thankYouEnabled: false,
    refillReminderEnabled: false,
    promotionsEnabled: false,
    lowStockEnabled: false,
    expiryEnabled: false,
    refillBufferDays: 2,
  })

  const [campaign, setCampaign] = useState({ cohort: 'ALL', messageText: '' })
  const [isSendingCampaign, setIsSendingCampaign] = useState(false)
  const [isTestingDaily, setIsTestingDaily] = useState(false)
  const [isTestingRefill, setIsTestingRefill] = useState(false)
  const [logs, setLogs] = useState([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isLoadingWaStatus, setIsLoadingWaStatus] = useState(true)

  const isOwner = user?.role === 'OWNER'

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true)
      const res = await whatsappApi.getLogs({ limit: 10 })
      const logsArray = res?.data !== undefined ? res.data : (Array.isArray(res) ? res : [])
      setLogs(logsArray)
    } catch (err) {
      console.error('Error fetching WhatsApp logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Load WhatsApp status ONCE on component mount (not tab-dependent)
  // This prevents the false "Disconnected" flash when returning to Settings page
  useEffect(() => {
    const loadWaStatus = async () => {
      if (user?.role === 'STAFF') {
        setIsLoadingWaStatus(false)
        return
      }
      try {
        setIsLoadingWaStatus(true)
        const res = await whatsappApi.getStatus()
        if (res) {
          const data = res.data !== undefined ? res.data : res
          setWaStatus({
            connected: !!data.connected,
            businessName: data.businessName || '',
            businessPhone: data.businessPhone || '',
            connectedAt: data.connectedAt || null,
            connectionStatus: data.connectionStatus || (data.connected ? 'CONNECTED' : 'DISCONNECTED'),
          })
          setWaConfig({
            isEnabled: !!data.connected,
            dailyReportEnabled: data.dailyReportEnabled || false,
            thankYouEnabled: data.thankYouEnabled || false,
            refillReminderEnabled: data.refillReminderEnabled || false,
            promotionsEnabled: data.promotionsEnabled || false,
            lowStockEnabled: data.lowStockEnabled || false,
            expiryEnabled: data.expiryEnabled || false,
            refillBufferDays: data.refillBufferDays || 2,
          })
        }
      } catch (err) {
        console.error("Failed to load WhatsApp status:", err)
      } finally {
        setIsLoadingWaStatus(false)
      }
    }
    loadWaStatus()
  }, [user?.role]) // run once on mount or when user role updates

  // SSE + logs: only open the SSE stream when on the WhatsApp tab
  useEffect(() => {
    let eventSource = null

    if (activeTab === 'whatsapp') {
      fetchLogs()

      // SSE connection
      const token = localStorage.getItem('token')
      const baseApiUrl = import.meta.env.VITE_API_URL || '/api/v1'
      const sseUrl = `${baseApiUrl}/whatsapp/status-sse?token=${token}`

      eventSource = new EventSource(sseUrl)

      eventSource.addEventListener('status', (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("[SSE status update]:", data)
          
          setWaStatus(prev => ({
            ...prev,
            connected: data.state === 'Connected',
            connectionStatus: data.state.toUpperCase(),
            businessPhone: data.phone || prev.businessPhone,
            businessName: data.name || prev.businessName,
            connectedAt: data.connectedAt || prev.connectedAt,
          }))

          setWaConfig(prev => ({
            ...prev,
            isEnabled: data.state === 'Connected'
          }))

          if (data.state === 'Connected') {
            setShowQrModal(false)
            setQrCodeData(null)
            setIsConnecting(false)
            toast.success("WhatsApp Business Account connected successfully!")
            fetchLogs()
          } else if (data.state === 'Disconnected') {
            setIsConnecting(false)
          }
        } catch (err) {
          console.error("Error parsing SSE status event:", err)
        }
      })

      eventSource.addEventListener('qr', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.qr) {
            setQrCodeData(data.qr)
            setIsConnecting(false)
          }
        } catch (err) {
          console.error("Error parsing SSE qr event:", err)
        }
      })

      eventSource.onerror = (err) => {
        console.error("SSE EventSource encountered an error:", err)
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [activeTab])

  const handleConnect = async () => {
    // If already connected, don't reinitiate — would wipe session and cause 440 loop
    if (waStatus.connected) {
      toast.info('WhatsApp is already connected!')
      return
    }
    try {
      setIsConnecting(true)
      setQrCodeData(null)
      setShowQrModal(true)
      
      await whatsappApi.connectStore()
      
      const qrRes = await whatsappApi.getQR()
      if (qrRes && qrRes.qr) {
        setQrCodeData(qrRes.qr)
        setIsConnecting(false)
      }
    } catch (err) {
      toast.error(err.message || "Failed to initialize WhatsApp connection.")
      setIsConnecting(false)
      setShowQrModal(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your WhatsApp Business account? This will stop all automated alerts.")) {
      return
    }
    try {
      await whatsappApi.disconnectStore()
      toast.success("WhatsApp disconnected successfully.")
      setWaStatus({
        connected: false,
        businessName: '',
        businessPhone: '',
        connectedAt: null,
        connectionStatus: 'DISCONNECTED',
      })
      setWaConfig(prev => ({
        ...prev,
        isEnabled: false
      }))
    } catch (err) {
      toast.error(err.message || "Failed to disconnect WhatsApp.")
    }
  }

  const handleReconnect = async () => {
    try {
      setIsConnecting(true)
      setQrCodeData(null)
      setShowQrModal(true)
      await whatsappApi.reconnectStore()
    } catch (err) {
      toast.error(err.message || "Failed to reconnect WhatsApp.")
      setIsConnecting(false)
    }
  }

  const handleSaveWaConfig = async () => {
    try {
      setIsSavingWa(true)
      await whatsappApi.updateSettings({
        dailyReportEnabled: waConfig.dailyReportEnabled,
        thankYouEnabled: waConfig.thankYouEnabled,
        refillReminderEnabled: waConfig.refillReminderEnabled,
        promotionsEnabled: waConfig.promotionsEnabled,
        lowStockEnabled: waConfig.lowStockEnabled,
        expiryEnabled: waConfig.expiryEnabled,
        refillBufferDays: waConfig.refillBufferDays,
      })
      toast.success('WhatsApp alert preferences saved successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update WhatsApp preferences')
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

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
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

  // Synchronize dynamic store settings values when fetched
  useEffect(() => {
    if (store) {
      reset({
        name: store.name || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        drugLicenseNumber: store.drugLicenseNumber || '',
        gstNumber: store.gstNumber || '',
        website: store.website || '',
      })
      if (store.logo) {
        setLogoBase64(store.logo)
      }
    }
  }, [store, reset])

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
      reset(data)
      setIsEditing(false)
      toast.success('Store settings updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update settings')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Store Profile', icon: Building2 },
    { id: 'preferences', label: 'Preferences', icon: Clock },
    ...(user?.role !== 'STAFF' ? [{ id: 'whatsapp', label: 'WhatsApp Alerts', icon: MessageSquare }] : []),
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
          {/* Logo Upload */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Store Logo</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
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
              <div className="text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                  disabled={!isEditing}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isEditing}
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
                      disabled={!isEditing}
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
                disabled={!isEditing}
                {...register('name', { required: 'Store name is required' })}
              />
              <Input
                label="Website"
                placeholder="www.yourstore.com"
                leftIcon={<Globe className="h-5 w-5" />}
                disabled={!isEditing}
                {...register('website')}
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
                placeholder="store@example.com"
                leftIcon={<Mail className="h-5 w-5" />}
                disabled={!isEditing}
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
              disabled={!isEditing}
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
                disabled={!isEditing}
                {...register('drugLicenseNumber')}
              />
              <Input
                label="GST Number"
                placeholder="22AAAAA0000A1Z5"
                leftIcon={<FileText className="h-5 w-5" />}
                disabled={!isEditing}
                {...register('gstNumber')}
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
                    if (store?.logo) {
                      setLogoBase64(store.logo)
                    } else {
                      setLogoBase64('')
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isUpdatingStore}
                  disabled={!hasChanges}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
              </>
            )}
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

      {/* WhatsApp Alerts Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          {/* Status Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-xl">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">WhatsApp Business Integration</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect your pharmacy's own WhatsApp Business number for automated alerts.</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {isLoadingWaStatus ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse" /> Checking...
                      </span>
                    ) : waStatus.connected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-700 bg-success-50 dark:bg-success-950/30 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" /> Connected
                      </span>
                    ) : waStatus.connectionStatus === 'CONNECTING' || waStatus.connectionStatus === 'QR_GENERATED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning-700 bg-warning-50 dark:bg-warning-950/30 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse" /> Connecting
                      </span>
                    ) : waStatus.connectionStatus === 'CONNECTION_LOST' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning-700 bg-warning-50 dark:bg-warning-950/30 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse" /> Connection Lost
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-700 bg-danger-50 dark:bg-danger-950/30 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-danger-500" /> Disconnected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isLoadingWaStatus ? (
                  <Button disabled className="bg-gray-100 dark:bg-gray-800 text-gray-400 font-medium shadow-sm cursor-not-allowed opacity-60">
                    Checking status...
                  </Button>
                ) : !waStatus.connected ? (
                  <Button
                    onClick={handleConnect}
                    disabled={!isOwner || isConnecting}
                    isLoading={isConnecting}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm"
                  >
                    Connect WhatsApp
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleReconnect}
                      disabled={!isOwner || isConnecting}
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                      Reconnect
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDisconnect}
                      disabled={!isOwner}
                      className="bg-danger-600 hover:bg-danger-700 text-white font-medium shadow-sm"
                    >
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </div>

            {waStatus.connected && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-sm">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Connected Account</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{waStatus.businessName || 'WhatsApp Business'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">WhatsApp Number</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-1">+{waStatus.businessPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Connected Since</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                    {waStatus.connectedAt ? new Date(waStatus.connectedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            )}
            
            {!isOwner && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs rounded-lg border border-amber-100 dark:border-amber-900/40 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Only the store owner can modify the WhatsApp connection credentials.
              </div>
            )}
          </div>

          {/* Trigger Alerts Toggles */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Automated WhatsApp Triggers</h3>
            <div className="space-y-4">
              {/* Daily Report Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Daily Store Report (Owner)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sends daily revenue, profit, and stock alert summary to owner at 9:00 PM.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.dailyReportEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, dailyReportEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!isOwner || !waStatus.connected}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Thank You Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Customer Purchase Receipt</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sends digital receipt & thank-you message to customer immediately after purchase.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.thankYouEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, thankYouEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!isOwner || !waStatus.connected}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Refill Reminder Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Personalized Medicine Refill Reminders</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimates usage from dosage, reminding customers before their supply runs out.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.refillReminderEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, refillReminderEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!isOwner || !waStatus.connected}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Low Stock Alerts Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Low Stock Alerts (Owner)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sends alerts when critical medicine stock falls below safety levels.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.lowStockEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, lowStockEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!isOwner || !waStatus.connected}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-950 after:border-gray-300 dark:border-gray-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Expiry Alerts Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Medicine Expiry Alerts (Owner)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sends notifications before medicine batches hit their expiration date.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.expiryEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, expiryEnabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={!isOwner || !waStatus.connected}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-950 after:border-gray-300 dark:border-gray-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
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
                    disabled={!isOwner || !waStatus.connected}
                    description="Days before estimated medicine depletion to dispatch the notification"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveWaConfig}
                isLoading={isSavingWa}
                disabled={!isOwner || !waStatus.connected}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Settings
              </Button>
            </div>
          </div>

          {/* Test Operations & Campaigns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Run Tests Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Simulate / Trigger Alerts</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manually dispatch reports or check refills immediately (useful for testing & validation).</p>
              </div>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  leftIcon={<Play className="h-4 w-4 text-brand-600" />}
                  onClick={handleTestDailyReport}
                  isLoading={isTestingDaily}
                  disabled={!waStatus.connected}
                >
                  Trigger Daily Performance Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  leftIcon={<Play className="h-4 w-4 text-brand-600" />}
                  onClick={handleTestRefill}
                  isLoading={isTestingRefill}
                  disabled={!waStatus.connected}
                >
                  Run Customer Refill Reminders Check
                </Button>
              </div>
            </div>

            {/* Campaign Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">WhatsApp Marketing / Promo Campaign</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Send a general offer, alert or greeting to specific customer lists.</p>
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
                  disabled={!waStatus.connected}
                />
                <Textarea
                  label="Promo Message"
                  placeholder="e.g. Special offer: Get 10% off on all wellness supplements this weekend! Visit us at..."
                  rows={2}
                  value={campaign.messageText}
                  onChange={(e) => setCampaign({ ...campaign, messageText: e.target.value })}
                  disabled={!waStatus.connected}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendCampaign}
                    isLoading={isSendingCampaign}
                    disabled={!waStatus.connected || !campaign.messageText.trim()}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Broadcast Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Audit Logs */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">WhatsApp Delivery History</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Audit log of all sent, failed, or simulated WhatsApp messages.</p>
              </div>
              <button
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingLogs && "animate-spin")} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {isLoadingLogs && logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3 text-gray-400" />
                  <p>Retrieving dispatch logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No WhatsApp communications found</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-950/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Message Body</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700 dark:text-gray-300">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 dark:bg-gray-950/50 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{log.recipientName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{log.recipientPhone}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
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
                        <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
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



      {/* QR Code Connection Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Scan QR Code</h3>
              <button
                onClick={() => {
                  setShowQrModal(false)
                  setIsConnecting(false)
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-sans">
                Open WhatsApp on your phone, go to Settings &gt; Linked Devices, and scan this QR code to link your store account.
              </p>
              
              <div className="relative w-64 h-64 bg-gray-50 dark:bg-gray-950 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-850 flex items-center justify-center overflow-hidden shadow-inner">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="WhatsApp QR Code" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
                    <p className="text-xs font-semibold">Generating QR Code...</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/20 px-3 py-1.5 rounded-full font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse" />
                Waiting for scan...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
