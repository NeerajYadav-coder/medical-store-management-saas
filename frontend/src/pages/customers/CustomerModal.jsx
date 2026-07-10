import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, CreditCard, Save, Clock, Download, FileText, ShoppingCart } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../../components/ui/Button';
import customerApi from '../../api/customer.api';
import toast from 'react-hot-toast';
import { useStore } from '../../context/StoreContext';
import { exportToPDF } from '../../utils/exportPDF';
import { getImageUrl } from '../../utils/image';

export default function CustomerModal({ isOpen, onClose, customer = null, onSave }) {
  const { store, storeName, storeOwner } = useStore();
  const isEditing = !!customer;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [historyData, setHistoryData] = useState({ sales: [], itemsSummary: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '',
    creditLimit: 0,
    address: { street: '', city: '', state: '', pincode: '' },
    notes: '',
  });

  useEffect(() => {
    if (customer && isOpen) {
      setActiveTab('profile');
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        gender: customer.gender || 'MALE',
        dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : '',
        creditLimit: customer.creditLimit || 0,
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          pincode: customer.address?.pincode || '',
        },
        notes: customer.notes || '',
      });
    } else if (isOpen) {
      setActiveTab('profile');
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'MALE',
        dateOfBirth: '',
        creditLimit: 0,
        address: { street: '', city: '', state: '', pincode: '' },
        notes: '',
      });
    }
  }, [customer, isOpen]);

  // Fetch purchase history when history tab is open
  useEffect(() => {
    if (activeTab === 'history' && customer?._id) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await customerApi.getPurchaseHistory(customer._id);
          if (res?.success) {
            setHistoryData(res.data || { sales: [], itemsSummary: [] });
          }
        } catch (error) {
          console.error('Error fetching purchase history:', error);
          toast.error('Failed to load purchase history');
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, customer]);

  const handleExportHistory = () => {
    if (!historyData.sales?.length) {
      toast.error('No purchase history to export');
      return;
    }

    const columns = [
      { label: 'Date', key: 'billDate', align: 'left', format: (val) => new Date(val).toLocaleDateString('en-IN') },
      { label: 'Bill No.', key: 'billNumber', align: 'left' },
      { label: 'Payment', key: 'paymentMode', align: 'center' },
      { label: 'Items', key: 'totalItems', align: 'center', format: (val) => val ?? 0 },
      { label: 'Total Amount', key: 'grandTotal', align: 'right', format: (val) => `₹${val.toLocaleString('en-IN')}` }
    ];

    exportToPDF(
      historyData.sales,
      columns,
      {
        title: `Purchase Ledger: ${formData.name}`,
        subtitle: `Phone: ${formData.phone || 'N/A'} · VIP Status: ${customer.loyaltyCategory || 'NEW'}`,
        summaryCards: [
          { label: 'Total Visits', value: historyData.sales.length.toString() },
          { label: 'Total Items Bought', value: historyData.itemsSummary.reduce((s, i) => s + i.totalQuantity, 0).toString() },
          { label: 'Gross Spend', value: `₹${customer.totalSpent?.toLocaleString('en-IN') || '0'}` }
        ],
        storeName,
        storeOwner,
        storeLogo: store?.logo ? getImageUrl(store.logo) : ''
      }
    );
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Customer name is required');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (isEditing) {
        res = await customerApi.update(customer._id, formData);
        toast.success('Customer updated successfully');
      } else {
        res = await customerApi.create(formData);
        toast.success('Customer added successfully');
      }
      
      const savedCustomer = res?.data || res;
      onSave(savedCustomer);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(error?.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEditing ? formData.name : 'Add New Customer'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditing ? `Loyalty Category: ${customer.loyaltyCategory || 'NEW'}` : 'Create a new customer profile'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isEditing && (
            <div className="flex gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'profile'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  activeTab === 'history'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Clock className="h-4 w-4" />
                Purchase History
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'profile' ? (
            <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. john@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-800" />

              {/* Address & Extra Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Additional Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleChange}
                        placeholder="e.g. 123 Main St, Apt 4B"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pincode / ZIP
                    </label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credit Limit (₹)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        min="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

            </form>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Purchase History Ledger</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ledger of all purchases and recurring items</p>
                </div>
                <Button 
                  onClick={handleExportHistory} 
                  variant="outline" 
                  size="sm"
                  disabled={!historyData.sales?.length}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print History (PDF)
                </Button>
              </div>

              {historyLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                </div>
              ) : historyData.sales?.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No purchase records found for this customer.</p>
                </div>
              ) : (
                <>
                  {/* Frequently Purchased Medicines */}
                  {historyData.itemsSummary?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-brand-500" />
                        Frequently Purchased Medicines
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {historyData.itemsSummary.map((item) => (
                          <div 
                            key={item._id}
                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between shadow-sm"
                          >
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {item.name} {item.dosage}
                              </p>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                {item.form || 'Medicine'} · Qty Bought: {item.totalQuantity}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                Last: {new Date(item.lastPurchased).toLocaleDateString('en-IN')}
                              </p>
                              <p className="text-xs font-semibold text-brand-650 dark:text-brand-400 mt-0.5">
                                Avg Price: ₹{Math.round(item.avgPrice)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visit Log */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-brand-500" />
                      Visit Log (Bills)
                    </h4>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-xs">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Bill No.</th>
                            <th className="px-4 py-2.5 text-center font-semibold">Payment</th>
                            <th className="px-4 py-2.5 text-center font-semibold">Items</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {historyData.sales.map((sale) => (
                            <tr key={sale._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                                {new Date(sale.billDate).toLocaleDateString('en-IN')}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">
                                {sale.billNumber}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  {sale.paymentMode}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-400">
                                {sale.totalItems}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white">
                                ₹{sale.grandTotal.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-end gap-3">
          {activeTab === 'profile' ? (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="customer-form" 
                disabled={loading}
                className="min-w-[120px] justify-center"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Save Changes' : 'Add Customer'}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button type="button" variant="primary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
