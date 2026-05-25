/**
 * components/dashboard/StatsCard.jsx
 * 
 * RESPONSIBILITY:
 * - Reusable stats card for dashboard
 * - Support for trends, icons, and actions
 */

import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Skeleton } from '@components/common/Loader'

/**
 * Stats Card Component
 */
export default function StatsCard({
  title,
  value,
  icon,
  iconBg = 'bg-brand-100',
  iconColor = 'text-brand-600',
  trend,
  action,
  isLoading = false,
  className,
}) {
  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              trend.isPositive
                ? 'bg-success-100 text-success-700'
                : 'bg-danger-100 text-danger-700'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{title}</p>
      </div>

      {/* Action link or trend label */}
      {action ? (
        <Link
          to={action.href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {action.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : trend?.label ? (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{trend.label}</p>
      ) : null}
    </div>
  )
}
