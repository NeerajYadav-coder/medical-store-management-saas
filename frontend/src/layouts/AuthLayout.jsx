/**
 * layouts/AuthLayout.jsx
 * 
 * RESPONSIBILITY:
 * - Layout wrapper for authentication pages
 * - Branding, background, and structure
 */

import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@config/routes.config'

export default function AuthLayout() {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white dark:bg-gray-900 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white dark:bg-gray-900 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white dark:bg-gray-900/20 backdrop-blur flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">MedStore</span>
          </Link>
        </div>

        {/* Tagline */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Smart Pharmacy<br />
            Management for<br />
            Modern India
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Join thousands of pharmacies using MedStore to manage inventory, 
            track expiry, and grow their business.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-6">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-white/60">Active Stores</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">₹50Cr+</div>
              <div className="text-sm text-white/60">Sales Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-white/60">Uptime</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center gap-4 text-sm text-white/60">
          <span>© 2024 MedStore SaaS</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto h-full">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center p-6 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MedStore</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden text-center p-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
          © 2024 MedStore SaaS. All rights reserved.
        </div>
      </div>
    </div>
  )
}
