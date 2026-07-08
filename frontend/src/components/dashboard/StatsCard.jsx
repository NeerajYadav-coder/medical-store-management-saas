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
  iconBg = 'bg-system-blue/10',
  iconColor = 'text-system-blue',
  trend,
  action,
  isLoading = false,
  className,
}) {
  if (isLoading) {
    return (
      <div className={cn('card p-6 bg-card border border-separator-apple/20 rounded-2xl', className)}>
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'card p-6 bg-card border border-separator-apple/10 rounded-2xl hover-apple-lift transition-apple-default cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-apple-caption-1 font-semibold text-tabular-nums',
              trend.isPositive
                ? 'bg-system-green/10 text-system-green'
                : 'bg-system-red/10 text-system-red'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-apple-title-2 font-bold text-label-primary tracking-tight text-tabular-nums">{value}</p>
        <p className="text-apple-subheadline text-label-secondary mt-1">{title}</p>
      </div>

      {/* Action link or trend label */}
      {action ? (
        <Link
          to={action.href}
          className="mt-4 inline-flex items-center gap-1 text-apple-subheadline font-medium text-system-blue hover:text-system-blue/80 transition-apple-micro active-apple-press"
        >
          {action.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : trend?.label ? (
        <p className="mt-3 text-apple-caption-2 text-label-tertiary">{trend.label}</p>
      ) : null}
    </div>
  )
}
