/**
 * pages/auth/Register.jsx
 * 
 * RESPONSIBILITY:
 * - Multi-step registration wizard
 * - Store + Owner registration
 * - Phone and email OTP verification
 * - Form validation with Zod
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Shield,
  Check,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { authApi } from '@api/auth.api'
import { ROUTES } from '@config/routes.config'
import { useToast } from '@context/UIContext'
import { useAuth } from '@context/AuthContext'
import { getFriendlyErrorMessage } from '@/utils/errorParser'
import AuthAlertBanner from '@components/common/AuthAlertBanner'
import Button from '@components/common/Button'
import { Input, PasswordInput, PhoneInput, OTPInput, Select, Textarea } from '@components/common/Input'

// Step 1: Store Details Schema
const storeSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storePhone: z.string().min(10, 'Enter valid 10-digit phone number').max(10),
  storeEmail: z.string().email('Enter valid email address'),
  address: z.string().min(10, 'Enter complete address'),
  drugLicenseNumber: z.string().min(5, 'Drug license number is required'),
  gstNumber: z.string().optional(),
})

// Step 2: Owner Details Schema
const ownerSchema = z.object({
  ownerName: z.string().min(3, 'Name must be at least 3 characters'),
  ownerPhone: z.string().min(10, 'Enter valid 10-digit phone number').max(10),
  ownerEmail: z.string().email('Enter valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Step 3: Verification Schema
const verificationSchema = z.object({
  emailOtp: z.string().length(6, 'Enter 6-digit OTP'),
})

// Steps configuration
const STEPS = [
  {
    id: 'store',
    title: 'Store Details',
    description: 'Tell us about your pharmacy',
    icon: Building2,
  },
  {
    id: 'owner',
    title: 'Owner Account',
    description: 'Create your admin account',
    icon: User,
  },
  {
    id: 'verify',
    title: 'Verification',
    description: 'Verify your email address',
    icon: Shield,
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [error, setErrorState] = useState('')
  const errorTimeoutRef = useRef(null)

  const setError = (msg) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }

    if (!msg) {
      setErrorState('')
      return
    }

    const friendlyMsg = getFriendlyErrorMessage(msg)
    setErrorState(friendlyMsg)

    errorTimeoutRef.current = setTimeout(() => {
      setErrorState('')
    }, 5000)
  }

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])
  
  // Verification states
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState({ email: false })
  const [verifyingOtp, setVerifyingOtp] = useState({ email: false })
  const [resendTimer, setResendTimer] = useState({ email: 0 })
  
  // DEV MODE: Store OTPs for easy testing
  const [devOtp, setDevOtp] = useState({ email: '' })

  // Email Uniqueness early validation states
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false)

  // Single form for all steps - no dynamic resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
    getValues,
    reset,
    setError: setFormError,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      storeName: '',
      storePhone: '',
      storeEmail: '',
      address: '',
      drugLicenseNumber: '',
      gstNumber: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      password: '',
      confirmPassword: '',
      emailOtp: '',
    },
  })

  // Resend timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => ({
        email: prev.email > 0 ? prev.email - 1 : 0,
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Validate current step fields
  const validateCurrentStep = () => {
    const values = getValues()
    
    switch (currentStep) {
      case 0: // Store Details
        if (!values.storeName || values.storeName.length < 3) {
          setError('Store name must be at least 3 characters')
          return false
        }
        if (!values.storePhone || values.storePhone.length < 10) {
          setError('Enter valid 10-digit store phone number')
          return false
        }
        if (!values.storeEmail || !values.storeEmail.includes('@')) {
          setError('Enter valid store email address')
          return false
        }
        if (!values.address || values.address.length < 10) {
          setError('Enter complete address (at least 10 characters)')
          return false
        }
        if (!values.drugLicenseNumber || values.drugLicenseNumber.length < 5) {
          setError('Drug license number is required')
          return false
        }
        break
        
      case 1: // Owner Details
        if (!values.ownerName || values.ownerName.length < 3) {
          setError('Owner name must be at least 3 characters')
          return false
        }
        if (!values.ownerPhone || values.ownerPhone.length < 10) {
          setError('Enter valid 10-digit phone number')
          return false
        }
        if (!values.ownerEmail || !values.ownerEmail.includes('@')) {
          setError('Enter valid email address')
          return false
        }
        if (!values.password || values.password.length < 8) {
          setError('Password must be at least 8 characters long')
          return false
        }
        if (!/[a-z]/.test(values.password)) {
          setError('Password must contain at least one lowercase letter')
          return false
        }
        if (!/[A-Z]/.test(values.password)) {
          setError('Password must contain at least one uppercase letter')
          return false
        }
        if (!/[0-9]/.test(values.password)) {
          setError('Password must contain at least one number')
          return false
        }
        if (!/[^a-zA-Z0-9]/.test(values.password)) {
          setError('Password must contain at least one special character')
          return false
        }
        if (values.password !== values.confirmPassword) {
          setError("Passwords don't match")
          return false
        }
        break
    }
    
    setError('')
    return true
  }

  // Handle step navigation
  const goToNextStep = async () => {
    // Validate current step
    if (!validateCurrentStep()) return

    const values = getValues()

    if (currentStep === 0) {
      setCheckingEmail(true)
      try {
        const res = await authApi.checkEmailUniqueness(values.storeEmail, 'store')
        if (res && res.success === true && res.available === false) {
          setShowEmailExistsModal(true)
          return
        }
      } catch (err) {
        setError(err.message || 'Error validating store email. Please try again.')
        return
      } finally {
        setCheckingEmail(false)
      }
    } else if (currentStep === 1) {
      setCheckingEmail(true)
      try {
        const res = await authApi.checkEmailUniqueness(values.ownerEmail, 'owner')
        if (res && res.success === true && res.available === false) {
          setShowEmailExistsModal(true)
          return
        }
      } catch (err) {
        setError(err.message || 'Error validating owner email. Please try again.')
        return
      } finally {
        setCheckingEmail(false)
      }
    }

    // Capture ALL form values
    const currentValues = getValues()
    console.log('[Register] Saving form values:', currentValues)
    
    // Update formData state
    setFormData(currentValues)

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setError('')
    }
  }

  // Debug: Log formData when it changes
  useEffect(() => {
    console.log('[Register] formData updated:', formData)
  }, [formData])

  // Send email OTP
  const sendEmailOtp = async () => {
    const email = formData.ownerEmail
    console.log('[Register] Sending email OTP to:', email)
    
    if (!email) {
      setError('Email not found. Please go back and enter your details.')
      return
    }

    setSendingOtp((prev) => ({ ...prev, email: true }))
    setError('')
    try {
      console.log('[Register] Sending email OTP to:', email)
      const response = await authApi.sendOTP('email', email, 'signup')
      console.log('[Register] Email OTP response:', response)
      
      // DEV MODE: Store the OTP for easy testing
      if (response.devOtp) {
        setDevOtp(prev => ({ ...prev, email: response.devOtp }))
        console.log('[DEV MODE] Email OTP:', response.devOtp)
      }
      
      setEmailOtpSent(true)
      setResendTimer((prev) => ({ ...prev, email: 60 }))
    } catch (err) {
      console.error('[Register] Email OTP error:', err)
      setError(err.message || 'Failed to send OTP to email')
    } finally {
      setSendingOtp((prev) => ({ ...prev, email: false }))
    }
  }

  // Verify email OTP
  const verifyEmailOtp = async (otp) => {
    if (!otp || otp.length !== 6) return

    setVerifyingOtp((prev) => ({ ...prev, email: true }))
    setError('')
    try {
      await authApi.verifyOTP('email', formData.ownerEmail, otp, 'signup')
      setEmailVerified(true)
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setVerifyingOtp((prev) => ({ ...prev, email: false }))
    }
  }

  // Final submission
  const onSubmit = async () => {
    if (!emailVerified) {
      setError('Please verify your email')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Format the data for submission
      const submissionData = {
        ...formData,
        // Format phone with country code
        ownerPhone: formData.ownerPhone.startsWith('+') 
          ? formData.ownerPhone 
          : `+91${formData.ownerPhone}`,
      }
      await signup(submissionData)
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message)
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-send OTPs when entering verification step (only if formData has values)
  useEffect(() => {
    if (currentStep === 2 && formData.ownerEmail) {
      console.log('[Register] Step 3 entered. FormData:', formData)
      if (!emailOtpSent && !sendingOtp.email) {
        sendEmailOtp()
      }
    }
  }, [currentStep, formData.ownerEmail])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get started with MedStore in 3 easy steps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isCompleted
                      ? 'bg-success-500 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={cn(
                    'text-xs font-medium',
                    isCurrent ? 'text-brand-600' : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-12 sm:w-20 mx-2',
                    isCompleted ? 'bg-success-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Error message */}
      <AuthAlertBanner 
        message={error} 
        type="error" 
        onClose={() => setError('')} 
      />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1: Store Details */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <Input
              label="Store Name"
              placeholder="ABC Medical Store"
              error={errors.storeName?.message}
              {...register('storeName')}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Phone"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                error={errors.storePhone?.message}
                {...register('storePhone')}
                required
              />
              <Input
                label="Store Email"
                type="email"
                placeholder="store@example.com"
                error={errors.storeEmail?.message}
                {...register('storeEmail')}
                required
              />
            </div>

            <Textarea
              label="Full Address"
              placeholder="Shop No, Street, Area, City, State, PIN"
              rows={3}
              error={errors.address?.message}
              {...register('address')}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Drug License Number"
                placeholder="DL-XX-XXXX"
                error={errors.drugLicenseNumber?.message}
                {...register('drugLicenseNumber')}
                required
                hint="Mandatory for pharmacy operations"
              />
              <Input
                label="GST Number"
                placeholder="22AAAAA0000A1Z5"
                error={errors.gstNumber?.message}
                {...register('gstNumber')}
                hint="Optional but recommended"
              />
            </div>
          </div>
        )}

        {/* Step 2: Owner Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Input
              label="Owner Name"
              placeholder="John Doe"
              error={errors.ownerName?.message}
              {...register('ownerName')}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                error={errors.ownerPhone?.message}
                {...register('ownerPhone')}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.ownerEmail?.message}
                {...register('ownerEmail')}
                required
                hint="Will be used for login"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                label="Password"
                placeholder="Create password"
                error={errors.password?.message}
                {...register('password')}
                required
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />
            </div>

            {/* Password requirements */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Password requirements:</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className={cn('h-3 w-3', watch('password')?.length >= 8 ? 'text-success-500' : 'text-gray-300')} />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <Check className={cn('h-3 w-3', /[A-Z]/.test(watch('password') || '') ? 'text-success-500' : 'text-gray-300')} />
                  One uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <Check className={cn('h-3 w-3', /[a-z]/.test(watch('password') || '') ? 'text-success-500' : 'text-gray-300')} />
                  One lowercase letter
                </li>
                <li className="flex items-center gap-2">
                  <Check className={cn('h-3 w-3', /[0-9]/.test(watch('password') || '') ? 'text-success-500' : 'text-gray-300')} />
                  One number
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Email OTP */}
            <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    emailVerified ? 'bg-success-100' : 'bg-brand-100'
                  )}>
                    {emailVerified ? (
                      <Check className="h-5 w-5 text-success-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-brand-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Verification</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formData.ownerEmail}</p>
                  </div>
                </div>
                {emailVerified && (
                  <span className="text-sm font-medium text-success-600">Verified</span>
                )}
              </div>

              {!emailVerified && (
                <>
                  {emailOtpSent ? (
                    <div className="space-y-3">
                       <OTPInput
                        length={6}
                        onChange={(otp) => setValue('emailOtp', otp)}
                        error={errors.emailOtp?.message}
                      />
                      
                      <div className="flex items-center justify-between">
                        <button
                           type="button"
                          onClick={() => verifyEmailOtp(getValues('emailOtp'))}
                          disabled={verifyingOtp.email || getValues('emailOtp')?.length !== 6}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                        >
                          {verifyingOtp.email ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                          type="button"
                          onClick={sendEmailOtp}
                          disabled={resendTimer.email > 0 || sendingOtp.email}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 disabled:opacity-50"
                        >
                          {resendTimer.email > 0 ? `Resend in ${resendTimer.email}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendEmailOtp}
                      isLoading={sendingOtp.email}
                      className="w-full"
                    >
                      Send OTP to Email
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={goToPrevStep}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={goToNextStep}
              isLoading={checkingEmail}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!emailVerified}
            >
              Create Account
            </Button>
          )}
        </div>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>

      {/* Reusable Email Exists Modal */}
      {showEmailExistsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transform scale-100 transition-all duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Email Already Registered
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                This email is already registered. Please use a different email address.
              </p>
              
              <Button
                type="button"
                className="w-full justify-center"
                onClick={() => setShowEmailExistsModal(false)}
              >
                Okay, got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
