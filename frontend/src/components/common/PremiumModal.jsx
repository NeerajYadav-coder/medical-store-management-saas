import React from 'react'
import { Sparkles, Shield, BarChart3, Users, Package, Check, X } from 'lucide-react'
import { useStore } from '@context/StoreContext'
import Button from './Button'
import { toast } from 'react-hot-toast'

export default function PremiumModal({ isOpen, onClose }) {
  const { upgradeStore, isUpgradingStore } = useStore()

  if (!isOpen) return null

  const handleUpgrade = async () => {
    try {
      await upgradeStore()
      toast.success('Successfully upgraded to Premium Plan! 🎉')
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to upgrade store. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-50 animate-in fade-in zoom-in duration-300">
        <div className="relative flex flex-col w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          
          {/* Header Gradient */}
          <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-900 text-white px-6 py-8 text-center overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-brand-500/20 rounded-full blur-2xl" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white dark:bg-gray-900/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white dark:bg-gray-900/10 backdrop-blur-md mb-4 border border-white/20">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-black tracking-tight">Upgrade to Premium</h3>
            <p className="text-indigo-200 text-sm mt-1 max-w-xs mx-auto">
              Unlock complete power and compliance for your medical store
            </p>
          </div>

          {/* Body content */}
          <div className="p-6 space-y-5 bg-gray-50 dark:bg-gray-950/50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
              PREMIUM BENEFITS
            </p>

            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  icon: Package, 
                  color: 'text-indigo-600 bg-indigo-50 border-indigo-100', 
                  title: 'Unlimited Medicines', 
                  desc: 'Manage your entire pharmacy catalog without the 100-medicine limit' 
                },
                { 
                  icon: Users, 
                  color: 'text-brand-600 bg-brand-50 border-brand-100', 
                  title: 'Unlimited Staff & Managers', 
                  desc: 'Scale your operations by adding all your pharmacists and cashiers' 
                },
                { 
                  icon: BarChart3, 
                  color: 'text-green-600 bg-green-50 border-green-100', 
                  title: 'Business Reports & Insights', 
                  desc: 'Access sales, profit margins, GST, and purchase performance analytics' 
                },
                { 
                  icon: Shield, 
                  color: 'text-purple-600 bg-purple-50 border-purple-100', 
                  title: 'Audit Trail / Activity Logs', 
                  desc: 'Compliance ready tracking of every transaction, deletion, and edit' 
                }
              ].map((benefit, i) => {
                const IconComponent = benefit.icon
                return (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-gray-200 dark:border-gray-700"
                  >
                    <div className={`p-2.5 rounded-xl border ${benefit.color} flex-shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{benefit.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer with pricing */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Investment</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-3xl font-black text-slate-900">₹2,999</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">/ year</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleUpgrade}
                isLoading={isUpgradingStore}
                className="flex-1 sm:flex-initial bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold px-6"
              >
                Upgrade Now
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
