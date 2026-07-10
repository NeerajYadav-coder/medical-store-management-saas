/**
 * layouts/AuthLayout.jsx
 * 
 * RESPONSIBILITY:
 * - Layout wrapper for authentication pages (Register)
 * - Apple HIG-compliant split layout with branding panel
 * - Uses shared design tokens from the MedStore Apple design system
 */

import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@config/routes.config'
import { Activity, Shield, Server, Zap } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-system-background">
      {/* Left side — Brand storytelling panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-10 flex-col justify-between relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-system-blue/8 blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-system-indigo/8 blur-[100px]" />
        </div>

        {/* Top — Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all group-hover:bg-white/15">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-apple-headline font-bold text-white tracking-tight">MedStore</span>
          </Link>
        </div>

        {/* Center — Value proposition */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-[36px] font-bold text-white leading-[1.1] tracking-tight">
              Your pharmacy,<br />built for tomorrow.
            </h1>
            <p className="text-apple-body text-white/60 max-w-sm leading-relaxed">
              Join medical stores across India managing inventory, compliance, and daily billing with absolute confidence.
            </p>
          </div>

          {/* Trust proof points */}
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'Schedule H/H1 compliance guard' },
              { icon: Server, text: 'Isolated per-store cloud databases' },
              { icon: Zap, text: 'Keyboard-first POS billing engine' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/8 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-apple-caption-1 text-white/50 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Attribution */}
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-3 text-apple-caption-2 text-white/30">
            <span>© 2026 MedStore SaaS</span>
          </div>
          <div className="text-apple-caption-2 text-white/30">
            Designed by{' '}
            <a
              href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors font-medium"
            >
              Krishna Pharmacy
            </a>
          </div>
        </div>
      </div>

      {/* Right side — Form area */}
      <div className="flex-1 flex flex-col bg-system-background overflow-y-auto h-full">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center py-5 px-6 bg-system-background border-b border-separator-apple/10">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-system-blue" />
            <span className="text-apple-headline font-bold text-label-primary tracking-tight">MedStore</span>
          </Link>
        </div>

        {/* Form container — vertically + horizontally centered */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden text-center py-4 px-6 text-apple-caption-2 text-label-tertiary space-y-0.5">
          <span>© 2026 MedStore SaaS. All rights reserved.</span>
          <br />
          <span>
            Designed by{' '}
            <a
              href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-system-blue transition-colors font-medium"
            >
              Krishna Pharmacy
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
