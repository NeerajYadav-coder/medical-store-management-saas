/**
 * context/StoreContext.jsx
 * 
 * RESPONSIBILITY:
 * - Medical store information state
 * - Store settings and preferences
 * - Multi-tenant store context
 * 
 * WHAT BREAKS IF THIS DOESN'T EXIST:
 * - Store info scattered across components
 * - No centralized store settings
 */

import { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@config/axios'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

// Query keys
const STORE_QUERY_KEY = ['store', 'info']

/**
 * Store Provider Component
 */
export function StoreProvider({ children }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()

  // ==================== STORE QUERY ====================
  const {
    data: store,
    isLoading: isLoadingStore,
    refetch: refetchStore,
  } = useQuery({
    queryKey: STORE_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get('/store/me')
      return response?.store || response
    },
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  // ==================== UPDATE STORE MUTATION ====================
  const updateStoreMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/store/me', data)
      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(STORE_QUERY_KEY, data?.store || data)
    },
  })

  // ==================== UPGRADE STORE MUTATION ====================
  const upgradeStoreMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/store/me/upgrade')
      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(STORE_QUERY_KEY, data?.store || data)
    },
  })

  // ==================== DOWNGRADE STORE MUTATION ====================
  const downgradeStoreMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/store/me/downgrade')
      return response
    },
    onSuccess: (data) => {
      queryClient.setQueryData(STORE_QUERY_KEY, data?.store || data)
    },
  })

  // ==================== COMPUTED VALUES ====================
  const canEditStore = user?.role === 'OWNER'

  const value = {
    // Store data
    store,
    isLoadingStore,
    refetchStore,

    // Store info shortcuts
    storeName: store?.name || 'Medical Store',
    storeId: store?._id || user?.medicalStoreId,
    drugLicense: store?.drugLicenseNumber,
    gstNumber: store?.gstNumber,
    storePhone: store?.phone,
    storeEmail: store?.email,
    storeAddress: store?.address,

    // Settings
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',

    // Actions
    updateStore: updateStoreMutation.mutateAsync,
    isUpdatingStore: updateStoreMutation.isPending,
    updateStoreError: updateStoreMutation.error,

    upgradeStore: upgradeStoreMutation.mutateAsync,
    isUpgradingStore: upgradeStoreMutation.isPending,

    downgradeStore: downgradeStoreMutation.mutateAsync,
    isDowngradingStore: downgradeStoreMutation.isPending,

    // Permissions
    canEditStore,
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

/**
 * Hook to access store context
 */
export function useStore() {
  const context = useContext(StoreContext)
  
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  
  return context
}

export default StoreContext
