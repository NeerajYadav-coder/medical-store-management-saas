/**
 * SupplierCard - Displays supplier with vendor code and margin info
 */

import { 
  Phone, Mail, MapPin, Star, TrendingUp, TrendingDown, 
  Edit, MoreVertical, Truck, CreditCard 
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Margin category badge component
const MarginBadge = ({ category, percentage }) => {
  const badges = {
    HIGH: { color: 'bg-green-100 text-green-700', icon: TrendingUp },
    MEDIUM: { color: 'bg-yellow-100 text-yellow-700', icon: null },
    LOW: { color: 'bg-red-100 text-red-700', icon: TrendingDown },
    UNKNOWN: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', icon: null },
  };
  
  const badge = badges[category] || badges.UNKNOWN;
  const Icon = badge.icon;
  
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', badge.color)}>
      {Icon && <Icon className="h-3 w-3" />}
      {percentage > 0 ? `${percentage.toFixed(1)}%` : category}
    </span>
  );
};

// Star rating component
const StarRating = ({ rating, onChange }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            'focus:outline-none transition-colors',
            onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          )}
        >
          <Star 
            className={cn(
              'h-4 w-4',
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            )} 
          />
        </button>
      ))}
    </div>
  );
};

export default function SupplierCard({ 
  supplier, 
  onEdit, 
  onRatingChange,
  className = '' 
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {supplier.vendorCode?.slice(0, 2) || supplier.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">
                {supplier.vendorCode || 'No Code'}
              </code>
              <MarginBadge 
                category={supplier.marginCategory} 
                percentage={supplier.avgMarginPercentage} 
              />
            </div>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => onEdit?.(supplier)}
          className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
        >
          <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{supplier.phone}</span>
          {supplier.contactPerson && (
            <span className="text-gray-400">({supplier.contactPerson})</span>
          )}
        </div>
        {supplier.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{supplier.email}</span>
          </div>
        )}
        {supplier.address?.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{supplier.address.city}, {supplier.address.state}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Truck className="h-3.5 w-3.5" />
            <span>Total Purchases</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(supplier.totalPurchaseValue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {supplier.totalInvoices || 0} invoices
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Credit Status</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(supplier.currentCredit || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            of {formatCurrency(supplier.creditLimit || 0)} limit
          </p>
        </div>
      </div>

      {/* Footer - Rating & Payment Terms */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Rating:</span>
          <StarRating 
            rating={supplier.rating || 3} 
            onChange={(rating) => onRatingChange?.(supplier._id, rating)}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {supplier.paymentTerms || 30} days payment
        </div>
      </div>

      {/* Specializations */}
      {supplier.specializesIn?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap gap-1">
            {supplier.specializesIn.map((spec, index) => (
              <span 
                key={index}
                className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
