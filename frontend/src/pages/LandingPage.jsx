import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getFriendlyErrorMessage } from '@/utils/errorParser'
import AuthAlertBanner from '@components/common/AuthAlertBanner'
import { 
  Activity, ArrowRight, Shield, Lock, Server, Check, 
  ChevronDown, X, MessageSquare, Terminal, Eye, FileSpreadsheet, Sparkles, Mail
} from 'lucide-react'
import { loginSchema } from '@utils/validators'
import { useAuth } from '@context/AuthContext'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'
import { Input, PasswordInput } from '@components/common/Input'

export default function LandingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, isLoggingIn, loginError, clearLoginError } = useAuth()
  
  const [successMessage, setSuccessMessage] = useState('')
  const [friendlyError, setFriendlyError] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const errorTimeoutRef = useRef(null)
  const successTimeoutRef = useRef(null)

  // Scroll listener for nav border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync login modal state with route /login
  useEffect(() => {
    if (location.pathname === ROUTES.LOGIN) {
      setShowLoginModal(true)
    } else {
      setShowLoginModal(false)
    }
  }, [location.pathname])

  // Login Notification Handling
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

  // Scroll Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.1 }
    )

    const targets = document.querySelectorAll('.reveal-on-scroll')
    targets.forEach((t) => observer.observe(t))

    return () => {
      targets.forEach((t) => observer.unobserve(t))
    }
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
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
      // Error is caught by auth context
    }
  }

  const openLogin = () => {
    navigate(ROUTES.LOGIN)
  }

  const closeLogin = () => {
    navigate('/')
  }

  const fillDemoCredentials = () => {
    setValue('email', 'demo@medstore.com')
    setValue('password', 'Demo@123')
  }

  return (
    <div className="min-h-screen bg-system-background text-label-primary font-sans relative overflow-x-hidden antialiased">
      
      {/* 🔮 CUSTOM CSS FOR MOCKUPS AND INTERACTION */}
      <style>{`
        /* Intersection Observer Animation Classes */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px) scale(0.97);
          transition: opacity 700ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 700ms cubic-bezier(0.25, 0.1, 0.25, 1);
          will-change: transform, opacity;
        }
        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .reveal-on-scroll {
            transform: none !important;
            transition: opacity 300ms ease-out !important;
          }
          .animate-pulse, .animate-ping, .scan-line-anim {
            animation: none !important;
          }
        }

        /* Glassmorphism Styles */
        .glass-nav {
          background-color: var(--color-system-background);
          opacity: 0.96;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        /* Interactive Mockups */
        .scan-line-anim {
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
        }

        /* Keycaps blink animation */
        .keycap-blink {
          animation: blink 2.5s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { background-color: rgba(var(--color-system-blue), 0.05); border-color: rgba(var(--color-system-blue), 0.2); }
          50% { background-color: rgba(var(--color-system-blue), 0.2); border-color: var(--color-system-blue); }
        }
      `}</style>

      {/* 🔴 1. NAVIGATION BAR (Translucent & Persistent) */}
      <nav className={`fixed top-0 left-0 right-0 z-40 h-[52px] transition-all duration-300 flex items-center glass-nav ${
        scrolled ? 'border-b border-separator-apple/10 shadow-sm' : 'border-b border-transparent'
      }`}>
        <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Activity className="h-5 w-5 text-system-blue" />
            <span className="text-apple-headline font-bold text-label-primary tracking-tight">MedStore</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-apple-caption-1 font-semibold text-label-secondary hover:text-label-primary transition-colors">Features</a>
            <a href="#trust" className="text-apple-caption-1 font-semibold text-label-secondary hover:text-label-primary transition-colors">Compliance</a>
            <a href="#pricing" className="text-apple-caption-1 font-semibold text-label-secondary hover:text-label-primary transition-colors">Pricing</a>
            <button onClick={openLogin} className="text-apple-caption-1 font-semibold text-label-secondary hover:text-label-primary transition-colors cursor-pointer">Sign In</button>
          </div>

          {/* Right Action CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to={ROUTES.REGISTER}>
              <Button size="sm" className="bg-system-blue hover:bg-system-blue/90 text-white rounded-full font-semibold px-4 text-apple-caption-1 py-1.5 transition-apple-micro active-apple-press">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-1 text-label-secondary hover:text-label-primary transition-colors"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {showMobileMenu && (
          <div className="absolute top-[52px] left-0 right-0 bg-system-background/95 backdrop-blur-xl border-b border-separator-apple/10 py-6 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 z-50">
            <a 
              href="#features" 
              onClick={() => setShowMobileMenu(false)}
              className="text-apple-subheadline font-semibold text-label-secondary hover:text-label-primary"
            >
              Features
            </a>
            <a 
              href="#trust" 
              onClick={() => setShowMobileMenu(false)}
              className="text-apple-subheadline font-semibold text-label-secondary hover:text-label-primary"
            >
              Compliance
            </a>
            <a 
              href="#pricing" 
              onClick={() => setShowMobileMenu(false)}
              className="text-apple-subheadline font-semibold text-label-secondary hover:text-label-primary"
            >
              Pricing
            </a>
            <hr className="border-separator-apple/10" />
            <button 
              onClick={() => { setShowMobileMenu(false); openLogin(); }}
              className="text-apple-subheadline font-semibold text-label-secondary text-left"
            >
              Sign In
            </button>
            <Link 
              to={ROUTES.REGISTER}
              onClick={() => setShowMobileMenu(false)}
            >
              <Button className="w-full bg-system-blue text-white rounded-xl py-3 font-semibold text-apple-subheadline">
                Start Free Trial
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* 🔴 2. LOGIN FLOATING OVERLAY MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div 
            onClick={closeLogin}
            className="absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity" 
          />

          {/* Modal Container */}
          <div className="bg-system-background border border-separator-apple/10 shadow-elevated rounded-2xl max-w-md w-full p-8 relative z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button 
              onClick={closeLogin}
              className="absolute top-4 right-4 text-label-secondary hover:text-label-primary p-1.5 rounded-full hover:bg-secondary-background transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div>
              <h2 className="text-apple-title-3 font-bold text-label-primary">Welcome back</h2>
              <p className="text-apple-caption-1 text-label-secondary mt-1">Sign in to manage your medical store</p>
            </div>

            {/* Alert Banners */}
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

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                placeholder="neeraj01@ydvvi.com"
                {...register('email')}
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-apple-caption-1 font-semibold text-label-primary">Password</label>
                  <Link to={ROUTES.FORGOT_PASSWORD} className="text-apple-caption-1 text-system-blue hover:underline">Forgot?</Link>
                </div>
                <PasswordInput
                  placeholder="Enter password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-system-blue hover:bg-system-blue/90 text-white font-semibold rounded-xl mt-2 transition-apple-micro active-apple-press" 
                isLoading={isLoggingIn}
              >
                Sign In
              </Button>
            </form>

            {/* Demo Button */}
            <div className="p-3.5 bg-secondary-background border border-separator-apple/10 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-label-secondary uppercase tracking-wider">Demo Access</span>
                <button 
                  onClick={fillDemoCredentials}
                  className="text-apple-caption-2 font-bold text-system-blue hover:underline cursor-pointer"
                >
                  Autofill Credentials
                </button>
              </div>
              <p className="text-apple-caption-2 text-label-secondary leading-tight">
                Use the credentials preset or click autofill to view the demo workspace directly.
              </p>
            </div>

            <div className="text-center text-apple-caption-1 text-label-secondary">
              New to MedStore?{' '}
              <Link to={ROUTES.REGISTER} className="text-system-blue font-semibold hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 3. SECTION 1 — HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative pt-20 pb-12 bg-gradient-to-b from-system-background via-system-background to-secondary-background/25">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          {/* Version badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-background border border-separator-apple/10 text-apple-caption-2 font-bold text-label-secondary shadow-sm">
            <Sparkles className="h-3 w-3 text-system-orange animate-pulse" />
            V2.0 REDESIGNED FOR PHARMACIES
          </div>

          {/* Headline */}
          <h1 className="text-[40px] sm:text-[56px] font-bold tracking-tight text-label-primary leading-[1.1] max-w-3xl">
            Your pharmacy. <br className="sm:hidden" />Finally organized.
          </h1>

          {/* Subheadline */}
          <p className="text-apple-title-3 text-label-secondary max-w-2xl leading-relaxed">
            One clean, secure platform to manage batch-wise stock, automated expiries, split billing, and compliance.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 mt-4">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" className="bg-system-blue hover:bg-system-blue/90 text-white rounded-full font-semibold px-6 shadow-sm transition-apple-micro active-apple-press">
                Start Free Trial
              </Button>
            </Link>
            <a href="#features" className="text-apple-body font-semibold text-system-blue hover:underline flex items-center gap-1.5">
              See features <ChevronDown className="h-4.5 w-4.5 mt-0.5" />
            </a>
          </div>
        </div>

        {/* Scroll affordance chevron */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-label-tertiary">
          <span className="text-[11px] font-bold uppercase tracking-widest mb-1.5 opacity-60">Scroll to explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </section>

      {/* 🔴 4. SECTION 2 — PRODUCT VISUAL REVEAL */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-6 text-center">
        <div className="reveal-on-scroll flex flex-col gap-8">
          <div>
            <h2 className="text-apple-caption-1 font-bold text-system-blue uppercase tracking-widest">Minimalist Interface</h2>
            <p className="text-apple-title-2 font-bold text-label-primary mt-2">Zero learning curve. Focus on what matters.</p>
          </div>

          {/* Browser Container mockup */}
          <div className="bg-secondary-background border border-separator-apple/10 rounded-2xl overflow-hidden shadow-elevated w-full">
            {/* Browser top titlebar */}
            <div className="bg-system-background/60 border-b border-separator-apple/10 px-4 py-3 flex items-center justify-between">
              {/* Left red yellow green dots */}
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-system-red opacity-80" />
                <div className="h-3 w-3 rounded-full bg-system-orange opacity-80" />
                <div className="h-3 w-3 rounded-full bg-system-green opacity-80" />
              </div>
              {/* Address bar */}
              <div className="bg-secondary-background/60 text-label-tertiary text-apple-caption-2 px-6 py-0.5 rounded-md border border-separator-apple/10 flex items-center gap-1.5 select-none w-48 sm:w-80 justify-center">
                <Lock className="h-2.5 w-2.5" />
                <span>medstore.in/dashboard/billing</span>
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Simulated app interface mockup */}
            <div className="bg-system-background p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-left min-h-[350px]">
              {/* Left Column: Search & Quick Selection list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-secondary-background border border-separator-apple/10 p-3 rounded-xl flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-system-blue rounded-full animate-pulse" />
                  <span className="text-apple-caption-1 text-label-secondary font-medium">Search medicine (F1)...</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-secondary-background/40 border border-separator-apple/10 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-apple-caption-1 font-bold text-label-primary">Paracetamol 650mg</div>
                      <div className="text-apple-caption-2 text-label-secondary">Batch: PARA902 · Expiry: Aug 2027</div>
                    </div>
                    <span className="text-apple-caption-2 font-mono font-bold px-2 py-0.5 bg-system-green/10 text-system-green rounded-full">120 in stock</span>
                  </div>
                  <div className="p-3 bg-secondary-background/40 border border-separator-apple/10 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-apple-caption-1 font-bold text-label-primary">Amoxicillin 500mg</div>
                      <div className="text-apple-caption-2 text-label-secondary">Batch: AMX310 · Expiry: Oct 2026</div>
                    </div>
                    <span className="text-apple-caption-2 font-mono font-bold px-2 py-0.5 bg-system-green/10 text-system-green rounded-full">45 in stock</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Cart Summary */}
              <div className="bg-secondary-background border border-separator-apple/10 rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="text-apple-caption-1 font-bold text-label-primary">Bill Cart (3 items)</div>
                  <hr className="border-separator-apple/10" />
                  <div className="flex justify-between text-apple-caption-1 text-label-secondary">
                    <span>Paracetamol x20</span>
                    <span className="font-mono">₹38.00</span>
                  </div>
                  <div className="flex justify-between text-apple-caption-1 text-label-secondary">
                    <span>Amoxicillin x10</span>
                    <span className="font-mono">₹145.00</span>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-separator-apple/10">
                  <div className="flex justify-between text-apple-caption-1 font-bold text-label-primary">
                    <span>Total Amount</span>
                    <span className="font-mono text-system-blue">₹183.00</span>
                  </div>
                  <div className="w-full bg-system-blue text-white py-2 text-center rounded-xl font-bold text-apple-caption-1 select-none">
                    Complete Sale (F8)
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🔴 5. SECTION 3 — FEATURE STORY #1: KEYBOARD-DRIVEN POS */}
      <section id="features" className="py-20 sm:py-28 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Copy Column */}
        <div className="reveal-on-scroll flex flex-col gap-4">
          <span className="text-apple-caption-1 font-bold text-system-blue uppercase tracking-widest">POS Speed</span>
          <h3 className="text-apple-title-1 font-bold text-label-primary leading-tight">Checkout at the speed of thought.</h3>
          <p className="text-apple-body text-label-secondary leading-relaxed">
            Eliminate mouse latency entirely. Use keyboard navigation keys to jump between inventory search fields, select batch expiries, adjust drug quantity rows, and confirm checkout transactions in seconds.
          </p>
        </div>

        {/* Visual Mockup Column (Keycap Matrix) */}
        <div className="reveal-on-scroll bg-secondary-background border border-separator-apple/10 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-system-blue" />
            <span className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-wider">Keyboard Traversal Mapping</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono">
            {[
              { key: 'F1', label: 'Search Meds', active: true },
              { key: 'F2', label: 'Customer ID', active: false },
              { key: 'F3', label: 'Doctor Ref', active: false },
              { key: '↑/↓', label: 'List Navigate', active: true },
              { key: 'Enter', label: 'Add to Cart', active: true },
              { key: 'Esc', label: 'Clear Focus', active: false },
              { key: '+ / -', label: 'Qty Adjust', active: false },
              { key: 'Del', label: 'Remove Item', active: false },
              { key: 'F8', label: 'Complete Sale', active: true },
            ].map((k, i) => (
              <div 
                key={i} 
                className={`p-3.5 border rounded-xl flex flex-col justify-between h-20 text-left transition-colors duration-300 ${
                  k.active 
                    ? 'border-system-blue/30 bg-system-blue/5 text-system-blue keycap-blink' 
                    : 'border-separator-apple/10 bg-system-background text-label-secondary'
                }`}
              >
                <span className="text-apple-caption-1 font-black">{k.key}</span>
                <span className="text-[10px] leading-tight font-sans font-bold">{k.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔴 6. SECTION 4 — FEATURE STORY #2: AI INVOICE SCANNING (Alternated Layout) */}
      <section className="py-20 sm:py-28 bg-secondary-background/30 border-y border-separator-apple/10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Visual Column Left */}
          <div className="reveal-on-scroll order-2 md:order-1 bg-system-background border border-separator-apple/10 rounded-2xl p-6 shadow-sm relative overflow-hidden h-[300px] flex flex-col justify-between">
            {/* Scan animation line overlay */}
            <div className="absolute left-0 right-0 h-0.5 bg-system-blue/40 shadow-sm shadow-system-blue scan-line-anim" />

            <div className="flex items-center justify-between border-b border-separator-apple/10 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-system-blue" />
                <span className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-wider">Invoice Analyzer</span>
              </div>
              <span className="text-apple-caption-2 font-bold text-system-blue bg-system-blue/10 px-2 py-0.5 rounded-full">Processing...</span>
            </div>

            <div className="flex-1 py-4 flex flex-col justify-center gap-3">
              <div className="flex justify-between items-center text-apple-caption-2 text-label-secondary font-mono">
                <span>Distributor Invoice #INV-8910</span>
                <span>Agra Med Wholesalers</span>
              </div>
              <div className="space-y-2">
                <div className="bg-secondary-background/60 p-2.5 rounded-xl border border-separator-apple/5 flex items-center justify-between font-mono text-[11px]">
                  <span>1. PARACETAMOL 650MG [BATCH: PC-88]</span>
                  <span className="text-system-green font-bold">+100 Qty</span>
                </div>
                <div className="bg-secondary-background/60 p-2.5 rounded-xl border border-separator-apple/5 flex items-center justify-between font-mono text-[11px]">
                  <span>2. COMBIFLAM TABLETS [BATCH: CF-92]</span>
                  <span className="text-system-green font-bold">+150 Qty</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-label-tertiary italic text-center">
              Reads batches, expirations, cost rates, and GST variables automatically.
            </div>
          </div>

          {/* Copy Column Right */}
          <div className="reveal-on-scroll order-1 md:order-2 flex flex-col gap-4">
            <span className="text-apple-caption-1 font-bold text-system-blue uppercase tracking-widest">Stock Imports</span>
            <h3 className="text-apple-title-1 font-bold text-label-primary leading-tight">Stock, without the typing.</h3>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              Skip hours of inventory entries. Snap a picture of any distributor purchase bill, and our optical parser automatically isolates medicine names, batch numbers, margin rates, and expiration dates directly.
            </p>
          </div>
        </div>
      </section>

      {/* 🔴 7. SECTION 5 — FEATURE STORY #3: WHATSAPP AUTOMATION (Alternated Layout) */}
      <section className="py-20 sm:py-28 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Copy Column Left */}
        <div className="reveal-on-scroll flex flex-col gap-4">
          <span className="text-apple-caption-1 font-bold text-system-blue uppercase tracking-widest">Patient Loyalty</span>
          <h3 className="text-apple-title-1 font-bold text-label-primary leading-tight">Your customers, remembered.</h3>
          <p className="text-apple-body text-label-secondary leading-relaxed">
            Send digital billing receipts and automated prescription refill reminders directly to your patients' WhatsApp. Stay connected with zero manual logging or custom notifications.
          </p>
        </div>

        {/* Visual Column Right (Phone Mockup) */}
        <div className="reveal-on-scroll flex justify-center">
          <div className="border-8 border-label-primary rounded-[32px] h-[400px] w-[220px] shadow-elevated bg-secondary-background relative overflow-hidden flex flex-col">
            {/* Phone Speaker & Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-28 bg-label-primary rounded-b-xl z-20 flex items-center justify-center">
              <div className="h-1 w-8 bg-label-secondary rounded-full" />
            </div>

            {/* Chat header */}
            <div className="bg-system-blue text-white pt-6 pb-2.5 px-3 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">MS</div>
              <div>
                <div className="text-[10px] font-bold leading-tight">MedStore Care</div>
                <div className="text-[8px] opacity-75">Online</div>
              </div>
            </div>

            {/* Chat Bubbles */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto text-[10px] leading-relaxed flex flex-col justify-end bg-system-background">
              {/* Receipt message */}
              <div className="bg-secondary-background/60 p-2.5 rounded-xl border border-separator-apple/10 max-w-[85%] self-start text-label-primary">
                <p className="font-semibold text-system-blue">⚡ Receipt Issued</p>
                <p className="text-[9px] mt-1 text-label-secondary">Hello Neeraj, here is your bill receipt for 3 medicines. Total paid: ₹183.00.</p>
              </div>

              {/* Refill reminder message */}
              <div className="bg-secondary-background/60 p-2.5 rounded-xl border border-separator-apple/10 max-w-[85%] self-start text-label-primary">
                <p className="font-semibold text-system-orange">📦 Refill Alert</p>
                <p className="text-[9px] mt-1 text-label-secondary">Your 30-day Amoxicillin cycle expires in 3 days. Reply with YES to secure batch hold.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔴 8. SECTION 6 — TRUST & CREDIBILITY BAND */}
      <section id="trust" className="py-24 bg-secondary-background/50 border-y border-separator-apple/10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-apple-caption-1 font-bold text-system-blue uppercase tracking-widest">SaaS Reliability</span>
            <h2 className="text-apple-title-2 font-bold text-label-primary">Built for critical medical operations.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Server, title: '99.9% Cloud Uptime', desc: 'Always ready. Local storage caching preserves billing details even during internet cutouts.' },
              { icon: Shield, title: 'Compliance Guard', desc: 'Alert warnings screen Schedule H/H1 restrictions to enforce regulatory safety.' },
              { icon: Lock, title: 'Data Sovereignty', desc: 'Each store runs on isolated databases to guarantee complete data confidentiality.' },
              { icon: MessageSquare, title: 'Bilingual Delivery', desc: 'Send receipts natively in English or Hindi, adjusting to customer preference.' }
            ].map((card, i) => (
              <div key={i} className="flex flex-col gap-3.5 text-left">
                <div className="h-10 w-10 bg-system-blue/10 text-system-blue rounded-xl flex items-center justify-center">
                  <card.icon className="h-5 w-5" />
                </div>
                <h4 className="text-apple-headline font-bold text-label-primary">{card.title}</h4>
                <p className="text-apple-caption-1 text-label-secondary leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔴 9. SECTION 7 — SIMPLE PRICING TEASER */}
      <section id="pricing" className="py-24 max-w-5xl mx-auto px-6 text-center">
        <div className="reveal-on-scroll flex flex-col items-center gap-12">
          <div className="flex flex-col gap-2">
            <span className="text-apple-caption-1 font-bold text-system-blue uppercase tracking-widest">Straightforward Pricing</span>
            <h2 className="text-apple-title-2 font-bold text-label-primary">One simple rate for all pharmacies.</h2>
          </div>

          <div className="border border-separator-apple/15 rounded-2xl p-8 max-w-sm w-full bg-secondary-background/20 backdrop-blur-sm shadow-sm flex flex-col gap-6">
            <div className="space-y-1">
              <span className="text-apple-caption-2 font-bold text-label-secondary uppercase tracking-widest">MedStore Unlimited</span>
              <div className="text-[40px] font-black text-label-primary leading-none mt-2 font-mono">
                ₹999<span className="text-apple-subheadline font-normal text-label-secondary">/month</span>
              </div>
              <p className="text-apple-caption-1 text-label-secondary mt-1">Billed monthly. Cancel anytime.</p>
            </div>
            <hr className="border-separator-apple/10" />
            <div className="space-y-2.5 text-left">
              {[
                'Unlimited medicines and batches',
                'Fast keyboard billing POS',
                'AI invoice document parser',
                'WhatsApp integration alerts',
                'Schedule H/H1 compliance logging'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-apple-caption-1 text-label-secondary">
                  <Check className="h-4 w-4 text-system-green" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <Link to={ROUTES.REGISTER}>
              <Button className="w-full bg-system-blue hover:bg-system-blue/90 text-white rounded-xl py-3 font-semibold text-apple-caption-1 mt-2 transition-apple-micro active-apple-press">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 🔴 10. SECTION 8 — FINAL CTA */}
      <section className="py-24 bg-gradient-to-b from-system-background to-secondary-background/40 border-t border-separator-apple/10 text-center px-6">
        <div className="reveal-on-scroll max-w-2xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-apple-title-1 font-bold text-label-primary leading-tight">
            Run your pharmacy with confidence.
          </h2>
          <p className="text-apple-body text-label-secondary leading-relaxed">
            Join medical stores managing inventory, compliance, and counter sales with absolute speed.
          </p>
          <Link to={ROUTES.REGISTER} className="mt-2">
            <Button size="lg" className="bg-system-blue hover:bg-system-blue/90 text-white rounded-full font-semibold px-8 shadow-sm transition-apple-micro active-apple-press">
              Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 🔴 11. SECTION 9 — FOOTER */}
      <footer className="bg-secondary-background border-t border-separator-apple/10 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-apple-caption-1 text-label-secondary text-left">
            <span>© 2026 MedStore SaaS. All rights reserved.</span>
            <span className="hidden sm:inline mx-2">·</span>
            <br className="sm:hidden" />
            <span>Designed by </span>
            <a 
              href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold text-system-blue hover:underline"
            >
              Krishna Pharmacy
            </a>
          </div>
          <div className="flex gap-6 text-apple-caption-2 font-semibold text-label-secondary">
            <a href="#" className="hover:text-label-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-apple-underline hover:text-label-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-label-primary transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
