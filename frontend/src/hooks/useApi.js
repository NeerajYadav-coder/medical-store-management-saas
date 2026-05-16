/**
 * hooks/useApi.js
 * 
 * RESPONSIBILITY:
 * - Wrapper hooks for common API patterns
 * - Simplifies React Query usage in components
 * - Consistent loading/error states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@context/UIContext'

/**
 * Generic query hook with toast notifications
 * @param {string|string[]} queryKey - React Query key
 * @param {Function} queryFn - API function to call
 * @param {Object} options - React Query options + custom options
 */
export function useApiQuery(queryKey, queryFn, options = {}) {
  const { toast } = useToast()
  const {
    showErrorToast = true,
    errorMessage = 'Failed to load data',
    ...queryOptions
  } = options

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    onError: (error) => {
      if (showErrorToast) {
        toast.error(error?.message || errorMessage)
      }
      options.onError?.(error)
    },
    ...queryOptions,
  })
}

/**
 * Generic mutation hook with toast notifications
 * @param {Function} mutationFn - API function to call
 * @param {Object} options - React Query options + custom options
 */
export function useApiMutation(mutationFn, options = {}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation successful',
    errorMessage = 'Operation failed',
    invalidateQueries = [],
    ...mutationOptions
  } = options

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (showSuccessToast) {
        toast.success(successMessage)
      }
      
      // Invalidate specified queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
        })
      }
      
      options.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      if (showErrorToast) {
        toast.error(error?.message || errorMessage)
      }
      options.onError?.(error, variables, context)
    },
    ...mutationOptions,
  })
}

/**
 * Hook for paginated queries
 * @param {string} baseKey - Base query key
 * @param {Function} queryFn - API function that accepts { page, limit, ...params }
 * @param {Object} params - Query parameters
 * @param {Object} options - React Query options
 */
export function usePaginatedQuery(baseKey, queryFn, params = {}, options = {}) {
  const { page = 1, limit = 20, ...rest } = params
  
  const queryKey = [baseKey, { page, limit, ...rest }]
  
  const query = useQuery({
    queryKey,
    queryFn: () => queryFn({ page, limit, ...rest }),
    keepPreviousData: true, // Keep showing previous data while loading next page
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
  
  return {
    ...query,
    // Pagination helpers
    hasNextPage: query.data?.pagination?.hasMore ?? false,
    hasPrevPage: page > 1,
    totalPages: query.data?.pagination?.totalPages ?? 1,
    totalItems: query.data?.pagination?.total ?? 0,
    currentPage: page,
    itemsPerPage: limit,
  }
}

/**
 * Hook for search/autocomplete queries
 * @param {string} baseKey - Base query key
 * @param {Function} queryFn - API function that accepts search query
 * @param {string} searchTerm - Current search term
 * @param {Object} options - React Query options
 */
export function useSearchQuery(baseKey, queryFn, searchTerm, options = {}) {
  const {
    minLength = 2,
    debounceMs = 300,
    ...queryOptions
  } = options
  
  const enabled = searchTerm?.length >= minLength
  const queryKey = [baseKey, 'search', searchTerm]
  
  return useQuery({
    queryKey,
    queryFn: () => queryFn(searchTerm),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  })
}

/**
 * Hook for infinite scroll queries
 * @param {string} baseKey - Base query key
 * @param {Function} queryFn - API function
 * @param {Object} options - React Query options
 */
export function useInfiniteQuery(baseKey, queryFn, options = {}) {
  const { toast } = useToast()
  
  return useInfiniteQuery({
    queryKey: [baseKey],
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to load more data')
    },
    ...options,
  })
}

/**
 * Hook to prefetch data
 * @param {string|string[]} queryKey - Query key to prefetch
 * @param {Function} queryFn - API function
 */
export function usePrefetch(queryKey, queryFn) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      queryFn,
      staleTime: 60 * 1000,
    })
  }
}

/**
 * Hook to invalidate queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  
  return (queryKey) => {
    queryClient.invalidateQueries({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    })
  }
}

/**
 * Hook to get cached data
 */
export function useCachedData(queryKey) {
  const queryClient = useQueryClient()
  
  return queryClient.getQueryData(
    Array.isArray(queryKey) ? queryKey : [queryKey]
  )
}

export default {
  useApiQuery,
  useApiMutation,
  usePaginatedQuery,
  useSearchQuery,
  useInfiniteQuery,
  usePrefetch,
  useInvalidateQueries,
  useCachedData,
}
