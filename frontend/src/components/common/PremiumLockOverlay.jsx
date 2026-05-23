import React from 'react'
import { Lock, Sparkles, Shield, BarChart3 } from 'lucide-react'
import Button from './Button'

export default function PremiumLockOverlay({ title, description, onUpgradeClick }) {
  return (
    <div className="relative min-h-[450px] w-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden shadow-inner">
      {/* Blurred background cards simulating a mock UI */}
      <div className="absolute inset-0 bg-white dark:bg-gray-900/20 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center text-center px-4">
        
        {/* Glassmorphic Lock Card */}
        <div className="bg-white dark:bg-gray-900/80 border border-white/50 shadow-2xl rounded-3xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-500 z-20">
          <div className="relative inline-flex items-center justify-center p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-5">
            <Lock className="h-8 w-8" />
            <Sparkles className="absolute -top-1.5 -right-1.5 h-5 w-5 text-yellow-500 animate-bounce" />
          </div>

          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title || 'Premium Feature'}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">
            {description || 'This feature is available on our Premium Plan. Scale your pharmacy operations with advanced control and analytics.'}
          </p>

          {/* Pricing Highlight */}
          <div className="my-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-brand-50 dark:from-indigo-950/40 dark:to-brand-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Premium Subscription</p>
              <p className="text-lg font-black text-indigo-950 dark:text-indigo-200">₹2,999<span className="text-xs text-gray-400 dark:text-gray-500 font-medium"> / year</span></p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> BEST VALUE
            </span>
          </div>

          <Button 
            type="button" 
            variant="primary" 
            onClick={onUpgradeClick}
            className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 text-base shadow-lg shadow-brand-600/20"
          >
            Upgrade to Premium
          </Button>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">
            Instant activation • Cancel or toggle subscription anytime in settings
          </p>
        </div>
      </div>

      {/* Behind the blur - Mock visual background for aesthetics */}
      <div className="w-full opacity-10 select-none pointer-events-none grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 col-span-2">
          <div className="h-4 w-1/4 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-4/6" />
          </div>
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
