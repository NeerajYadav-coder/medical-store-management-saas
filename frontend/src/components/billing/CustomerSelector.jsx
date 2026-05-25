/**
 * CustomerSelector - Quick customer search/create with repeat buyer badge
 * Shows loyalty status and purchase history
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Star, Crown, RefreshCw, X, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import customerApi from '../../api/customer.api';

// Loyalty badge component
const LoyaltyBadge = ({ category }) => {
  const badges = {
    NEW: { icon: User, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', label: 'New' },
    REGULAR: { icon: RefreshCw, color: 'bg-blue-100 text-blue-600', label: 'Regular' },
    VIP: { icon: Crown, color: 'bg-amber-100 text-amber-600', label: 'VIP' },
    BULK: { icon: Star, color: 'bg-purple-100 text-purple-600', label: 'Bulk' },
  };
  
  const badge = badges[category] || badges.NEW;
  const Icon = badge.icon;
  
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', badge.color)}>
      <Icon className="h-3 w-3" />
      {badge.label}
    </span>
  );
};

export default function CustomerSelector({ 
  selected = null, 
  onChange,
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search customers
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchQuery]);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.search(searchQuery);
      setCustomers(response || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = (customer) => {
    onChange({
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      isRepeatBuyer: customer.isRepeatBuyer,
      loyaltyCategory: customer.loyaltyCategory,
      totalPurchases: customer.totalPurchases,
      totalSpent: customer.totalSpent,
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearSelection = () => {
    onChange(null);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.phone?.trim()) return;
    
    try {
      setLoading(true);
      const response = await customerApi.quickCreate(
        newCustomer.name || 'Customer',
        newCustomer.phone
      );
      selectCustomer(response);
      setNewCustomer({ name: '', phone: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Customer <span className="text-gray-400 font-normal">(optional - for loyalty tracking)</span>
      </label>

      {/* Selected Customer Display */}
      {selected ? (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              {selected.isRepeatBuyer ? (
                <RefreshCw className="h-5 w-5 text-green-600" />
              ) : (
                <User className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.customerName}</p>
                <LoyaltyBadge category={selected.loyaltyCategory} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selected.customerPhone}
                </span>
                {selected.totalPurchases > 0 && (
                  <>
                    <span>•</span>
                    <span>{selected.totalPurchases} purchases</span>
                    <span>•</span>
                    <span>{formatCurrency(selected.totalSpent || 0)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 rounded-full hover:bg-green-100"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
              'text-sm placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'border-gray-200 dark:border-gray-700'
            )}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-72 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : showAddForm ? (
            /* Add New Customer Form */
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add New Customer</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="tel"
                placeholder="Phone number *"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomer}
                disabled={!newCustomer.phone?.trim()}
                className="w-full py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                Add Customer
              </button>
            </div>
          ) : (
            <>
              {/* Customer List */}
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <button
                    key={customer._id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      customer.isRepeatBuyer ? 'bg-green-100' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      {customer.isRepeatBuyer ? (
                        <RefreshCw className="h-5 w-5 text-green-600" />
                      ) : (
                        <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {customer.name}
                        </p>
                        <LoyaltyBadge category={customer.loyaltyCategory} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{customer.phone}</span>
                        {customer.totalPurchases > 0 && (
                          <>
                            <span>•</span>
                            <span>{customer.totalPurchases} purchases</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No customer found with "{searchQuery}"
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Enter phone or name to search
                </div>
              )}

              {/* Add New Button */}
              <button
                type="button"
                onClick={() => {
                  // Check if search query is phone number
                  const isPhone = /^\d{10}$/.test(searchQuery);
                  setNewCustomer({ 
                    name: isPhone ? '' : searchQuery, 
                    phone: isPhone ? searchQuery : '' 
                  });
                  setShowAddForm(true);
                }}
                className="w-full px-3 py-2.5 text-left hover:bg-brand-50 dark:hover:bg-brand-950/20 flex items-center gap-2 text-brand-600 border-t border-gray-100 dark:border-gray-800"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Add new customer
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
