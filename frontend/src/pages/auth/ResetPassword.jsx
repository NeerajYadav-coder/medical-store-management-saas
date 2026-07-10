/**
 * pages/auth/ResetPassword.jsx
 * 
 * RESPONSIBILITY:
 * - Reset password page using token from reset link
 * - Validates new password strength and matching values
 * - Persists updates to the database via backend call
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { authApi } from '@api/auth.api'
import { ROUTES } from '@config/routes.config'
import { getFriendlyErrorMessage } from '@/utils/errorParser'
import AuthAlertBanner from '@components/common/AuthAlertBanner'
import Button from '@components/common/Button'
import { PasswordInput } from '@components/common/Input'

const resetSchema = z.object({
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const errorTimeoutRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
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
    if (!token) {
      setError('Invalid or missing password reset token. Please check your email link.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await authApi.resetPassword(token, data.password)
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
          <h2 className="text-apple-title-3 font-bold text-label-primary">Password updated</h2>
          <p className="text-apple-caption-1 text-label-secondary mt-2 max-w-sm mx-auto leading-relaxed">
            Your password has been reset successfully. You can now log in using your new credentials.
          </p>
        </div>
        <div className="pt-2">
          <Link to={ROUTES.LOGIN}>
            <Button size="lg" className="w-full bg-system-blue text-white rounded-xl font-semibold">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-apple-title-3 font-bold text-label-primary">Reset password</h2>
        <p className="text-apple-caption-1 text-label-secondary mt-1">
          Create a new password that is secure and easy to remember.
        </p>
      </div>

      {!token && (
        <AuthAlertBanner
          message="No password reset token detected. Please request a new password reset link."
          type="error"
          onClose={() => {}}
        />
      )}

      {error && (
        <AuthAlertBanner
          message={error}
          type="error"
          onClose={handleClearError}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-apple-caption-1 font-semibold text-label-primary">New Password</label>
          <PasswordInput
            placeholder="Min 8 chars, A-Z, a-z, 0-9, special"
            {...register('password')}
            error={errors.password?.message}
            disabled={isSubmitting || !token}
          />
        </div>

        <div className="space-y-1">
          <label className="text-apple-caption-1 font-semibold text-label-primary">Confirm New Password</label>
          <PasswordInput
            placeholder="Verify new password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            disabled={isSubmitting || !token}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-system-blue hover:bg-system-blue/90 text-white font-semibold rounded-xl mt-4 transition-apple-micro active-apple-press flex items-center justify-center gap-2"
          isLoading={isSubmitting}
          disabled={!token}
        >
          <KeyRound className="h-4.5 w-4.5" />
          <span>Update password</span>
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
