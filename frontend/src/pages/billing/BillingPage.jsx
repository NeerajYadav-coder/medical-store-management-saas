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
      // axios interceptor does NOT unwrap this response since it has no 'data' key
      // response = { success: true, billNumber: '...' }
      const response = await saleApi.generateBillNumber();
      setBillNumber(response?.billNumber || response?.data?.billNumber || generateLocalBillNumber());
    } catch (error) {
      setBillNumber(generateLocalBillNumber());
    }
  };

  const generateLocalBillNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${date}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
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
      // axios interceptor unwraps { success, data: [...] } → returns the array directly
      const response = await medicineApi.searchWithStock(searchQuery);
      const results = Array.isArray(response) ? response : (response?.data || []);
      setSearchResults(results);
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
    if (medicine.availableQty <= 0) {
      toast.error(`${medicine.name} is out of stock`);
      return;
    }

    // Check if item exists in cart
    const existingIndex = cartItems.findIndex(
      item => item.medicineId === medicine._id && item.batchId === medicine.batchId
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
        customerId: customer?.customerId || null,
        doctorId: doctor?.doctorId || null,
        doctorName: doctor?.doctorName || '',
        isPrescribed: !!doctor,
        symptoms: symptoms || [],
        isRepeatCustomer: customer?.isRepeatBuyer || false,

        items: cartItems.map(item => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          medicineDosage: item.medicineDosage || '',
          medicineForm: item.medicineForm || '',
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          purchasePrice: item.purchasePrice || 0,
          discountPercent: item.discountPercent || 0,
          gstRate: item.gstRate || 0,
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
      // axios unwraps { success, data } → response is the sale object with items
      const billData = response?.data || response;

      setLastBill(billData);
      setShowSuccessModal(true);
      toast.success(`Bill #${billData?.billNumber || billNumber} created!`);

      // Reset form
      resetForm();
      generateBillNumber(); // Generate new bill number for next sale
    } catch (error) {
      console.error('Sale error:', error);
      // error.message is standardized by the axios interceptor
      toast.error(error?.message || 'Failed to complete sale');
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
    setDiscountType('NONE');
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

  const handleQuickItemClick = async (item) => {
    if (item.name === 'paracetamol' || item.name === 'cough syrup') {
      const query = item.name;
      try {
        const response = await medicineApi.searchWithStock(query);
        const results = Array.isArray(response) ? response : (response?.data || []);
        if (results.length > 0) {
          addToCart(results[0]);
        } else {
          toast.error(`No stock available for ${query}`);
        }
      } catch (error) {
        console.error('Error adding quick item:', error);
      }
    } else {
      const matchMap = {
        'Headache': { _id: 'headache', displayName: 'Headache' },
        'Stomach Ache': { _id: 'stomach', displayName: 'Stomach' }
      };
      const match = matchMap[item.name];
      if (match) {
        const isSelected = symptoms.some(s => s.symptomId === match._id);
        if (isSelected) {
          setSymptoms(symptoms.filter(s => s.symptomId !== match._id));
        } else if (symptoms.length < 3) {
          setSymptoms([...symptoms, { symptomId: match._id, symptomName: match.displayName }]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
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

      {/* Header */}
      <header className="h-16 bg-white px-8 flex items-center justify-between shrink-0 border-b border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing (POS)</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={resetForm}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Sale
          </button>
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger-500 rounded-full animate-pulse" />
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-base shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'W'}
            </div>
            <div className="text-left leading-none">
              <p className="text-sm font-bold text-gray-800 capitalize">{user?.name || 'Weiyz'}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 grid grid-cols-[1.3fr_1.2fr_300px] gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
        
        {/* Column 1: Billing Inputs Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-full overflow-y-auto space-y-6">
          {/* Product Search */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-600" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode or search medicine by name / batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium shadow-sm transition-all"
            />
            {/* Search results dropdown */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[40vh] overflow-y-auto">
                {loadingMedicines ? (
                  <div className="p-6 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Searching stock...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No medicine found with available stock
                  </div>
                ) : (
                  searchResults.map((medicine) => (
                    <button
                      key={`${medicine._id}-${medicine.batchId}`}
                      type="button"
                      onClick={() => addToCart(medicine)}
                      disabled={medicine.availableQty <= 0}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 transition-colors border-b border-gray-50 last:border-0 text-left",
                        medicine.availableQty <= 0 ? "opacity-60 cursor-not-allowed bg-gray-50" : "hover:bg-brand-50"
                      )}
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {medicine.name} {medicine.dosage}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Batch: {medicine.batchNumber} · Exp: {new Date(medicine.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(medicine.sellingPrice)}
                        </p>
                        <p className="text-[10px] text-gray-500">Stock: {medicine.availableQty}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Customer Selection */}
          <CustomerSelector
            selected={customer}
            onChange={setCustomer}
          />

          {/* Doctor Selection */}
          <DoctorSelector
            selected={doctor}
            onChange={setDoctor}
          />

          {/* Symptom Selection */}
          <SymptomSelector
            selected={symptoms}
            onChange={setSymptoms}
          />

          <hr className="border-gray-100" />

          {/* Payment Summary */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
              Payment Summary
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Bill Discount</span>
                <div className="flex items-center gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="NONE">None</option>
                    <option value="PERCENTAGE">%</option>
                    <option value="FLAT">₹</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 text-right text-sm border-b border-gray-200 focus:border-brand-500 outline-none pb-0.5"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Taxable Amount</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(totals.taxableAmount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total GST (12%)</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(totals.totalGst)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-400 italic">
                <span>Round off</span>
                <span>{totals.roundOff > 0 ? '+' : ''}{totals.roundOff.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Transaction Cart Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50 shrink-0">
            <div className="h-10 w-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Transaction Cart</h2>
              <p className="text-xs text-gray-400">{cartItems.length} items added</p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded transition-all"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                  <ShoppingCart className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-600">Cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Search or scan items to add</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={`${item.medicineId}-${item.batchId}`}
                  className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-brand-200 transition-all group"
                >
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                    {item.medicineName.toLowerCase().includes('syrup') ? '🧪' : '💊'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate capitalize">{item.medicineName} {item.medicineDosage}</p>
                    <p className="text-[10px] text-gray-400">Batch: {item.batchNumber} · Exp: {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="min-w-[60px] text-right text-sm font-bold text-gray-900 shrink-0">
                    {formatCurrency(item.quantity * item.sellingPrice * (1 - item.discountPercent / 100))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Current Cart Total Row */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-center bg-gray-50/50 shrink-0">
            <span className="text-sm font-semibold text-gray-600">Current Cart Total: {formatCurrency(totals.subtotal - totals.totalDiscount)}</span>
          </div>

          {/* Checkout Area (Footer) */}
          <div className="p-4 bg-[#1e1b4b] text-white space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">GRAND TOTAL</span>
              <span className="text-3xl font-black text-white">{formatCurrency(totals.grandTotal)}</span>
            </div>

            {user?.role === 'OWNER' && totals.netProfit > 0 && (
              <div className="flex justify-between text-[11px] font-medium px-2.5 py-1.5 bg-white/10 rounded-lg">
                <span className="opacity-80">Estimated Profit</span>
                <span className="text-green-400">+{formatCurrency(totals.netProfit)}</span>
              </div>
            )}

            <button
              onClick={processSale}
              disabled={processing || cartItems.length === 0}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Receipt className="h-5 w-5" />
              )}
              Complete Sale
            </button>

            {/* Print & Whatsapp Action shortcuts */}
            <div className="flex gap-2 text-xs">
              <button
                onClick={handlePrint}
                disabled={!lastBill}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => {
                  if (!lastBill) return;
                  const text = `Hi ${lastBill.customerName}, your receipt from ${user?.medicalStoreId?.name || 'our pharmacy'} is ready. Amount: ${formatCurrency(lastBill.grandTotal)}.`;
                  window.open(`https://wa.me/${lastBill.customerPhone}?text=${encodeURIComponent(text)}`);
                }}
                disabled={!lastBill || !lastBill.customerPhone}
                className="flex-1 py-2 bg-green-600/40 hover:bg-green-600/60 disabled:opacity-30 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Quick Add Side Bar */}
        <div className="bg-[#f1f5f9] p-6 flex flex-col gap-4 overflow-y-auto rounded-2xl border border-gray-200 shadow-sm h-full">
          <div className="flex flex-col gap-3">
            {[
              { name: 'paracetamol', label: 'paracetamol', icon: '💊', color: 'bg-blue-100 text-blue-700' },
              { name: 'cough syrup', label: 'cough syrup', icon: '🧪', color: 'bg-red-100 text-red-700' },
              { name: 'Headache', label: 'Headache', icon: '💆', color: 'bg-yellow-100 text-yellow-700' },
              { name: 'Stomach Ache', label: 'Stomach Ache', icon: '🤢', color: 'bg-green-100 text-green-700' },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleQuickItemClick(item)}
                className="flex items-center gap-3 p-3 bg-white hover:bg-brand-50 border border-gray-200 hover:border-brand-300 rounded-xl transition-all shadow-sm group text-left"
              >
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-lg", item.color)}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-700 capitalize">
                    {item.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
