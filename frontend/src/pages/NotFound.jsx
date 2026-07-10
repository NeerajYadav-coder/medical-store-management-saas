/**
 * pages/NotFound.jsx
 * 
 * 404 Error Page
 */

import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { ROUTES } from '@config/routes.config'
import Button from '@components/common/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-[150px] font-bold text-gray-200 leading-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center">
                <Search className="h-10 w-10 text-brand-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Link to={ROUTES.DASHBOARD}>
            <Button leftIcon={<Home className="h-4 w-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-gray-400">
          Need help? Contact{' '}
          <a href="mailto:support.krishnapharmacy@gmail.com" className="text-system-blue hover:underline">
            support.krishnapharmacy@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
