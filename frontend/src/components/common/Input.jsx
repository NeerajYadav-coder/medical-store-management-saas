/**
 * components/common/Input.jsx
 * 
 * RESPONSIBILITY:
 * - Reusable input components
 * - Form integration with react-hook-form
 * - Validation error display
 * - Various input types
 */

import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Base Input Component
 */
export const Input = forwardRef(({
  className,
  type = 'text',
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  id,
  ...props
}, ref) => {
  const inputId = id || props.name

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300',
            disabled && 'text-gray-400 dark:text-gray-600'
          )}
        >
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'block w-full px-3 py-2.5 text-sm rounded-lg border transition-all duration-200',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900',
            // Default state
            !error && 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20',
            // Error state
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 pr-10',
            // Disabled state
            disabled && 'bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 cursor-not-allowed',
            // Icon padding
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />

        {/* Right icon or error icon */}
        {(rightIcon || error) && (
          <div className={cn(
            'absolute inset-y-0 right-0 pr-3 flex items-center',
            !rightIcon && 'pointer-events-none'
          )}>
            {error ? (
              <AlertCircle className="h-5 w-5 text-danger-500" />
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>

      {/* Error or hint message */}
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-danger-600 flex items-center gap-1">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'

/**
 * Password Input with show/hide toggle
 */
export const PasswordInput = forwardRef(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      }
      className={className}
      {...props}
    />
  )
})

PasswordInput.displayName = 'PasswordInput'

/**
 * OTP Input Component
 */
export const OTPInput = forwardRef(({
  length = 6,
  value = '',
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}, ref) => {
  const [otp, setOtp] = useState(value.split(''))

  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = digit.slice(-1) // Only last digit if pasted multiple

    setOtp(newOtp)
    onChange?.(newOtp.join(''))

    // Auto-focus next input
    if (digit && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').slice(0, length)
    const digits = pasted.replace(/\D/g, '').split('')
    
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < length) newOtp[i] = digit
    })
    
    setOtp(newOtp)
    onChange?.(newOtp.join(''))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            className={cn(
              'w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 transition-all',
              'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              !error && 'border-gray-300 dark:border-gray-600 focus:border-brand-500 focus:ring-brand-500/20',
              error && 'border-danger-500 focus:border-danger-500',
              disabled && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-danger-600 text-center">{error}</p>
      )}
    </div>
  )
})

OTPInput.displayName = 'OTPInput'

/**
 * Phone Input with +91 prefix
 */
export const PhoneInput = forwardRef(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      maxLength={10}
      leftIcon={
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">+91</span>
      }
      placeholder="Enter 10-digit mobile number"
      className={cn('pl-14', className)}
      {...props}
    />
  )
})

PhoneInput.displayName = 'PhoneInput'

/**
 * Search Input
 */
export const SearchInput = forwardRef(({
  className,
  onClear,
  value,
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      type="search"
      value={value}
      leftIcon={
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightIcon={
        value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null
      }
      className={className}
      {...props}
    />
  )
})

SearchInput.displayName = 'SearchInput'

/**
 * Textarea Component
 */
export const Textarea = forwardRef(({
  className,
  label,
  error,
  hint,
  rows = 4,
  id,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const inputId = id || props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300',
            disabled && 'text-gray-400 dark:text-gray-600'
          )}
        >
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          'block w-full px-3 py-2.5 text-sm rounded-lg border transition-all duration-200',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900',
          !error && 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          disabled && 'bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 cursor-not-allowed',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-sm text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  )
})

Textarea.displayName = 'Textarea'

/**
 * Select Component
 */
export const Select = forwardRef(({
  className,
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  id,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const inputId = id || props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300',
            disabled && 'text-gray-400 dark:text-gray-600'
          )}
        >
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          'block w-full px-3 py-2.5 text-sm rounded-lg border transition-all duration-200',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900',
          !error && 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          disabled && 'bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p className="text-sm text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  )
})

Select.displayName = 'Select'

/**
 * Checkbox Component
 */
export const Checkbox = forwardRef(({
  className,
  label,
  error,
  id,
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || props.name

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-center gap-2 cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-600',
            'focus:ring-2 focus:ring-brand-500 focus:ring-offset-0',
            className
          )}
          {...props}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{label}</span>
      </label>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

export default Input
