import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function AuthAlertBanner({ message, type = 'error', onClose, autoDismissMs = 5000 }) {
  useEffect(() => {
    if (!message || !autoDismissMs) return

    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, autoDismissMs)

    return () => clearTimeout(timer)
  }, [message, autoDismissMs, onClose])

  if (!message) return null

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed transition-all duration-300 shadow-sm w-full animate-fade-in",
        type === 'error' 
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300"
          : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300"
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {type === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
        )}
      </div>
      <div className="flex-1 font-medium">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "flex-shrink-0 ml-auto rounded-lg p-1 transition-colors",
            type === 'error'
              ? "hover:bg-red-100 dark:hover:bg-red-900/35 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              : "hover:bg-green-100 dark:hover:bg-green-900/35 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
          )}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
