/**
 * BillingPage - Main billing/POS page with smart features
 * - Symptom tracking (WHY they're buying)
 * - Doctor prescription tracking
 * - Repeat buyer detection
 * - FIFO batch selection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, Minus, Trash2, Receipt, Printer, 
  Send, CreditCard, Banknote, Smartphone, ShoppingCart,
  AlertCircle, CheckCircle, User, Stethoscope, Clock, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SymptomSelector from '../../components/billing/SymptomSelector';
import DoctorSelector from '../../components/billing/DoctorSelector';
import CustomerSelector from '../../components/billing/CustomerSelector';
import medicineApi from '../../api/medicine.api';
import saleApi from '../../api/sale.api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Payment mode options
const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash', icon: Banknote, color: 'text-green-600' },
  { value: 'UPI', label: 'UPI', icon: Smartphone, color: 'text-purple-600' },
  { value: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-600' },
  { value: 'CREDIT', label: 'Credit', icon: Receipt, color: 'text-orange-600' },
];

export default function BillingPage() {
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [discountType, setDiscountType] = useState('NONE');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showResults, setShowResults] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate bill number on mount
  useEffect(() => {
    generateBillNumber();
  }, []);

  const generateBillNumber = async () => {
    try {
      const response = await saleApi.generateBillNumber();
      setBillNumber(response.billNumber);
    } catch (error) {
      // Fallback to local generation
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      setBillNumber(`${date}0001`);
    }
  };

  // Search medicines
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchMedicines();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchMedicines = async () => {
    try {
      setLoadingMedicines(true);
      setShowResults(true);
      const response = await medicineApi.searchWithStock(searchQuery);
      setSearchResults(response || []);
    } catch (error) {
      console.error('Error searching medicines:', error);
      setSearchResults([]);
    } finally {
      setLoadingMedicines(false);
    }
  };

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add item to cart
  const addToCart = (medicine) => {
    const existingIndex = cartItems.findIndex(item => 
      item.medicineId === medicine._id && item.batchId === medicine.batchId
    );

    if (existingIndex >= 0) {
      // Increase quantity
      const updatedItems = [...cartItems];
      if (updatedItems[existingIndex].quantity < medicine.availableQty) {
        updatedItems[existingIndex].quantity += 1;
        setCartItems(updatedItems);
      } else {
        toast.error('Maximum available quantity reached');
      }
    } else {
      // Add new item
      setCartItems([...cartItems, {
        medicineId: medicine._id,
        medicineName: medicine.name,
        medicineDosage: medicine.dosage,
        medicineForm: medicine.form,
        batchId: medicine.batchId,
        batchNumber: medicine.batchNumber,
        expiryDate: medicine.expiryDate,
        quantity: 1,
        availableQty: medicine.availableQty,
        mrp: medicine.mrp,
        sellingPrice: medicine.sellingPrice,
        purchasePrice: medicine.purchasePrice,
        gstRate: medicine.gstRate || 12,
        discountPercent: 0,
      }]);
    }

    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Update item quantity
  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    if (newQty > cartItems[index].availableQty) {
      toast.error('Not enough stock');
      return;
    }
    
    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQty;
    setCartItems(updatedItems);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Update item discount
  const updateItemDiscount = (index, discount) => {
    const updatedItems = [...cartItems];
    updatedItems[index].discountPercent = Math.min(100, Math.max(0, discount));
    setCartItems(updatedItems);
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let totalCost = 0;
    let totalGst = 0;
    let itemDiscountAmount = 0;

    cartItems.forEach(item => {
      const itemSubtotal = item.quantity * item.sellingPrice;
      const itemDisc = (itemSubtotal * (item.discountPercent || 0)) / 100;
      const taxable = itemSubtotal - itemDisc;
      const gst = (taxable * (item.gstRate || 12)) / 100;
      
      subtotal += itemSubtotal;
      itemDiscountAmount += itemDisc;
      totalGst += gst;
      totalCost += item.quantity * (item.purchasePrice || 0);
    });

    // Bill level discount
    let billDiscount = 0;
    if (discountType === 'PERCENTAGE') {
      billDiscount = (subtotal * discountValue) / 100;
    } else if (discountType === 'FLAT') {
      billDiscount = Math.min(subtotal, discountValue);
    }

    const totalDiscount = itemDiscountAmount + billDiscount;
    const taxableAmount = subtotal - totalDiscount;
    
    // Recalculate GST on final taxable amount if bill discount exists
    // For simplicity, we'll assume bill discount reduces taxable amount proportionally across all items
    // So we just scale the totalGst
    const gstScalingFactor = taxableAmount / (subtotal - itemDiscountAmount || 1);
    const finalGst = totalGst * Math.max(0, gstScalingFactor);

    const grandTotal = Math.round(taxableAmount + finalGst);
    const roundOff = grandTotal - (taxableAmount + finalGst);
    
    const grossProfit = subtotal - totalCost;
    const netProfit = grossProfit - totalDiscount;

    const totals = {
      subtotal,
      itemDiscount: itemDiscountAmount,
      billDiscount,
      totalDiscount,
      taxableAmount: Math.max(0, taxableAmount),
      totalGst: finalGst,
      roundOff,
      grandTotal: Math.max(0, grandTotal),
      totalCost,
      grossProfit: Math.max(0, grossProfit),
      netProfit: Math.max(0, netProfit),
    };

    return totals;
  }, [cartItems, discountType, discountValue]);

  const totals = calculateTotals();

  // Process Sale
  const processSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      const currentTotals = calculateTotals(); // Use current totals

      const saleData = {
        billNumber,
        customerName: customer?.customerName || 'Walk-in Customer',
        customerPhone: customer?.customerPhone || '',
        customerId: customer?.customerId,
        doctorId: doctor?.doctorId,
        doctorName: doctor?.doctorName,
        isPrescribed: !!doctor,
        symptoms: symptoms,
        isRepeatCustomer: customer?.isRepeatBuyer || false,

        items: cartItems.map(item => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          medicineDosage: item.medicineDosage,
          medicineForm: item.medicineForm,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          purchasePrice: item.purchasePrice,
          discountPercent: item.discountPercent,
          gstRate: item.gstRate,
          totalAmount: item.quantity * item.sellingPrice * (1 - item.discountPercent / 100), // Calculate item total
        })),

        paymentMode: paymentMethod.toUpperCase(),
        paymentStatus: 'PAID',
        amountPaid: currentTotals.grandTotal,

        subtotal: currentTotals.subtotal,
        discountType: discountType,
        discountValue: discountValue,
        discountAmount: currentTotals.totalDiscount,
        discountReason,
        taxableAmount: currentTotals.taxableAmount,
        totalGst: currentTotals.totalGst,
        roundOff: currentTotals.roundOff,
        grandTotal: currentTotals.grandTotal,
        totalCost: currentTotals.totalCost,
        grossProfit: currentTotals.grossProfit,
        netProfit: currentTotals.netProfit,
        notes,
      };

      const response = await saleApi.create(saleData);

      setLastBill(response);
      setShowSuccessModal(true);
      toast.success(`Bill #${response?.billNumber || billNumber} created!`);

      // Reset form
      resetForm();
      generateBillNumber(); // Generate new bill number for next sale
    } catch (error) {
      console.error('Sale error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setCartItems([]);
    setCustomer(null);
    setDoctor(null);
    setSymptoms([]);
    setPaymentMethod('cash');
    setDiscountType('PERCENTAGE');
    setDiscountValue(0);
    setDiscountReason('');
    setNotes('');
    setSearchQuery('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('bill-receipt');
    const WinPrint = window.open('', '', 'width=900,height=650');
    WinPrint.document.write('<html><head><title>Print Bill</title>');
    WinPrint.document.write('<style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border-bottom:1px solid #eee;padding:8px;text-align:left;} .total{font-weight:bold;}</style>');
    WinPrint.document.write('</head><body>');
    WinPrint.document.write(printContent.innerHTML);
    WinPrint.document.write('</body></html>');
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Bill Success Modal */}
      {showSuccessModal && lastBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-gray-100">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sale Completed!</h3>
              <p className="text-gray-500">Bill #{lastBill.billNumber} generated successfully</p>
            </div>

            <div id="bill-receipt" className="p-6 bg-gray-50 text-sm">
              <div className="text-center mb-4">
                <h4 className="font-bold text-lg">{user?.medicalStoreId?.name || 'Medical Store'}</h4>
                <p className="text-xs text-gray-500">{user?.medicalStoreId?.address || ''}</p>
              </div>

              <div className="flex justify-between mb-2">
                <span>Bill No: <b>{lastBill.billNumber}</b></span>
                <span>Date: {new Date(lastBill.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="mb-4">
                <p>Customer: <b>{lastBill.customerName}</b></p>
                {lastBill.customerPhone && <p>Phone: {lastBill.customerPhone}</p>}
              </div>

              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-right">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill.items.map(item => (
                    <tr key={item._id} className="border-b border-gray-100">
                      <td className="py-1">{item.medicineName}</td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">{formatCurrency(item.sellingPrice)}</td>
                      <td className="py-1 text-right">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastBill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatCurrency(lastBill.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST)</span>
                  <span>{formatCurrency(lastBill.totalGst)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>{formatCurrency(lastBill.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Left Side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Billing (POS)</h1>
            <div className="px-3 py-1 bg-brand-50 rounded-full border border-brand-100">
              <p className="text-xs font-medium text-brand-700">
                Bill No: <span className="font-mono">{billNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span className="font-medium text-gray-700 capitalize">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Product Search */}
        <div className="p-4 shrink-0">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search medicine by name or batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className={cn(
                'w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all',
                'text-lg placeholder:text-gray-400',
                'focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500',
                showResults ? 'border-brand-500 rounded-b-none shadow-lg' : 'border-gray-200'
              )}
            />

            {/* Search Results */}
            {showResults && searchQuery.length >= 2 && (
              <div
                ref={searchRef}
                className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-brand-500 border-t-0 rounded-b-xl shadow-xl max-h-[60vh] overflow-auto"
              >
                {loadingMedicines ? (
                  <div className="p-8 text-center text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Searching stock...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No medicine found with available stock
                  </div>
                ) : (
                  searchResults.map((medicine) => (
                    <button
                      key={`${medicine._id}-${medicine.batchId}`}
                      type="button"
                      onClick={() => addToCart(medicine)}
                      className="w-full flex items-center justify-between p-4 hover:bg-brand-50 transition-colors border-b border-gray-100 last:border-0 text-left"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {medicine.name} {medicine.dosage}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            Batch: {medicine.batchNumber}
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            new Date(medicine.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60000)
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-600'
                          )}>
                            Exp: {new Date(medicine.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(medicine.sellingPrice)}
                        </p>
                        <p className={cn(
                          'text-xs font-medium',
                          medicine.availableQty < 10 ? 'text-red-500' : 'text-gray-500'
                        )}>
                          Stock: {medicine.availableQty}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="flex-1 overflow-auto p-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">Cart is empty</p>
              <p className="text-sm">Search and add medicines to start billing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.medicineId}-${item.batchId}`}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.medicineName} {item.medicineDosage}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Batch: {item.batchNumber} • Exp: {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-50 text-gray-600 border-r border-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-12 text-center py-1.5 focus:outline-none text-sm font-medium"
                          min="1"
                          max={item.availableQty}
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-1.5 hover:bg-gray-50 text-gray-600 border-l border-gray-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        /{item.availableQty}
                      </span>
                    </div>

                    {/* Item Discount */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Disc%:</span>
                      <input
                        type="number"
                        value={item.discountPercent}
                        onChange={(e) => updateItemDiscount(index, parseFloat(e.target.value) || 0)}
                        className="w-12 px-1 py-1 rounded border border-gray-200 text-xs text-center"
                        min="0"
                        max="100"
                      />
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.sellingPrice * (1 - item.discountPercent / 100))}
                      </p>
                      {item.discountPercent > 0 && (
                        <p className="text-[10px] text-gray-400 line-through">
                          {formatCurrency(item.quantity * item.sellingPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Customer & Payment */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Customer Selection */}
          <CustomerSelector
            selected={customer}
            onChange={setCustomer}
          />

          <hr className="border-gray-100" />

          {/* Doctor Selection */}
          <DoctorSelector
            selected={doctor}
            onChange={setDoctor}
          />

          <hr className="border-gray-100" />

          {/* Symptom Selection */}
          <SymptomSelector
            selected={symptoms}
            onChange={setSymptoms}
          />

          <hr className="border-gray-100" />

          {/* Billing Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Payment Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              {totals.itemDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Item Discounts</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(totals.itemDiscount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 whitespace-nowrap">Bill Discount</span>
                <div className="flex items-center gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1 py-1"
                  >
                    <option value="PERCENTAGE">%</option>
                    <option value="FLAT">₹</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 text-right text-sm border-b border-gray-200 focus:border-brand-500 outline-none"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxable Amount</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totals.taxableAmount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total GST (12%)</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totals.totalGst)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-400 italic">
                <span>Round off</span>
                <span>{totals.roundOff > 0 ? '+' : ''}{totals.roundOff.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                    paymentMethod === method.id
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200'
                  )}
                >
                  <method.icon className="h-4 w-4" />
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total & Checkout */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Grand Total</span>
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>

          {/* Profit indicator (owner only) */}
          {user?.role === 'OWNER' && totals.netProfit > 0 && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>Profit</span>
              <span className="text-green-500">+{formatCurrency(totals.netProfit)}</span>
            </div>
          )}

          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={processSale}
            isLoading={processing}
            disabled={cartItems.length === 0}
          >
            <Receipt className="h-5 w-5 mr-2" />
            Complete Sale
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
              disabled={!lastBill}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!lastBill) return;
                const text = `Hi ${lastBill.customerName}, your bill from ${user?.medicalStoreId?.name || 'our store'} is ready. Total: ${formatCurrency(lastBill.grandTotal)}. View here: ${window.location.origin}/invoice/${lastBill._id}`;
                window.open(`https://wa.me/${lastBill.customerPhone}?text=${encodeURIComponent(text)}`);
              }}
              className="flex-1"
              disabled={!lastBill || !lastBill.customerPhone}
            >
              <Send className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
