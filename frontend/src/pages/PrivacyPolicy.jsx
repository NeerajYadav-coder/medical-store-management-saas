/**
 * pages/PrivacyPolicy.jsx
 * 
 * RESPONSIBILITY:
 * - Stunning Apple-style Privacy Policy documentation page
 * - Highlights data isolation, Schedule H/H1 warning systems, and local caching
 */

import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-system-background text-label-primary font-sans py-16 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-system-blue/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-system-green/5 blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-12">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-separator-apple/10 pb-6">
          <Link to="/">
            <button className="flex items-center gap-2 text-apple-caption-1 font-semibold text-system-blue hover:underline cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to MedStore
            </button>
          </Link>
          <span className="text-apple-caption-2 font-bold text-label-tertiary uppercase tracking-widest">Last updated: July 2026</span>
        </div>

        {/* Hero title */}
        <div className="space-y-3">
          <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-tight">Privacy Policy</h1>
          <p className="text-apple-title-3 text-label-secondary leading-relaxed">
            How we secure your pharmacy records, patient details, and transaction data.
          </p>
        </div>

        {/* Data Architecture Highlight Card */}
        <div className="p-6 rounded-2xl bg-secondary-background border border-separator-apple/10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <div className="h-10 w-10 bg-system-blue/10 text-system-blue rounded-xl flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-apple-headline font-bold">Isolated Database Tenant Architecture</h3>
            <p className="text-apple-caption-1 text-label-secondary leading-relaxed">
              Unlike generic SaaS platforms that mingle records in a shared cluster, MedStore spins up isolated database partitions for every pharmacy to guarantee zero cross-contamination.
            </p>
          </div>
          <div className="border border-separator-apple/10 rounded-xl p-4 bg-system-background space-y-3 text-left">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-system-green animate-pulse" />
              <span className="text-[11px] font-bold text-label-secondary uppercase tracking-wider">Active Encryption Status</span>
            </div>
            <div className="space-y-1.5 font-mono text-[10px] leading-relaxed text-label-secondary">
              <p>• Data in Transit: TLS 1.3 Encryption</p>
              <p>• Data at Rest: AES-256 Storage Shields</p>
              <p>• Backup Storage: Daily Encrypted Offsites</p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10">
          <section className="space-y-3.5">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <Shield className="h-5 w-5 text-system-blue" /> 1. Compliance and Regulatory Audits
            </h2>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              As a pharmacy provider, you manage critical clinical information. We log every stock adjustment, schedule change, and checkout transaction under a write-once audit trail. Compliance reports are exportable for Schedule H/H1 authority verification.
            </p>
          </section>

          <section className="space-y-3.5">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <Lock className="h-5 w-5 text-system-blue" /> 2. Patient Identity Protection
            </h2>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              Patient details captured at point-of-sale (names, phone numbers, and symptoms) are accessed strictly for issuing invoices and WhatsApp refills. We never sell, share, or analyze clinical drug records for third-party pharmaceutical entities.
            </p>
          </section>

          <section className="space-y-3.5">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <Eye className="h-5 w-5 text-system-blue" /> 3. Staff and Operator Access Control
            </h2>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              Account owners can restrict specific staff operators to Billing only, preventing visual access to supplier invoice logs, pricing margins, or general pharmacy stats.
            </p>
          </section>
        </div>

        {/* Footer info link */}
        <div className="border-t border-separator-apple/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-apple-caption-2 text-label-tertiary">
          <span>© 2026 MedStore SaaS. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to={ROUTES.TERMS} className="hover:text-label-primary">Terms of Service</Link>
            <Link to={ROUTES.SUPPORT} className="hover:text-label-primary">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
