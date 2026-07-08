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

// Button variants using Tailwind classes mapped to Apple design tokens
const buttonVariants = {
  variant: {
    primary: 'bg-system-blue text-white hover:bg-system-blue/90 focus:ring-system-blue shadow-sm font-semibold active-apple-press transition-apple-micro rounded-xl',
    secondary: 'bg-secondary-background text-label-primary hover:bg-secondary-background/80 border border-separator-apple/20 focus:ring-system-blue active-apple-press transition-apple-micro rounded-xl',
    destructive: 'bg-system-red text-white hover:bg-system-red/90 focus:ring-system-red active-apple-press transition-apple-micro rounded-xl',
    success: 'bg-system-green text-white hover:bg-system-green/90 focus:ring-system-green active-apple-press transition-apple-micro rounded-xl',
    warning: 'bg-system-orange text-white hover:bg-system-orange/90 focus:ring-system-orange active-apple-press transition-apple-micro rounded-xl',
    ghost: 'bg-transparent text-label-secondary hover:bg-secondary-background/60 hover:text-label-primary focus:ring-system-blue active-apple-press transition-apple-micro rounded-xl',
    link: 'bg-transparent text-system-blue hover:text-system-blue/80 underline-offset-4 hover:underline active-apple-press transition-apple-micro',
    outline: 'border border-system-blue/60 text-system-blue hover:bg-system-blue/5 focus:ring-system-blue active-apple-press transition-apple-micro rounded-xl',
  },
  size: {
    xs: 'h-8 px-3 text-apple-footnote rounded-lg',
    sm: 'h-9 px-4 text-apple-subheadline rounded-lg',
    md: 'h-11 px-5 text-apple-callout rounded-xl', // 44px high tap target
    lg: 'h-12 px-6 text-apple-headline rounded-xl',
    xl: 'h-14 px-8 text-apple-title-3 rounded-xl',
    icon: 'h-11 w-11 rounded-xl flex items-center justify-center', // 44px min
    'icon-sm': 'h-9 w-9 rounded-lg flex items-center justify-center',
    'icon-lg': 'h-14 w-14 rounded-xl flex items-center justify-center',
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
