/**
 * pages/auth/ForgotPassword.jsx
 * 
 * RESPONSIBILITY:
 * - Forgot password request page
 * - Collects email address and fires backend request
 * - Displays premium feedback states with custom animation
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import { authApi } from '@api/auth.api'
import { ROUTES } from '@config/routes.config'
import { getFriendlyErrorMessage } from '@/utils/errorParser'
import AuthAlertBanner from '@components/common/AuthAlertBanner'
import Button from '@components/common/Button'
import { Input } from '@components/common/Input'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const errorTimeoutRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  const handleClearError = () => {
    setError('')
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setError('')
    try {
      await authApi.forgotPassword(data.email)
      setSuccess(true)
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      setError(friendly)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = setTimeout(() => {
        setError('')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-system-green/10 rounded-full flex items-center justify-center text-system-green animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <div>
          <h2 className="text-apple-title-3 font-bold text-label-primary">Check your email</h2>
          <p className="text-apple-caption-1 text-label-secondary mt-2 max-w-sm mx-auto leading-relaxed">
            If the email address exists in our system, we have sent instructions to reset your password.
          </p>
        </div>
        <div className="pt-2">
          <Link to={ROUTES.LOGIN}>
            <Button size="lg" className="w-full bg-system-blue text-white rounded-xl font-semibold">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-apple-title-3 font-bold text-label-primary">Forgot password?</h2>
        <p className="text-apple-caption-1 text-label-secondary mt-1">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <AuthAlertBanner
          message={error}
          type="error"
          onClose={handleClearError}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          placeholder="neeraj01@ydvvi.com"
          {...register('email')}
          error={errors.email?.message}
          leftIcon={<Mail className="h-4 w-4" />}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full bg-system-blue hover:bg-system-blue/90 text-white font-semibold rounded-xl mt-2 transition-apple-micro active-apple-press flex items-center justify-center gap-2"
          isLoading={isSubmitting}
        >
          <Send className="h-4.5 w-4.5" />
          <span>Send reset link</span>
        </Button>
      </form>

      <div className="flex justify-center pt-2">
        <Link to={ROUTES.LOGIN} className="text-apple-caption-1 text-label-secondary hover:text-label-primary transition-colors flex items-center gap-1.5 font-medium">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  )
}
