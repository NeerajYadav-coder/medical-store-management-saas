/**
 * SuppliersPage - Supplier management with vendor codes and margin tracking
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, TrendingUp, Filter, Download, 
  Truck, Building2, Star 
} from 'lucide-react';
import Button from '../../components/ui/Button';
import SupplierCard from '../../components/suppliers/SupplierCard';
import SupplierForm from '../../components/suppliers/SupplierForm';
import supplierApi from '../../api/supplier.api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { exportToPDF } from '../../utils/exportPDF';

// Stats card component
const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center mb-3', color)}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    highMargin: 0,
    totalPurchases: 0,
    totalCredit: 0,
  });

  useEffect(() => {
    loadSuppliers();
  }, [filter]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? { marginCategory: filter } : {};
      const response = await supplierApi.getAll(params);
      setSuppliers(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      if (error?.isCancelled) return;
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      if (error?.isCancelled) {
        // do nothing
      } else {
        setLoading(false);
      }
    }
  };

  const calculateStats = (supplierList) => {
    const stats = {
      total: supplierList.length,
      highMargin: supplierList.filter(s => s.marginCategory === 'HIGH').length,
      totalPurchases: supplierList.reduce((sum, s) => sum + (s.totalPurchaseValue || 0), 0),
      totalCredit: supplierList.reduce((sum, s) => sum + (s.currentCredit || 0), 0),
    };
    setStats(stats);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSuppliers();
      return;
    }

    try {
      setLoading(true);
      const response = await supplierApi.search(searchQuery);
      setSuppliers(response.data || []);
    } catch (error) {
      if (error?.isCancelled) return;
      console.error('Error searching suppliers:', error);
    } finally {
      if (error?.isCancelled) {
        // do nothing
      } else {
        setLoading(false);
      }
    }
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const debounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        loadSuppliers();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddSupplier = async (data) => {
    try {
      setFormLoading(true);
      if (editingSupplier) {
        await supplierApi.update(editingSupplier._id, data);
        toast.success('Supplier updated successfully');
      } else {
        await supplierApi.create(data);
        toast.success('Supplier added successfully');
      }
      setShowForm(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleRatingChange = async (supplierId, rating) => {
    try {
      await supplierApi.updateRating(supplierId, rating);
      setSuppliers(suppliers.map(s => 
        s._id === supplierId ? { ...s, rating } : s
      ));
      toast.success('Rating updated');
    } catch (error) {
      toast.error('Failed to update rating');
    }
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
    { label: 'Vendor Code', key: 'vendorCode', align: 'center' },
    { label: 'Supplier Name', key: 'name', align: 'left' },
    { label: 'Phone', key: 'phone', align: 'left' },
    { label: 'Email', key: 'email', align: 'left', format: (val) => val || '—' },
    { label: 'Margin Cat.', key: 'marginCategory', align: 'center' },
    { label: 'Rating', key: 'rating', align: 'center', format: (val) => val ? `${val} ★` : '—' },
    { label: 'Total Purchases', key: 'totalPurchaseValue', align: 'right', format: (val) => val ? `₹${val.toLocaleString('en-IN')}` : '₹0' },
    { label: 'Outstanding Credit', key: 'currentCredit', align: 'right', format: (val) => val ? `₹${val.toLocaleString('en-IN')}` : '₹0' }
  ];

  const handleExport = () => {
    if (!suppliers.length) {
      toast.error('No supplier records to export');
      return;
    }
    
    try {
      exportToPDF(
        suppliers,
        EXPORT_COLUMNS,
        {
          title: 'Supplier Registry Report',
          subtitle: `Active Vendors Ledger · Filter: ${filter || 'ALL'}`,
          summaryCards: [
            { label: 'Total Suppliers', value: stats.total.toString() },
            { label: 'High Margin Count', value: stats.highMargin.toString() },
            { label: 'Total Purchase Vol', value: `₹${stats.totalPurchases.toLocaleString('en-IN')}` },
            { label: 'Total Credit Due', value: `₹${stats.totalCredit.toLocaleString('en-IN')}` }
          ]
        }
      );
      toast.success(`Successfully generated PDF report.`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export suppliers PDF.');
    }
  };

  const FILTERS = [
    { value: 'ALL', label: 'All Suppliers' },
    { value: 'HIGH', label: 'High Margin' },
    { value: 'MEDIUM', label: 'Medium Margin' },
    { value: 'LOW', label: 'Low Margin' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500">Manage vendors with margin tracking</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Building2}
          label="Total Suppliers"
          value={stats.total}
          color="bg-brand-500"
        />
        <StatCard
          icon={TrendingUp}
          label="High Margin"
          value={stats.highMargin}
          subValue={`${stats.total > 0 ? ((stats.highMargin / stats.total) * 100).toFixed(0) : 0}% of total`}
          color="bg-green-500"
        />
        <StatCard
          icon={Truck}
          label="Total Purchases"
          value={formatCurrency(stats.totalPurchases)}
          color="bg-purple-500"
        />
        <StatCard
          icon={Star}
          label="Outstanding Credit"
          value={formatCurrency(stats.totalCredit)}
          color="bg-orange-500"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, vendor code, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button variant="outline" className="w-full sm:w-auto justify-center">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? `No suppliers match "${searchQuery}"` : 'Add your first supplier to get started'}
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(supplier => (
            <SupplierCard
              key={supplier._id}
              supplier={supplier}
              onEdit={handleEdit}
              onRatingChange={handleRatingChange}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleAddSupplier}
          onClose={() => {
            setShowForm(false);
            setEditingSupplier(null);
          }}
          isLoading={formLoading}
        />
      )}
    </div>
  );
}
