import { useState } from 'react'
import { Mail, Phone, MessageSquare, FileText, Send, HelpCircle } from 'lucide-react'
import { authApi } from '@api/auth.api'
import { useToast } from '@context/UIContext'
import { useAuth } from '@context/AuthContext'
import Button from '@components/common/Button'
import { Input, Textarea, Select } from '@components/common/Input'

export default function HelpSupport() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.submitSupportTicket({
        name: user?.name || 'Unknown User',
        email: user?.email || 'Unknown Email',
        category: formData.category,
        message: `Subject: ${formData.subject}\n\n${formData.message}`
      })
      toast.success('Your support ticket has been submitted. We will contact you shortly.')
      setFormData({ subject: '', category: 'general', message: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit support ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const faqs = [
    {
      q: "How do I add a new staff member?",
      a: "Go to Store Settings > Staff Management and click 'Add Staff Member'. You will need their name, email, phone, and to set a password for them."
    },
    {
      q: "How does the low stock alert work?",
      a: "The system automatically tracks your inventory. When an item falls below the minimum stock threshold you set, it will appear in your low stock alerts."
    },
    {
      q: "Can I use MedStore on my mobile phone?",
      a: "Yes! MedStore is fully responsive and can be accessed from any modern mobile browser."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Get help with your MedStore account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Options */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Email Support</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title="support.krishnapharmacy@gmail.com">
                    support.krishnapharmacy@gmail.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Live Chat</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Available 9 AM - 6 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Ticket Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What do you need help with?"
                  required
                />
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  options={[
                    { value: 'general', label: 'General Inquiry' },
                    { value: 'billing', label: 'Billing Issue' },
                    { value: 'technical', label: 'Technical Support' },
                    { value: 'feature', label: 'Feature Request' }
                  ]}
                />
              </div>
              <Textarea
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe your issue in detail..."
                rows={5}
                required
              />
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-brand-600" />
          Frequently Asked Questions
        </h3>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index}>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">{faq.q}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
