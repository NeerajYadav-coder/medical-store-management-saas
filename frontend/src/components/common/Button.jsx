/**
 * components/common/Button.jsx
 * 
 * RESPONSIBILITY:
 * - Reusable button component with variants
 * - Loading state handling
 * - Icon support
 */

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

// Button variants using Tailwind classes
const buttonVariants = {
  variant: {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm',
    secondary: 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:bg-gray-950 focus:ring-brand-500',
    destructive: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 focus:ring-gray-500',
    link: 'bg-transparent text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline',
    outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
  },
  size: {
    xs: 'h-7 px-2 text-xs rounded',
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-11 px-6 text-base rounded-lg',
    xl: 'h-12 px-8 text-base rounded-lg',
    icon: 'h-10 w-10 rounded-md',
    'icon-sm': 'h-8 w-8 rounded-md',
    'icon-lg': 'h-12 w-12 rounded-lg',
  },
}

/**
 * Button Component
 */
const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant styles
        buttonVariants.variant[variant],
        // Size styles
        buttonVariants.size[size],
        // Custom className
        className
      )}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      
      {/* Left icon */}
      {!isLoading && leftIcon && (
        <span className="mr-2 flex-shrink-0">{leftIcon}</span>
      )}
      
      {/* Button text */}
      {children}
      
      {/* Right icon */}
      {rightIcon && (
        <span className="ml-2 flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

/**
 * Icon Button Component
 */
export const IconButton = forwardRef(({
  className,
  variant = 'ghost',
  size = 'icon',
  icon,
  label,
  isLoading = false,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      isLoading={isLoading}
      aria-label={label}
      title={label}
      className={cn('p-0', className)}
      {...props}
    >
      {!isLoading && icon}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

/**
 * Button Group Component
 */
export const ButtonGroup = ({ children, className }) => {
  return (
    <div 
      className={cn(
        'inline-flex rounded-md shadow-sm',
        '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md',
        '[&>button:not(:first-child)]:-ml-px',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Button
