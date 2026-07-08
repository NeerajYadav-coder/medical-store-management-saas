
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getFriendlyErrorMessage } from '@/utils/errorParser'
import AuthAlertBanner from '@components/common/AuthAlertBanner'
import { 
  CheckCircle, ArrowRight, Shield, Activity, TrendingUp, 
  AlertTriangle, Users, Lock, Server, FileText, Zap, 
  LayoutDashboard, ShoppingCart, CreditCard, ChevronDown, Check
} from 'lucide-react'
import { loginSchema } from '@utils/validators'
import { useAuth } from '@context/AuthContext'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'
import { Input, PasswordInput } from '@components/common/Input'

export default function LandingPage() {
  const location = useLocation()
  const { login, isLoggingIn, loginError, clearLoginError } = useAuth()
  const [successMessage, setSuccessMessage] = useState('')
  const [friendlyError, setFriendlyError] = useState('')
  const errorTimeoutRef = useRef(null)
  const successTimeoutRef = useRef(null)

  // Login Logic
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (loginError) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      setFriendlyError(getFriendlyErrorMessage(loginError))

      errorTimeoutRef.current = setTimeout(() => {
        setFriendlyError('')
        clearLoginError()
      }, 5000)
    } else {
      setFriendlyError('')
    }
  }, [loginError, clearLoginError])

  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    }
  }, [successMessage])

  useEffect(() => {
    clearLoginError()
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [clearLoginError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    setSuccessMessage('')
    try {
      await login(data)
    } catch (error) {
      // Error is handled by context
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-white">
      
      {/* 🔴 1️⃣ HERO SECTION */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.1),_transparent)]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white dark:bg-gray-900 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left text-white space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-900/10 border border-white/20 text-sm font-medium text-brand-100 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                  </span>
                  v2.0 Now Live
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                  Smart Pharmacy Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-white">Modern India</span>
                </h1>
                <p className="text-lg lg:text-xl text-brand-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  One platform to manage inventory, expiry, billing, suppliers, and business insights — built specifically for Indian medical stores.
                </p>
              </div>

              {/* Value Bullets */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {[
                  'Batch-wise inventory with FIFO',
                  'Expiry & low-stock alerts',
                  'Fast billing with profit tracking'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-900/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <CheckCircle className="h-5 w-5 text-success-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>

              {/* Trust Numbers */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">10,000+</div>
                  <div className="text-sm text-brand-200">Active Stores</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">₹500Cr+</div>
                  <div className="text-sm text-brand-200">Sales Tracked</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">99.9%</div>
                  <div className="text-sm text-brand-200">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Content - Login Card */}
            <div className="w-full max-w-md flex-shrink-0">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                  <p className="text-gray-500 dark:text-gray-400">Sign in to manage your store</p>
                </div>

                {successMessage && (
                  <AuthAlertBanner
                    message={successMessage}
                    type="success"
                    onClose={() => setSuccessMessage('')}
                  />
                )}

                {friendlyError && (
                  <AuthAlertBanner
                    message={friendlyError}
                    type="error"
                    onClose={() => {
                      setFriendlyError('')
                      clearLoginError()
                    }}
                  />
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Email address"
                    placeholder="you@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                    leftIcon={<Users className="h-4 w-4" />}
                  />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-brand-600 hover:underline">Forgot?</Link>
                    </div>
                    <PasswordInput
                      placeholder="Enter password"
                      {...register('password')}
                      error={errors.password?.message}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" isLoading={isLoggingIn}>
                    Sign In
                  </Button>
                </form>

                {/* Demo Credentials */}
                <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
                  <div className="font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Demo Credentials</div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Email: demo@medstore.com</span>
                    <span>Pass: Demo@123</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  New to MedStore? <Link to={ROUTES.REGISTER} className="text-brand-600 font-semibold hover:underline">Create account</Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🔵 2️⃣ TRUST SIGNALS */}
      <section className="py-12 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Built for Pharmacies', desc: 'Designed specifically for Indian medical stores, not generic billing software.' },
              { icon: Shield, title: 'Legal-Safe Inventory', desc: 'Batch-wise tracking with expiry control and audit logs.' },
              { icon: Activity, title: 'Owner Control', desc: 'Full visibility into profit, discounts, staff actions, and stock risks.' },
              { icon: Server, title: 'Cloud SaaS', desc: 'Access your store securely from anywhere on any device.' }
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟣 3️⃣ PROBLEMS YOU SOLVE */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Running a medical store is hard.<br />
              <span className="text-brand-600">MedStore makes it simple.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Problem 1 */}
            <div className="bg-danger-50 p-6 rounded-2xl border border-danger-100">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-danger-100 rounded-full flex items-center justify-center text-danger-600 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Stock managed medicine-wise</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resulting in missed expiries and wasted money.</p>
                </div>
              </div>
            </div>
            {/* Solution 1 */}
            <div className="bg-success-50 p-6 rounded-2xl border border-success-100">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-success-100 rounded-full flex items-center justify-center text-success-600 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Batch-wise inventory</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automated expiry alerts and FIFO selling.</p>
                </div>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="bg-danger-50 p-6 rounded-2xl border border-danger-100">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-danger-100 rounded-full flex items-center justify-center text-danger-600 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Profit leaking unnoticed</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uncontrolled discounts and unknown margins.</p>
                </div>
              </div>
            </div>
            {/* Solution 2 */}
            <div className="bg-success-50 p-6 rounded-2xl border border-success-100">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-success-100 rounded-full flex items-center justify-center text-success-600 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Exact Profit Tracking</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Per-bill profit analysis and discount controls.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔵 4️⃣ HOW IT WORKS */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How MedStore works</h2>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-800" />

            {[
              { step: '1', title: 'Add Data', desc: 'Import medicines and suppliers easily.' },
              { step: '2', title: 'Purchase', desc: 'Record invoices. Batches auto-created.' },
              { step: '3', title: 'Sell', desc: 'Fast billing with auto-FIFO stock deduction.' },
              { step: '4', title: 'Track', desc: 'View real-time profit and expiry risks.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-brand-900/50">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm max-w-[200px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟣 5️⃣ KEY FEATURES */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Built for powerful owners</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Server, title: 'Inventory Intelligence', desc: 'Batch-wise stock, FIFO selling logic, and automated expiry alerts.' },
              { icon: ShoppingCart, title: 'Fast Billing', desc: 'Smooth counter billing with keyboard shortcuts and multiple payment modes.' },
              { icon: CreditCard, title: 'Purchase Management', desc: 'Track supplier history, credit payments, and purchase cost analysis.' },
              { icon: Zap, title: 'Discount Control', desc: 'Set automatic discount rules with full manual override capabilities for owners.' },
              { icon: Users, title: 'Customer Management', desc: 'Track repeat customers, manage loyalty, and view purchase history.' },
              { icon: LayoutDashboard, title: 'Business Dashboard', desc: 'Live sales, profit, dead stock, and alerts — all at a single glance.' }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-100 hover:shadow-xl hover:shadow-brand-900/5 transition-all group">
                <div className="h-12 w-12 bg-gray-50 dark:bg-gray-950 rounded-xl flex items-center justify-center text-gray-900 dark:text-white mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔵 6️⃣ SECURITY */}
      <section className="py-20 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-xl text-brand-700 mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Secure. Reliable. Accountable.</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              'JWT-based secure authentication',
              'Role-based access (Owner / Staff)',
              'Complete audit logs for all actions',
              'Data isolated per medical store',
              'Cloud-grade 99.9% uptime',
              'Daily automated backups'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <div className="h-2 w-2 bg-success-500 rounded-full" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟣 7️⃣ FINAL CTA */}
      <section className="py-20 bg-brand-900 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-6">Take control of your medical store today</h2>
          <p className="text-xl text-brand-200 mb-10 max-w-2xl mx-auto">
            Join thousands of pharmacies managing inventory, expiry, and profit with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={ROUTES.REGISTER}>
              <Button size="xl" className="bg-white dark:bg-gray-900 text-brand-900 hover:bg-brand-50 min-w-[200px]">
                Create your store account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-brand-300 text-sm">
              Already have an account? <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white underline">Sign in</a>
            </p>
          </div>
        </div>
      </section>

      {/* ⚫ 8️⃣ FOOTER */}
      <footer className="py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div>
            © 2024 MedStore SaaS. All rights reserved. 
            <span className="hidden sm:inline mx-2">•</span> 
            <br className="sm:hidden" /> 
            Crafted by <a href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Krishna Pharmacy</a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900 dark:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 dark:text-white">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 dark:text-white">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
