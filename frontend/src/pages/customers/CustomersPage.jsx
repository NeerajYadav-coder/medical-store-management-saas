/**
 * CustomersPage - Customer management with repeat buyer and loyalty tracking
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, Download, User, Crown, 
  RefreshCw, Phone, TrendingUp, ShoppingBag, Calendar
} from 'lucide-react';
import Button from '../../components/ui/Button';
import customerApi from '../../api/customer.api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { exportToPDF } from '../../utils/exportPDF';
import CustomerModal from './CustomerModal';

// Loyalty badge component
const LoyaltyBadge = ({ category, size = 'md' }) => {
  const badges = {
    NEW: { icon: User, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', label: 'New' },
    REGULAR: { icon: RefreshCw, color: 'bg-blue-100 text-blue-600', label: 'Regular' },
    VIP: { icon: Crown, color: 'bg-amber-100 text-amber-600', label: 'VIP' },
    BULK: { icon: ShoppingBag, color: 'bg-purple-100 text-purple-600', label: 'Bulk' },
  };
  
  const badge = badges[category] || badges.NEW;
  const Icon = badge.icon;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', badge.color, sizeClasses)}>
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />
      {badge.label}
    </span>
  );
};

// Stats card component
const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center mb-3', color)}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

// Customer row component
const CustomerRow = ({ customer, onClick }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Check if dormant (no visit in 90 days)
  const isDormant = customer.lastVisitDate && 
    (Date.now() - new Date(customer.lastVisitDate)) / (1000 * 60 * 60 * 24) > 90;

  return (
    <tr 
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
        isDormant && 'bg-red-50/50 dark:bg-red-950/20'
      )}
      onClick={() => onClick(customer)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center font-medium',
            customer.isRepeatBuyer 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}>
            {customer.isRepeatBuyer ? (
              <RefreshCw className="h-5 w-5" />
            ) : (
              customer.name?.charAt(0).toUpperCase() || 'C'
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{customer.name || 'Unknown'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Phone className="h-3 w-3" />
              {customer.phone || 'No phone'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <LoyaltyBadge category={customer.loyaltyCategory} />
      </td>
      <td className="px-4 py-3 text-center">
        <span className={cn(
          'font-semibold',
          customer.totalPurchases > 5 ? 'text-green-600' : 'text-gray-900 dark:text-white'
        )}>
          {customer.totalPurchases || 0}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
        {formatCurrency(customer.totalSpent)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
        {formatCurrency(customer.avgOrderValue || 0)}
      </td>
      <td className="px-4 py-3">
        <div className={cn(
          'text-sm',
          isDormant ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
        )}>
          {formatDate(customer.lastVisitDate)}
          {isDormant && (
            <span className="block text-xs text-red-500">Dormant</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {customer.isRepeatBuyer && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <RefreshCw className="h-3 w-3" />
            Repeat
          </span>
        )}
      </td>
    </tr>
  );
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [stats, setStats] = useState({
    total: 0,
    repeatBuyers: 0,
    vipCount: 0,
    totalRevenue: 0,
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filter === 'REPEAT') {
        response = await customerApi.getRepeatBuyers();
      } else if (filter === 'VIP') {
        response = await customerApi.getVIPCustomers();
      } else {
        response = await customerApi.getAll({ 
          loyaltyCategory: filter !== 'ALL' ? filter : undefined 
        });
      }
      
      const customerList = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : []);
      
      setCustomers(customerList);
      calculateStats(customerList);
    } catch (error) {
      if (error?.isCancelled) return;
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (customerList) => {
    const stats = {
      total: customerList.length,
      repeatBuyers: customerList.filter(c => c.isRepeatBuyer).length,
      vipCount: customerList.filter(c => c.loyaltyCategory === 'VIP').length,
      totalRevenue: customerList.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    };
    setStats(stats);
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const debounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCustomers();
      } else if (!searchQuery) {
        loadCustomers();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.search(searchQuery);
      const customerList = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : []);
      setCustomers(customerList);
    } catch (error) {
      if (error?.isCancelled) return;
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddCustomerClick = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleModalSave = (savedCustomer) => {
    setIsModalOpen(false);
    loadCustomers();
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const EXPORT_COLUMNS = [
    { label: 'Customer Name', key: 'name', align: 'left' },
    { label: 'Phone Number', key: 'phone', align: 'left' },
    { label: 'Loyalty Cat.', key: 'loyaltyCategory', align: 'center' },
    { label: 'Purchases', key: 'totalPurchases', align: 'center', format: (val) => val ?? 0 },
    { label: 'Total Spent', key: 'totalSpent', align: 'right', format: (val) => val ? `₹${val.toLocaleString('en-IN')}` : '₹0' },
    { label: 'Avg Order Value', key: 'avgOrderValue', align: 'right', format: (val) => val ? `₹${val.toLocaleString('en-IN')}` : '₹0' },
    { label: 'Last Visit', key: 'lastVisitDate', align: 'center', format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : 'Never' },
    { label: 'Repeat Buyer', key: 'isRepeatBuyer', align: 'center', format: (val) => val ? 'Yes' : 'No' }
  ];

  const handleExport = () => {
    if (!customers.length) {
      toast.error('No customer records to export');
      return;
    }
    
    try {
      const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
      const vipCount = customers.filter(c => c.loyaltyCategory === 'VIP').length;
      const repeatCount = customers.filter(c => c.isRepeatBuyer).length;

      exportToPDF(
        customers,
        EXPORT_COLUMNS,
        {
          title: 'Customer Directory Report',
          subtitle: `Active Customers Ledger · Filter: ${filter || 'ALL'}`,
          summaryCards: [
            { label: 'Total Customers', value: customers.length.toString() },
            { label: 'VIP Category', value: vipCount.toString() },
            { label: 'Repeat Buyers', value: repeatCount.toString() },
            { label: 'Gross Revenue Spent', value: `₹${totalSpentAll.toLocaleString('en-IN')}` }
          ]
        }
      );
      toast.success(`Successfully generated PDF report.`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export customers PDF.');
    }
  };

  const FILTERS = [
    { value: 'ALL', label: 'All Customers' },
    { value: 'REPEAT', label: 'Repeat Buyers' },
    { value: 'VIP', label: 'VIP' },
    { value: 'NEW', label: 'New' },
    { value: 'REGULAR', label: 'Regular' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400">Track repeat buyers and loyalty</p>
        </div>
        <Button onClick={handleAddCustomerClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={User}
          label="Total Customers"
          value={stats.total}
          color="bg-brand-500"
        />
        <StatCard
          icon={RefreshCw}
          label="Repeat Buyers"
          value={stats.repeatBuyers}
          subValue={`${stats.total > 0 ? ((stats.repeatBuyers / stats.total) * 100).toFixed(0) : 0}% retention`}
          color="bg-green-500"
        />
        <StatCard
          icon={Crown}
          label="VIP Customers"
          value={stats.vipCount}
          color="bg-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          color="bg-purple-500"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                filter === f.value
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full sm:w-auto justify-center"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Purchases</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Avg Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Last Visit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No customers found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? `No customers match "${searchQuery}"` : 'Customers will appear here after making sales'}
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <CustomerRow
                    key={customer._id}
                    customer={customer}
                    onClick={handleCustomerClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span>Repeat Buyer (4+ purchases)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
          <span>VIP (₹50,000+ spent)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <span>Dormant (90+ days inactive)</span>
        </div>
      </div>
      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleModalSave}
      />
    </div>
  );
}
