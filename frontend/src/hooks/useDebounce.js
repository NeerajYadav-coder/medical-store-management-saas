/**
 * hooks/useDebounce.js
 * 
 * RESPONSIBILITY:
 * - Debounce values for search inputs
 * - Prevent excessive API calls
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook to debounce a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook to create a debounced callback
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} Debounced function
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef(null)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay, ...deps])
}

/**
 * Hook to create a throttled callback
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Minimum delay between calls
 * @returns {Function} Throttled function
 */
export function useThrottledCallback(callback, delay = 300) {
  const lastRunRef = useRef(0)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args) => {
    const now = Date.now()
    
    if (now - lastRunRef.current >= delay) {
      lastRunRef.current = now
      callbackRef.current(...args)
    }
  }, [delay])
}

/**
 * Hook for debounced search input
 * @param {string} initialValue - Initial search value
 * @param {number} delay - Debounce delay
 * @returns {{ value: string, debouncedValue: string, onChange: Function, clear: Function }}
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, delay)

  const onChange = useCallback((e) => {
    const newValue = typeof e === 'string' ? e : e.target.value
    setValue(newValue)
  }, [])

  const clear = useCallback(() => {
    setValue('')
  }, [])

  return {
    value,
    debouncedValue,
    onChange,
    clear,
    setValue,
  }
}

export default useDebounce
