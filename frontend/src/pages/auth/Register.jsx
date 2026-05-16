/**
 * pages/auth/Register.jsx
 * 
 * RESPONSIBILITY:
 * - Multi-step registration wizard
 * - Store + Owner registration
 * - Phone and email OTP verification
 * - Form validation with Zod
 */

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { authApi } from '@api/auth.api'
import { ROUTES } from '@config/routes.config'
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
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Step 3: Verification Schema
const verificationSchema = z.object({
  phoneOtp: z.string().length(6, 'Enter 6-digit OTP'),
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
    description: 'Verify your phone & email',
    icon: Shield,
  },
]

export default function Register() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Verification states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState({ phone: false, email: false })
  const [verifyingOtp, setVerifyingOtp] = useState({ phone: false, email: false })
  const [resendTimer, setResendTimer] = useState({ phone: 0, email: 0 })
  
  // DEV MODE: Store OTPs for easy testing
  const [devOtp, setDevOtp] = useState({ phone: '', email: '' })

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
      phoneOtp: '',
      emailOtp: '',
    },
  })

  // Resend timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => ({
        phone: prev.phone > 0 ? prev.phone - 1 : 0,
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
          setError('Password must be at least 8 characters')
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
  const goToNextStep = () => {
    // Validate current step
    if (!validateCurrentStep()) return

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

  // Send phone OTP
  const sendPhoneOtp = async () => {
    const phone = formData.ownerPhone
    console.log('[Register] Sending phone OTP to:', phone)
    
    if (!phone) {
      setError('Phone number not found. Please go back and enter your details.')
      return
    }

    setSendingOtp((prev) => ({ ...prev, phone: true }))
    setError('')
    try {
      // Format phone with country code if needed
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`
      console.log('[Register] Formatted phone:', formattedPhone)
      const response = await authApi.sendOTP('phone', formattedPhone, 'signup')
      console.log('[Register] Phone OTP response:', response)
      
      // DEV MODE: Store the OTP for easy testing
      if (response.devOtp) {
        setDevOtp(prev => ({ ...prev, phone: response.devOtp }))
        console.log('[DEV MODE] Phone OTP:', response.devOtp)
      }
      
      setPhoneOtpSent(true)
      setResendTimer((prev) => ({ ...prev, phone: 60 }))
    } catch (err) {
      console.error('[Register] Phone OTP error:', err)
      setError(err.message || 'Failed to send OTP to phone')
    } finally {
      setSendingOtp((prev) => ({ ...prev, phone: false }))
    }
  }

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

  // Verify phone OTP
  const verifyPhoneOtp = async (otp) => {
    if (!otp || otp.length !== 6) return

    setVerifyingOtp((prev) => ({ ...prev, phone: true }))
    setError('')
    try {
      const formattedPhone = formData.ownerPhone.startsWith('+') 
        ? formData.ownerPhone 
        : `+91${formData.ownerPhone}`
      await authApi.verifyOTP('phone', formattedPhone, otp, 'signup')
      setPhoneVerified(true)
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setVerifyingOtp((prev) => ({ ...prev, phone: false }))
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
    if (!phoneVerified || !emailVerified) {
      setError('Please verify both phone and email')
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
      await authApi.register(submissionData)
      navigate(ROUTES.LOGIN, {
        state: { message: 'Account created successfully! Please login.' },
      })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-send OTPs when entering verification step (only if formData has values)
  useEffect(() => {
    if (currentStep === 2 && formData.ownerPhone && formData.ownerEmail) {
      console.log('[Register] Step 3 entered. FormData:', formData)
      if (!phoneOtpSent && !sendingOtp.phone) {
        sendPhoneOtp()
      }
      if (!emailOtpSent && !sendingOtp.email) {
        sendEmailOtp()
      }
    }
  }, [currentStep, formData.ownerPhone, formData.ownerEmail])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-gray-600">
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
                      : 'bg-gray-200 text-gray-500'
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
                    isCurrent ? 'text-brand-600' : 'text-gray-500'
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
      {error && (
        <div className="p-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-700">
          <p className="text-sm">{error}</p>
        </div>
      )}

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
                hint="Will be used for login OTP"
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
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Password requirements:</p>
              <ul className="text-xs text-gray-500 space-y-1">
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
            {/* Phone OTP */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    phoneVerified ? 'bg-success-100' : 'bg-brand-100'
                  )}>
                    {phoneVerified ? (
                      <Check className="h-5 w-5 text-success-600" />
                    ) : (
                      <Phone className="h-5 w-5 text-brand-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Phone Verification</p>
                    <p className="text-sm text-gray-500">+91 {formData.ownerPhone}</p>
                  </div>
                </div>
                {phoneVerified && (
                  <span className="text-sm font-medium text-success-600">Verified</span>
                )}
              </div>

              {!phoneVerified && (
                <>
                  {phoneOtpSent ? (
                    <div className="space-y-3">
                      <OTPInput
                        length={6}
                        onChange={(otp) => setValue('phoneOtp', otp)}
                        error={errors.phoneOtp?.message}
                      />
                      
                      {/* DEV MODE: Show OTP for testing */}
                      {devOtp.phone && (
                        <div className="p-2 rounded bg-yellow-100 border border-yellow-300">
                          <p className="text-xs text-yellow-800">
                            🔧 DEV MODE - OTP: <strong className="font-mono text-lg">{devOtp.phone}</strong>
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => verifyPhoneOtp(getValues('phoneOtp'))}
                          disabled={verifyingOtp.phone || getValues('phoneOtp')?.length !== 6}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                        >
                          {verifyingOtp.phone ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                          type="button"
                          onClick={sendPhoneOtp}
                          disabled={resendTimer.phone > 0 || sendingOtp.phone}
                          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          {resendTimer.phone > 0 ? `Resend in ${resendTimer.phone}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendPhoneOtp}
                      isLoading={sendingOtp.phone}
                      className="w-full"
                    >
                      Send OTP to Phone
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Email OTP */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
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
                    <p className="font-medium text-gray-900">Email Verification</p>
                    <p className="text-sm text-gray-500">{formData.ownerEmail}</p>
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
                      
                      {/* DEV MODE: Show OTP for testing */}
                      {devOtp.email && (
                        <div className="p-2 rounded bg-yellow-100 border border-yellow-300">
                          <p className="text-xs text-yellow-800">
                            🔧 DEV MODE - OTP: <strong className="font-mono text-lg">{devOtp.email}</strong>
                          </p>
                        </div>
                      )}
                      
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
                          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!phoneVerified || !emailVerified}
            >
              Create Account
            </Button>
          )}
        </div>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
