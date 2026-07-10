/**
 * pages/TermsOfService.jsx
 * 
 * RESPONSIBILITY:
 * - Stunning Apple-style Terms of Service documentation page
 */

import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, Scale, AlertTriangle } from 'lucide-react'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-system-background text-label-primary font-sans py-16 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-system-blue/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-system-indigo/5 blur-[100px]" />
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
          <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-tight">Terms of Service</h1>
          <p className="text-apple-title-3 text-label-secondary leading-relaxed">
            Rules, responsibilities, and operational parameters for managing your store on MedStore.
          </p>
        </div>

        {/* Highlight Card */}
        <div className="p-6 rounded-2xl bg-secondary-background border border-separator-apple/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-apple-headline font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-system-green" /> 100% Free Operational License
            </h3>
            <p className="text-apple-caption-1 text-label-secondary leading-relaxed max-w-md">
              MedStore is currently distributed as a free platform for pharmaceutical counters across India. No fee schedule applies, and unlimited active batches are allowed.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          <section className="space-y-3.5">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <Scale className="h-5 w-5 text-system-blue" /> 1. Compliance and Valid Credentials
            </h2>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              By using MedStore, you verify that you possess a valid state drug license and operate within compliance laws under the Drug and Cosmetics Act. You are responsible for validating the accuracy of medicine batches, Schedule warning prompts, and billing tax variables entered.
            </p>
          </section>

          <section className="space-y-3.5">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-system-blue" /> 2. Accuracy of AI Invoice Imports
            </h2>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              The AI Invoice Analyzer automatically attempts to extract medicine names, prices, batches, and expiration dates. However, you MUST verify all fields before committing imports to active inventory. MedStore is not liable for typographical errors resulting from visual scanner discrepancies.
            </p>
          </section>

          <section className="space-y-3.5">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <FileText className="h-5 w-5 text-system-blue" /> 3. Service Access and Caching
            </h2>
            <p className="text-apple-body text-label-secondary leading-relaxed">
              Local browser storage caching helps preserve cart checkouts during brief connectivity drops. However, final inventory synchronization and receipt delivery notifications require connection stability. MedStore is not liable for notification delays due to cellular network outages.
            </p>
          </section>
        </div>

        {/* Footer info link */}
        <div className="border-t border-separator-apple/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-apple-caption-2 text-label-tertiary">
          <span>© 2026 MedStore SaaS. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to={ROUTES.PRIVACY} className="hover:text-label-primary">Privacy Policy</Link>
            <Link to={ROUTES.SUPPORT} className="hover:text-label-primary">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
