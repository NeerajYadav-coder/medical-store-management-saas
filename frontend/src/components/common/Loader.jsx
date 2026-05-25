/**
 * components/common/Loader.jsx
 * 
 * RESPONSIBILITY:
 * - Loading spinner/indicator components
 * - Skeleton loading states
 * - Full page loaders
 */

import { cn } from '@/utils/cn'

/**
 * Spinner Component
 */
export function Spinner({ size = 'md', className, color = 'brand' }) {
  const sizes = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4',
  }

  const colors = {
    brand: 'border-brand-600',
    white: 'border-white',
    gray: 'border-gray-400',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent',
        sizes[size],
        colors[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Loader Component - Centered spinner with optional text
 */
export function Loader({ size = 'md', text, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Spinner size={size} />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )
}

/**
 * Full Page Loader
 */
export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-brand-100" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-t-brand-600 border-r-transparent border-b-transparent border-l-transparent" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">{text}</p>
      </div>
    </div>
  )
}

/**
 * Button Loader - Dots animation
 */
export function ButtonLoader({ className }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton Component - For placeholder loading
 */
export function Skeleton({ className, variant = 'rect', width, height }) {
  const variants = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded h-4',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variants[variant],
        className
      )}
      style={{ width, height }}
    />
  )
}

/**
 * Skeleton Text - Multiple lines
 */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton Card
 */
export function SkeletonCard({ className }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

/**
 * Skeleton Table Rows
 */
export function SkeletonTableRows({ rows = 5, columns = 4, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-4 flex-1"
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Loading Overlay
 */
export function LoadingOverlay({ isLoading, text, children }) {
  if (!isLoading) return children

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900/80">
        <Loader text={text} />
      </div>
    </div>
  )
}

/**
 * Progress Bar
 */
export function ProgressBar({ value = 0, max = 100, className, showLabel = false }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Pulse Dot - Connection status indicator
 */
export function PulseDot({ status = 'success', className }) {
  const colors = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-blue-500',
  }

  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          colors[status]
        )}
      />
      <span
        className={cn(
          'relative inline-flex h-3 w-3 rounded-full',
          colors[status]
        )}
      />
    </span>
  )
}

export default Loader
