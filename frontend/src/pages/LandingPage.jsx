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
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('medstore_splash_shown')
  })
  const [isSplashFadingOut, setIsSplashFadingOut] = useState(false)

  const handleDismissSplash = () => {
    sessionStorage.setItem('medstore_splash_shown', 'true')
    setIsSplashFadingOut(true)
    navigate(ROUTES.LOGIN)
    setTimeout(() => {
      setShowSplash(false)
    }, 700)
  }
  
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
    if (location.pathname === ROUTES.LOGIN && !showSplash) {
      setShowLoginModal(true)
    } else {
      setShowLoginModal(false)
    }
  }, [location.pathname, showSplash])

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

  // Prevent background scroll when Splash or Login Modal is open
  useEffect(() => {
    if (showSplash || showLoginModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showSplash, showLoginModal])

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

  const renderSplash = () => {
    if (!showSplash) return null;
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060814] text-white font-sans overflow-hidden select-none transition-all duration-700 ease-in-out ${isSplashFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Sanskrit & animation styles */}
        <style>{`
          @keyframes orbit-outer {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes orbit-inner {
            from { transform: rotate(360deg); }
            to   { transform: rotate(0deg); }
          }
          @keyframes emblem-breathe {
            0%, 100% { opacity: 0.85; }
            50%      { opacity: 1; }
          }
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInSimple {
            from { opacity: 0; }
            to   { opacity: 1; }
          }

          .orbit-ring-outer { animation: orbit-outer 45s linear infinite; }
          .orbit-ring-inner { animation: orbit-inner 32s linear infinite; }
          .emblem-glow      { animation: emblem-breathe 9s ease-in-out infinite; }

          .animate-fade-up {
            opacity: 0;
            animation: fadeUp 550ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          }
          .delay-emblem { animation-delay: 0ms; }
          .delay-shloka { animation-delay: 300ms; }
          .delay-divider { animation-delay: 450ms; }
          .delay-english { animation-delay: 600ms; }
          .delay-hindi { animation-delay: 750ms; }
          .delay-tagline { animation-delay: 900ms; }
          .delay-button { animation-delay: 1050ms; }
          .delay-footer { animation-delay: 1200ms; }

          .sanskrit-text {
            font-family: 'Noto Serif Devanagari', 'Georgia', serif;
            text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
          }

          .btn-enter-platform {
            transition: transform 180ms ease-out, background-color 180ms ease-out, box-shadow 180ms ease-out;
          }
          .btn-enter-platform:hover {
            transform: scale(1.02);
            background-image: linear-gradient(to right, #fbbf24, #f59e0b) !important;
          }
          .btn-enter-platform:active {
            transform: scale(0.98);
          }

          @media (prefers-reduced-motion: reduce) {
            .orbit-ring-outer,
            .orbit-ring-inner,
            .emblem-glow {
              animation: none !important;
              transform: none !important;
              opacity: 1 !important;
            }
            .animate-fade-up {
              transform: none !important;
              animation-name: fadeInSimple !important;
              animation-duration: 400ms !important;
            }
            .btn-enter-platform:hover,
            .btn-enter-platform:active {
              transform: none !important;
            }
          }
        `}</style>

        {/* Glowing aura circles in background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/20 via-indigo-600/25 to-teal-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Outer frame */}
        <div className="max-w-2xl w-full px-6 text-center z-10 flex flex-col items-center gap-3 sm:gap-6">
          {/* Spiritual-Scientific Union Badge */}
          <div className="relative h-16 w-16 sm:h-24 sm:w-24 flex items-center justify-center animate-fade-up delay-emblem">
            {/* Scientific Orbiting rings */}
            {/* Outer Ring */}
            <svg className="absolute inset-0 w-full h-full opacity-35 text-indigo-400 orbit-ring-outer" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 50 50)" />
            </svg>
            {/* Inner Ring */}
            <svg className="absolute inset-0 w-full h-full opacity-35 text-indigo-400 orbit-ring-inner" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="40" ry="13" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(135 50 50)" />
            </svg>
            
            {/* Glowing Golden Ring */}
            <div className="absolute inset-2 rounded-full border border-amber-500/35 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center emblem-glow">
              {/* Mortar & Pestle SVG Icon */}
              <svg className="h-6 w-6 sm:h-10 sm:w-10 text-amber-400" viewBox="0 0 64 64" fill="currentColor">
                {/* Mortar Body with soft transparency inside */}
                <path d="M14,26 C14,43 21,50 32,50 C43,50 50,43 50,26 L14,26 Z" opacity="0.15" />
                <path d="M12,24 L52,24 C53.1,24 54,24.9 54,26 C54,27.1 53.1,28 52,28 L50,28 C50,45 40,52 32,52 C24,52 14,45 14,28 L12,28 C10.9,28 10,27.1 10,26 C10,24.9 10.9,24 12,24 Z" />
                {/* Base pedestal of mortar */}
                <path d="M22,52 L42,52 L44,56 C44.5,57 43.8,58 42.8,58 L21.2,58 C20.2,58 19.5,57 20,56 L22,52 Z" />
                {/* Pestle */}
                <path d="M44,10 L52,18 C52.8,18.8 52.8,20.2 52,21 L35,38 C34.2,38.8 32.8,38.8 32,38 L24,30 C23.2,29.2 23.2,27.8 24,27 L41,10 C41.8,9.2 43.2,9.2 44,10 Z" fill="url(#pestleGrad)" />
                <defs>
                  <linearGradient id="pestleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Slogans Container */}
          <div className="space-y-3 sm:space-y-4">
            {/* Sanskrit text */}
            <h2 className="text-base sm:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-300 sanskrit-text leading-relaxed animate-fade-up delay-shloka">
              स्वस्थस्य स्वास्थ्यरक्षणम्। <br /> आतुरस्य विकारप्रशमनम्॥
            </h2>
            
            {/* Divider */}
            <div className="flex items-center justify-center gap-2 animate-fade-up delay-divider">
              <div className="w-8 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" />
              <div className="h-1 w-1 rounded-full bg-amber-500" />
              <div className="w-8 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>

            {/* English Slogan */}
            <p className="text-xs sm:text-base font-semibold text-slate-200 tracking-tight leading-relaxed max-w-xl mx-auto animate-fade-up delay-english">
              "Preserve the health of the healthy and <br className="xs:hidden" /> relieve the suffering of the sick."
            </p>

            {/* Hindi Translation */}
            <p className="text-[10px] sm:text-xs text-amber-200/90 max-w-lg mx-auto leading-relaxed italic animate-fade-up delay-hindi">
              "स्वस्थ व्यक्ति के स्वास्थ्य की रक्षा करना और रोगी के रोग का शमन करना ही चिकित्सा का उद्देश्य है।"
            </p>

            {/* Sub-text explaining philosophy */}
            <p className="hidden md:block text-xs text-slate-400 max-w-md mx-auto leading-relaxed animate-fade-up delay-tagline">
              Ayurveda's timeless foundation: uniting clinical precision with compassionate care to guard wellness and conquer disease.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 animate-fade-up delay-button">
            <button
              onClick={handleDismissSplash}
              className="group relative flex items-center justify-center gap-2 px-5 py-2.5 sm:px-8 sm:py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.25)] btn-enter-platform cursor-pointer"
            >
              <span>Enter Platform</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
        
        {/* Subtle Footer */}
        <div className="absolute bottom-6 text-center text-[10px] text-slate-600 tracking-widest uppercase font-semibold animate-fade-up delay-footer">
          Powered by Krishna Pharmacy
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-system-background text-label-primary font-sans relative overflow-x-hidden antialiased">
      {renderSplash()}
      
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
                Start Free
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
                Start Free
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
          <div className="bg-system-background border border-separator-apple/10 shadow-elevated rounded-2xl max-w-md w-full p-5 sm:p-8 relative z-10 flex flex-col gap-4 sm:gap-6 animate-in fade-in zoom-in-95 duration-300 mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
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

            <div className="text-center text-apple-caption-1 text-label-secondary">
              New to MedStore?{' '}
              <Link to={ROUTES.REGISTER} className="text-system-blue font-semibold hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 3. SECTION 1 & 2 — HERO & PRODUCT REVEAL */}
      <section className="pt-32 pb-16 px-6 relative bg-gradient-to-b from-system-background via-system-background to-secondary-background/25 overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
          
          {/* Text Content */}
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl">

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[56px] font-bold tracking-tight text-label-primary leading-[1.1]">
              Your pharmacy. <br className="sm:hidden" />Finally organized.
            </h1>

            {/* Subheadline */}
            <p className="text-apple-title-3 text-label-secondary leading-relaxed">
              One clean, secure platform to manage batch-wise stock, automated expiries, split billing, and compliance.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 mt-2">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="bg-system-blue hover:bg-system-blue/90 text-white rounded-full font-semibold px-6 shadow-sm transition-apple-micro active-apple-press">
                  Start Free
                </Button>
              </Link>
              <a href="#features" className="text-apple-body font-semibold text-system-blue hover:underline flex items-center gap-1.5">
                See features <ChevronDown className="h-4.5 w-4.5 mt-0.5" />
              </a>
            </div>
          </div>

          {/* Browser Container mockup (Anchoring the hero) */}
          <div className="reveal-on-scroll bg-secondary-background border border-separator-apple/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-5xl">
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

      {/* 🔴 9. SECTION 7 — COMPLETELY FREE OFFERING */}
      <section id="pricing" className="py-24 max-w-5xl mx-auto px-6 text-center">
        <div className="reveal-on-scroll flex flex-col items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-apple-caption-1 font-bold text-system-green uppercase tracking-widest">100% Free Access</span>
            <h2 className="text-apple-title-2 font-bold text-label-primary">Empowering every pharmacy.</h2>
          </div>

          <div className="border border-separator-apple/15 rounded-2xl p-8 max-w-2xl w-full bg-secondary-background/20 backdrop-blur-sm shadow-sm flex flex-col gap-6 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-[28px] font-bold text-label-primary leading-tight">Zero setup costs. <br className="hidden sm:block" />No subscription fees.</h3>
                <p className="text-apple-caption-1 text-label-secondary leading-relaxed max-w-md">
                  MedStore is currently completely free for all pharmacies. You get unlimited access to batch tracking, AI invoice parsing, and POS billing—no credit card required.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="text-[48px] font-black text-system-green leading-none font-mono">
                  ₹0
                </div>
              </div>
            </div>
            
            <hr className="border-separator-apple/10" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Unlimited medicines and batches',
                'Fast keyboard billing POS',
                'AI invoice document parser',
                'WhatsApp integration alerts',
                'Schedule H/H1 compliance logging',
                'Daily offline backups'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-apple-caption-1 text-label-secondary">
                  <Check className="h-4 w-4 text-system-green" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-center sm:justify-start">
              <Link to={ROUTES.REGISTER}>
                <Button className="bg-label-primary hover:bg-label-primary/90 !text-system-background rounded-xl py-3 px-8 font-semibold text-apple-caption-1 transition-apple-micro active-apple-press">
                  Create Your Free Account
                </Button>
              </Link>
            </div>
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
            <Link to={ROUTES.PRIVACY} className="hover:text-label-primary transition-colors">Privacy Policy</Link>
            <Link to={ROUTES.TERMS} className="hover:text-apple-underline hover:text-label-primary transition-colors">Terms of Service</Link>
            <Link to={ROUTES.SUPPORT} className="hover:text-label-primary transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
