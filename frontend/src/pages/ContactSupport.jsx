/**
 * pages/ContactSupport.jsx
 * 
 * RESPONSIBILITY:
 * - Stunning Apple-style Contact Support form and details page
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Send, CheckCircle, HelpCircle } from 'lucide-react'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'
import { Input, Select, Textarea } from '@components/common/Input'
import { authApi } from '@api/auth.api'

export default function ContactSupport() {
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'technical',
    message: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await authApi.submitSupportTicket(formData)
      setIsLoading(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', category: 'technical', message: '' })
    } catch (err) {
      setIsLoading(false)
      setError(err.response?.data?.message || 'Failed to submit support ticket. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-system-background text-label-primary font-sans py-16 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-system-blue/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-system-indigo/5 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-separator-apple/10 pb-6">
          <Link to="/">
            <button className="flex items-center gap-2 text-apple-caption-1 font-semibold text-system-blue hover:underline cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to MedStore
            </button>
          </Link>
          <span className="text-apple-caption-2 font-bold text-label-tertiary uppercase tracking-widest">Support Portal</span>
        </div>

        {/* Hero title */}
        <div className="space-y-3">
          <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-tight">Contact Support</h1>
          <p className="text-apple-title-3 text-label-secondary leading-relaxed">
            Need help configuring your isolated database or onboarding staff? Get in touch with our team.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Support Form Column */}
          <div className="md:col-span-3 space-y-6">
            <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
              <Mail className="h-5 w-5 text-system-blue" /> Send a Message
            </h2>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-system-green/10 border border-system-green/20 text-system-green space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-bold text-apple-headline">Message Sent Successfully</span>
                </div>
                <p className="text-apple-caption-1 leading-relaxed opacity-90">
                  Our systems operators have received your request. We will reach back at your registered email address within 2-4 business hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-apple-caption-1 font-bold underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 rounded-xl bg-system-red/10 border border-system-red/20 text-system-red text-apple-caption-1">
                    {error}
                  </div>
                )}
                <Input
                  label="Your Name / Pharmacy Name"
                  placeholder="e.g. Krishna Pharmacy"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                
                <Input
                  label="Contact Email Address"
                  type="email"
                  placeholder="you@pharmacy.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Select
                  label="Issue Category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { value: 'technical', label: 'Technical POS Issue' },
                    { value: 'billing', label: 'Billing / Tax Setup' },
                    { value: 'whatsapp', label: 'WhatsApp Alerts Config' },
                    { value: 'import', label: 'AI Invoice Import Discrepancies' },
                    { value: 'other', label: 'Other General Support' }
                  ]}
                />

                <Textarea
                  label="Describe your query"
                  placeholder="Tell us how we can help you..."
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full bg-system-blue text-white rounded-xl py-3 font-semibold transition-apple-micro active-apple-press flex items-center justify-center gap-2 hover:bg-system-blue/90"
                >
                  <Send className="h-4 w-4" /> Send Support Ticket
                </Button>
              </form>
            )}
          </div>

          {/* Contact Details Column */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-6">
              <h2 className="text-apple-title-3 font-bold text-label-primary flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-system-blue" /> Direct Contact
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-label-tertiary mt-0.5" />
                  <div>
                    <h4 className="text-apple-caption-1 font-semibold text-label-primary">Support Email</h4>
                    <a href="mailto:support.krishnapharmacy@gmail.com" className="text-apple-caption-1 text-system-blue hover:underline">
                      support.krishnapharmacy@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-label-tertiary mt-0.5" />
                  <div>
                    <h4 className="text-apple-caption-1 font-semibold text-label-primary">Attribution & Management</h4>
                    <p className="text-apple-caption-1 text-label-secondary leading-relaxed">
                      Krishna Pharmacy Support Centre,<br />
                      Gharhi Chhatrapati, Firozabad
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helper Card */}
            <div className="p-5 rounded-xl border border-separator-apple/10 bg-secondary-background space-y-3">
              <h4 className="text-apple-caption-1 font-bold">Frequently Asked Questions</h4>
              <ul className="text-apple-caption-2 text-label-secondary space-y-2 leading-relaxed">
                <li>• <b>Database backups:</b> Automated snapshots occur daily at 02:00 AM IST.</li>
                <li>• <b>Staff accounts:</b> Owners can disable or limit staff profiles instantly in settings.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer info link */}
        <div className="border-t border-separator-apple/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-apple-caption-2 text-label-tertiary">
          <span>© 2026 MedStore SaaS. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to={ROUTES.PRIVACY} className="hover:text-label-primary">Privacy Policy</Link>
            <Link to={ROUTES.TERMS} className="hover:text-label-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
