/**
 * SupplierForm - Add/Edit supplier with vendor code
 */

import { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, MapPin, CreditCard, FileText, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Input from '../ui/Input';

const MARGIN_CATEGORIES = [
  { value: 'HIGH', label: 'High Margin (20%+)', color: 'text-green-600' },
  { value: 'MEDIUM', label: 'Medium Margin (10-20%)', color: 'text-yellow-600' },
  { value: 'LOW', label: 'Low Margin (<10%)', color: 'text-red-600' },
  { value: 'UNKNOWN', label: 'Not Set', color: 'text-gray-600 dark:text-gray-400' },
];

const SPECIALIZATIONS = [
  'Tablets', 'Syrups', 'Injections', 'Ayurvedic', 'OTC', 
  'Surgical', 'Baby Care', 'Cosmetics', 'Generics', 'Branded'
];

export default function SupplierForm({ 
  supplier = null, 
  onSubmit, 
  onClose,
  isLoading = false 
}) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    gstNumber: '',
    drugLicenseNumber: '',
    panNumber: '',
    vendorCode: '',
    marginCategory: 'UNKNOWN',
    paymentTerms: 30,
    creditLimit: 0,
    rating: 3,
    specializesIn: [],
    notes: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      upiId: '',
    },
  });

  const [errors, setErrors] = useState({});

  // Load existing supplier data
  useEffect(() => {
    if (supplier) {
      setFormData({
        ...formData,
        ...supplier,
        address: { ...formData.address, ...supplier.address },
        bankDetails: { ...formData.bankDetails, ...supplier.bankDetails },
      });
    }
  }, [supplier]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleBankChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializesIn: prev.specializesIn.includes(spec)
        ? prev.specializesIn.filter(s => s !== spec)
        : [...prev.specializesIn, spec],
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Supplier name is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Supplier Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="e.g., ABC Pharma Distributors"
                />
                <Input
                  label="Vendor Code"
                  value={formData.vendorCode}
                  onChange={(e) => handleChange('vendorCode', e.target.value.toUpperCase())}
                  placeholder="Auto-generated if empty"
                  hint="Unique code like ABC123"
                />
                <Input
                  label="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  placeholder="Sales representative name"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Margin Category
                  </label>
                  <select
                    value={formData.marginCategory}
                    onChange={(e) => handleChange('marginCategory', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500"
                  >
                    {MARGIN_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone *"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={errors.phone}
                  placeholder="Primary phone"
                />
                <Input
                  label="Alternate Phone"
                  value={formData.alternatePhone}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                  placeholder="Secondary phone"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="supplier@email.com"
                  className="col-span-2"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Street"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="Street address"
                  className="col-span-2"
                />
                <Input
                  label="City"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="City"
                />
                <Input
                  label="State"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="State"
                />
                <Input
                  label="Pincode"
                  value={formData.address.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  placeholder="Pincode"
                />
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Business Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GST Number"
                  value={formData.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                />
                <Input
                  label="Drug License"
                  value={formData.drugLicenseNumber}
                  onChange={(e) => handleChange('drugLicenseNumber', e.target.value.toUpperCase())}
                  placeholder="DL number"
                />
                <Input
                  label="PAN Number"
                  value={formData.panNumber}
                  onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="AAAAA0000A"
                />
              </div>
            </div>

            {/* Credit & Payment */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit & Payment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Payment Terms (Days)"
                  type="number"
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', parseInt(e.target.value) || 0)}
                  placeholder="30"
                />
                <Input
                  label="Credit Limit (₹)"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange('creditLimit', parseInt(e.target.value) || 0)}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Specializations */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Specializes In
              </h3>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      formData.specializesIn.includes(spec)
                        ? 'bg-brand-100 border-brand-300 text-brand-700'
                        : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Rating
              </h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleChange('rating', star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        'h-6 w-6 transition-colors',
                        star <= formData.rating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-gray-300 hover:text-amber-200'
                      )} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Additional notes about this supplier..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {supplier ? 'Update Supplier' : 'Add Supplier'}
          </Button>
        </div>
      </div>
    </div>
  );
}
