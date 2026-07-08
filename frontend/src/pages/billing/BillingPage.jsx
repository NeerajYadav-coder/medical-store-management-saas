/**
 * BillingPage - Cash Register POS Billing Screen
 * Styled to match the project's native theme (light and dark mode support)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Minus, Trash2, Receipt, Printer,
  Send, CreditCard, Banknote, Smartphone, ShoppingCart,
  AlertCircle, CheckCircle, User, Stethoscope, Clock, Loader2,
  Camera, Mic, Wifi, WifiOff, Zap, Settings, LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../../components/ui/Button';
import SymptomSelector from '../../components/billing/SymptomSelector';
import DoctorSelector from '../../components/billing/DoctorSelector';
import CustomerSelector from '../../components/billing/CustomerSelector';
import medicineApi from '../../api/medicine.api';
import customerApi from '../../api/customer.api';
import doctorApi from '../../api/doctor.api';
import symptomApi from '../../api/symptom.api';
import saleApi from '../../api/sale.api';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { initDB, saveBulk, getAllItems, saveItem, deleteItem, getItem } from '../../utils/db';
import toast from 'react-hot-toast';

// Payment mode options matching native look
const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash', icon: Banknote, color: 'text-success-600 bg-success-50 dark:bg-success-950/20' },
  { value: 'UPI', label: 'UPI', icon: Smartphone, color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/20' },
  { value: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
  { value: 'CREDIT', label: 'Credit', icon: Receipt, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' },
];

export default function BillingPage() {
  const { user, logout } = useAuth();
  const { store, storeName, storeAddress, storePhone, drugLicense, gstNumber } = useStore();
  const searchInputRef = useRef(null);
  const customerInputRef = useRef(null);
  const doctorInputRef = useRef(null);
  const symptomInputRef = useRef(null);
  const paymentRef = useRef(null);
  const checkoutBtnRef = useRef(null);
  const cartRef = useRef(null);
  const searchRef = useRef(null);
  const videoRef = useRef(null);
  
  const [focusedCartIndex, setFocusedCartIndex] = useState(-1);

  // Connection & Offline states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localMedicines, setLocalMedicines] = useState([]);
  const [localCustomers, setLocalCustomers] = useState([]);
  const [localDoctors, setLocalDoctors] = useState([]);
  const [localSymptoms, setLocalSymptoms] = useState([]);
  const [localSettings, setLocalSettings] = useState({
    speedMode: false,
    autoConnectPrinter: true,
    autoConnectScanner: true,
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountType, setDiscountType] = useState('FLAT');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [focusedMedicineIndex, setFocusedMedicineIndex] = useState(-1);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Quantities selection dialog
  const [qtyModal, setQtyModal] = useState(null);
  const qtyInputRef = useRef(null);

  // Sync / Offline handler
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored. Syncing...');
      syncOfflineSales();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Working offline. Billing is still active.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Preload and initialize everything on mount
  useEffect(() => {
    preloadEverything();
    generateBillNumber();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 400);
  }, []);

  // Sync offline sales queue
  const syncOfflineSales = async () => {
    try {
      const pending = await getAllItems('pendingSales');
      if (pending.length === 0) return;

      toast.loading(`Syncing ${pending.length} offline sale(s)...`, { id: 'sync-sales' });

      for (const sale of pending) {
        const { id, ...saleData } = sale;
        try {
          await saleApi.create(saleData);
          await deleteItem('pendingSales', id);
        } catch (err) {
          const isValidation = err.response && err.response.status >= 400 && err.response.status < 500;
          if (isValidation) {
            console.error('Validation failed for offline sale, dropping to prevent queue blocking:', err);
            await deleteItem('pendingSales', id);
          } else {
            throw err; // Network issue, abort the rest of the loop
          }
        }
      }
      toast.success('Offline sales successfully synced with cloud!', { id: 'sync-sales' });
    } catch (error) {
      console.error('Failed to sync offline sales:', error);
      toast.error('Failed to sync offline sales', { id: 'sync-sales' });
    }
  };

  // Preload local cache
  const preloadEverything = async () => {
    setLoadingMedicines(true);
    try {
      await initDB();

      // Load settings
      const speedModeSetting = await getItem('settings', 'speedMode');
      if (speedModeSetting) {
        setLocalSettings(prev => ({ ...prev, speedMode: speedModeSetting.value }));
      }

      if (navigator.onLine) {
        // Fetch medicines
        const medsRes = await medicineApi.getAll({ limit: 10000 });
        const meds = Array.isArray(medsRes) ? medsRes : (medsRes?.data || []);
        await saveBulk('medicines', meds);
        setLocalMedicines(meds);

        // Fetch customers
        const custsRes = await customerApi.getAll({ limit: 10000 });
        const custs = Array.isArray(custsRes) ? custsRes : (custsRes?.data || []);
        await saveBulk('customers', custs);
        setLocalCustomers(custs);

        // Fetch doctors
        const docsRes = await doctorApi.getAll({ limit: 10000 });
        const docs = Array.isArray(docsRes) ? docsRes : (docsRes?.data || []);
        setLocalDoctors(docs);

        // Fetch symptoms
        const symsRes = await symptomApi.getAll();
        const syms = Array.isArray(symsRes) ? symsRes : (symsRes?.data || []);
        setLocalSymptoms(syms);

        // Save timestamp
        await saveItem('settings', { key: 'lastLoaded', value: Date.now() });
        syncOfflineSales();
      } else {
        // Load offline
        const meds = await getAllItems('medicines');
        const custs = await getAllItems('customers');
        setLocalMedicines(meds);
        setLocalCustomers(custs);
      }
    } catch (err) {
      if (!err?.isCancelled) {
        console.error('Preload error:', err);
      }
      const meds = await getAllItems('medicines');
      const custs = await getAllItems('customers');
      setLocalMedicines(meds);
      setLocalCustomers(custs);
    } finally {
      setLoadingMedicines(false);
    }
  };

  // Generate bill number
  const generateBillNumber = async () => {
    try {
      if (navigator.onLine) {
        const response = await saleApi.generateBillNumber();
        setBillNumber(response?.billNumber || response?.data?.billNumber || generateLocalBillNumber());
      } else {
        setBillNumber(generateLocalBillNumber());
      }
    } catch (error) {
      setBillNumber(generateLocalBillNumber());
    }
  };

  const generateLocalBillNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `OFF-${date}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
  };

  // Local Smart Search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const query = searchQuery.trim().toLowerCase();
      const results = localSmartSearch(query);
      setSearchResults(results);
      setShowResults(true);
      setFocusedMedicineIndex(0);
    } else {
      setSearchResults([]);
      setFocusedMedicineIndex(-1);
    }
  }, [searchQuery]);

  const localSmartSearch = (query) => {
    if (!query) return [];
    const words = query.split(/\s+/).filter(Boolean);
    const results = [];

    for (const medicine of localMedicines) {
      const name = (medicine.name || '').toLowerCase();
      const genericName = (medicine.genericName || '').toLowerCase();
      const manufacturer = (medicine.manufacturer || '').toLowerCase();
      const dosage = (medicine.dosage || '').toLowerCase();
      const form = (medicine.form || '').toLowerCase();

      const isMatch = words.every(word =>
        name.includes(word) ||
        genericName.includes(word) ||
        manufacturer.includes(word) ||
        dosage.includes(word) ||
        form.includes(word)
      );

      if (isMatch) {
        const activeBatches = medicine.batches?.filter(b => b.quantityRemaining > 0 && new Date(b.expiryDate) > new Date()) || [];
        if (activeBatches.length > 0) {
          for (const batch of activeBatches) {
            results.push({
              _id: medicine._id,
              name: medicine.name,
              genericName: medicine.genericName,
              dosage: medicine.dosage,
              form: medicine.form,
              manufacturer: medicine.manufacturer,
              gstRate: medicine.gstRate,
              batchId: batch._id,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              mrp: batch.mrp,
              sellingPrice: batch.sellingPrice,
              purchasePrice: batch.purchasePrice,
              availableQty: batch.quantityRemaining,
            });
          }
        } else {
          results.push({
            _id: medicine._id,
            name: medicine.name,
            genericName: medicine.genericName,
            dosage: medicine.dosage,
            form: medicine.form,
            manufacturer: medicine.manufacturer,
            gstRate: medicine.gstRate,
            batchId: 'OUT_OF_STOCK',
            batchNumber: 'N/A',
            expiryDate: new Date(),
            mrp: medicine.defaultMRP || 0,
            sellingPrice: medicine.defaultSellingPrice || 0,
            purchasePrice: 0,
            availableQty: 0,
          });
        }
      }
    }
    return results.slice(0, 15);
  };

  // Keyboard navigation for search dropdown
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      
      // SMART CHECKOUT: If search is empty and cart has items, process the sale
      if (!query && cartItems.length > 0 && !showResults) {
        if (!paymentMethod) {
          paymentRef.current?.focus();
        } else {
          processSale();
        }
        return;
      }

      const handled = handleBarcodeOrSearchEnter(query);
      if (handled) return;

      const idx = focusedMedicineIndex >= 0 ? focusedMedicineIndex : 0;
      if (searchResults[idx]) {
        openQtyModal(searchResults[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!searchQuery && searchResults.length === 0) {
        customerInputRef.current?.focus();
        return;
      }
      setFocusedMedicineIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedMedicineIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'ArrowRight') {
      if (!searchQuery && cartItems.length > 0) {
        e.preventDefault();
        setFocusedCartIndex(0);
        cartRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSearchQuery('');
    }
  };

  // Barcode keyboard behavior
  const handleBarcodeOrSearchEnter = (searchValue) => {
    if (!searchValue) return false;
    const query = searchValue.trim().toLowerCase();

    let matchedBatch = null;
    let parentMedicine = null;

    for (const med of localMedicines) {
      if (med.barcode && med.barcode.toLowerCase() === query) {
        const activeBatch = med.batches?.find(b => b.quantityRemaining > 0 && new Date(b.expiryDate) > new Date());
        if (activeBatch) {
          matchedBatch = activeBatch;
          parentMedicine = med;
          break;
        }
      }
      const batch = med.batches?.find(b => b.batchNumber.toLowerCase() === query && b.quantityRemaining > 0 && new Date(b.expiryDate) > new Date());
      if (batch) {
        matchedBatch = batch;
        parentMedicine = med;
        break;
      }
    }

    if (matchedBatch && parentMedicine) {
      addToCartFromLocal(parentMedicine, matchedBatch);
      setSearchQuery('');
      setShowResults(false);
      return true;
    }

    const results = localSmartSearch(query);
    if (results.length === 1 && results[0].batchId !== 'OUT_OF_STOCK') {
      const item = results[0];
      const med = localMedicines.find(m => m._id === item._id);
      const batch = med?.batches?.find(b => b._id === item.batchId);
      if (med && batch) {
        addToCartFromLocal(med, batch);
        setSearchQuery('');
        setShowResults(false);
        return true;
      }
    }
    return false;
  };

  // Construct item object and open qty modal instead of adding directly
  const addToCartFromLocal = (medicine, batch) => {
    const item = {
      _id: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName,
      dosage: medicine.dosage || '',
      form: medicine.form || '',
      manufacturer: medicine.manufacturer || '',
      gstRate: medicine.gstRate || 12,
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      mrp: batch.mrp,
      sellingPrice: batch.sellingPrice,
      purchasePrice: batch.purchasePrice,
      availableQty: batch.quantityRemaining,
    };
    openQtyModal(item);
  };

  // Quantity modal confirm
  const confirmQtyModal = () => {
    if (!qtyModal) return;
    const { medicine, qty } = qtyModal;
    const parsedQty = parseInt(qty, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (parsedQty > medicine.availableQty) {
      toast.error(`Only ${medicine.availableQty} available`);
      return;
    }

    const existingIndex = cartItems.findIndex(
      item => item.medicineId === medicine._id && item.batchId === medicine.batchId
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity = parsedQty;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        medicineId: medicine._id,
        medicineName: medicine.name,
        medicineDosage: medicine.dosage,
        medicineForm: medicine.form,
        batchId: medicine.batchId,
        batchNumber: medicine.batchNumber,
        expiryDate: medicine.expiryDate,
        quantity: parsedQty,
        availableQty: medicine.availableQty,
        mrp: medicine.mrp,
        sellingPrice: medicine.sellingPrice,
        purchasePrice: medicine.purchasePrice,
        gstRate: medicine.gstRate || 12,
        discountPercent: 0,
      }]);
    }

    setLastBill(null);
    setQtyModal(null);
    setSearchQuery('');
    setShowResults(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const openQtyModal = (item) => {
    if (item.availableQty <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }
    
    const existingIndex = cartItems.findIndex(
      cartItem => cartItem.medicineId === item._id && cartItem.batchId === item.batchId
    );
    
    const defaultQty = existingIndex >= 0 ? cartItems[existingIndex].quantity + 1 : 1;
    const safeQty = Math.min(defaultQty, item.availableQty);

    setQtyModal({ medicine: item, qty: safeQty });
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  const updateQuantity = (index, newQty) => {
    if (newQty === '') {
      setCartItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity: '' };
        return updated;
      });
      return;
    }
    
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return;
    
    setCartItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (qty > item.availableQty) {
        toast.error(`Only ${item.availableQty} available in stock`);
        return prev;
      }
      updated[index] = { ...item, quantity: qty };
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCartItems(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Update local stocks on local checkout
  const updateLocalStocks = (items) => {
    setLocalMedicines(prevMeds => {
      const updated = [...prevMeds];
      items.forEach(item => {
        const medIndex = updated.findIndex(m => m._id === item.medicineId);
        if (medIndex >= 0) {
          const med = { ...updated[medIndex] };
          if (med.batches) {
            med.batches = [...med.batches];
            const batchIndex = med.batches.findIndex(b => b._id === item.batchId);
            if (batchIndex >= 0) {
              med.batches[batchIndex] = { ...med.batches[batchIndex] };
              med.batches[batchIndex].quantityRemaining -= item.quantity;
              med.availableQty -= item.quantity;
            }
          }
          updated[medIndex] = med;
          saveItem('medicines', med);
        }
      });
      return updated;
    });
  };

  // Checkout process
  const processSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);
    const currentTotals = calculateTotals();
    const saleData = {
      billNumber,
      customerName: customer?.customerName || 'Walk-in Customer',
      customerPhone: customer?.customerPhone || '',
      customerId: customer?.customerId?.startsWith('temp_') ? null : customer?.customerId || null,
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

    const isSpeedMode = localSettings.speedMode;

    if (isSpeedMode) {
      printDirectly({
        ...saleData,
        createdAt: new Date().toISOString(),
      });

      (async () => {
        try {
          if (navigator.onLine) {
            await saleApi.create(saleData);
            updateLocalStocks(saleData.items);
          } else {
            await saveItem('pendingSales', saleData);
            updateLocalStocks(saleData.items);
          }
        } catch (err) {
          console.error('Speed mode background sync error:', err);
          // Only save to pending if it's a network/server issue, NOT a 4xx validation error.
          const isValidationError = err.response && err.response.status >= 400 && err.response.status < 500;
          if (!isValidationError) {
             await saveItem('pendingSales', saleData);
             toast.error('Network error. Saved offline for later sync.');
          } else {
             toast.error(`CRITICAL: Background sync failed due to validation: ${err.message}`, { duration: 10000 });
          }
        }
      })();

      toast.success('Sale processed instantly! Ready for next barcode scan.', { duration: 2500 });
      resetForm();
      generateBillNumber();
      setProcessing(false);
      setTimeout(() => searchInputRef.current?.focus(), 100);
      return;
    }

    try {
      let billData;
      if (navigator.onLine) {
        const response = await saleApi.create(saleData);
        billData = response?.data || response;
        updateLocalStocks(saleData.items);
      } else {
        await saveItem('pendingSales', saleData);
        billData = {
          ...saleData,
          createdAt: new Date().toISOString(),
        };
        updateLocalStocks(saleData.items);
      }

      setLastBill(billData);
      toast.success(`Sale Completed! Bill #${billData.billNumber} generated.`);

      if (localSettings.autoConnectPrinter) {
        printDirectly(billData);
      }

      resetForm();
      generateBillNumber();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error?.message || 'Failed to process sale');
    } finally {
      setProcessing(false);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const resetForm = (clearLastBill = false) => {
    setCartItems([]);
    setCustomer(null);
    setDoctor(null);
    setSymptoms([]);
    setPaymentMethod('');
    setFocusedCartIndex(-1);
    setDiscountValue(0);
    setDiscountReason('');
    setNotes('');
    setSearchQuery('');
    if (clearLastBill) {
      setLastBill(null);
    }
  };

  // Hidden Iframe Printer Integration
  const printDirectly = (bill) => {
    const escapeHtml = (unsafe) => {
      if (!unsafe) return '';
      return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    const storeNamePrint = escapeHtml(storeName || 'Medical Store');
    const storeAddressPrint = escapeHtml(storeAddress || '');
    const storePhonePrint = escapeHtml(storePhone || '');
    const dlNumberPrint = escapeHtml(drugLicense || '');
    const gstNumberPrint = escapeHtml(gstNumber || '');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.write(`
      <html>
        <head>
          <title>POS Receipt</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              margin: 0;
              padding: 8px;
              width: 80mm;
              font-size: 11px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .store-name { font-size: 15px; font-weight: bold; margin: 0 0 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { border-bottom: 1px dashed #000; padding: 4px 0; }
            td { padding: 4px 0; }
            .grand-total { font-size: 12px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h1 class="store-name">${storeNamePrint}</h1>
            <p style="margin: 2px 0;">${storeAddressPrint}</p>
            ${storePhonePrint ? `<p style="margin: 2px 0;">Phone: ${storePhonePrint}</p>` : ''}
            ${dlNumberPrint ? `<p style="margin: 2px 0;">DL: ${dlNumberPrint}</p>` : ''}
            ${gstNumberPrint ? `<p style="margin: 2px 0;">GSTIN: ${gstNumberPrint}</p>` : ''}
          </div>
          <div class="divider"></div>
          <div>
            <p style="margin: 2px 0;">Bill No: ${escapeHtml(bill.billNumber)}</p>
            <p style="margin: 2px 0;">Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}</p>
            <p style="margin: 2px 0;">Customer: ${escapeHtml(bill.customerName)}</p>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>${escapeHtml(item.medicineName)}</td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">₹${item.sellingPrice}</td>
                  <td style="text-align: right;">₹${item.quantity * item.sellingPrice}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${bill.subtotal}</td>
            </tr>
            ${bill.discountAmount > 0 ? `
              <tr>
                <td>Discount</td>
                <td style="text-align: right;">-₹${bill.discountAmount}</td>
              </tr>
            ` : ''}
            ${bill.totalGst > 0 ? `
              <tr>
                <td>GST</td>
                <td style="text-align: right;">₹${bill.totalGst}</td>
              </tr>
            ` : ''}
            <tr class="grand-total">
              <td>Total</td>
              <td style="text-align: right;">₹${bill.grandTotal}</td>
            </tr>
          </table>
          <div class="divider"></div>
          <div class="text-center" style="margin-top: 10px;">
            <p style="margin: 0; font-weight: bold;">दवाई भी, दुआ भी — स्वस्थ रहें, खुश रहें!</p>
            <p style="margin: 2px 0; font-size: 9px; font-style: italic;">Thank you. Get well soon!</p>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  const handlePrint = () => {
    if (lastBill) {
      printDirectly(lastBill);
    }
  };

  // Background clicking auto-refocuses barcode scanner
  const handleBackgroundClick = (e) => {
    const tagName = e.target.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'button' && tagName !== 'select' && tagName !== 'textarea' && !e.target.closest('button') && !e.target.closest('a')) {
      searchInputRef.current?.focus();
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        resetForm(true);
        generateBillNumber();
        toast.success('New sale register reset completed.');
      } else if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        const modes = ['cash', 'upi', 'card', 'credit'];
        const nextIdx = (modes.indexOf(paymentMethod) + 1) % modes.length;
        setPaymentMethod(modes[nextIdx]);
        toast.success(`Payment Method: ${modes[nextIdx].toUpperCase()}`, { id: 'payment-cycle', duration: 1000 });
      } else if (e.key === 'Enter' && showSuccessModal && lastBill) {
        e.preventDefault();
        printDirectly(lastBill);
        setShowSuccessModal(false);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        setQtyModal(null);
        setShowSuccessModal(false);
        setCameraOpen(false);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [paymentMethod]);

  // Voice recognition
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice transcription not supported by this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    toast.loading('Listening... Speak medicine name.', { id: 'voice-speech' });
    recognition.start();

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      toast.success(`Voice input: "${speechToText}"`, { id: 'voice-speech' });
      setSearchQuery(speechToText);
      searchInputRef.current?.focus();
    };

    recognition.onerror = () => {
      toast.error('Voice search failed. Try again.', { id: 'voice-speech' });
    };
  };

  // Camera Barcode Scanning Backup
  const startCamera = async () => {
    setCameraOpen(true);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera stream access failure:', err);
        toast.error('Failed to access camera.');
      }
    }, 150);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraOpen(false);
  };

  const simulateCameraScan = (barcode) => {
    stopCamera();
    handleBarcodeOrSearchEnter(barcode);
  };

  // Totals calculations
  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let totalCost = 0;
    let totalGst = 0;
    let itemDiscountAmount = 0;

    const hasGst = !!gstNumber;

    cartItems.forEach(item => {
      const itemSubtotal = item.quantity * item.sellingPrice;
      const itemDisc = (itemSubtotal * (item.discountPercent || 0)) / 100;
      const taxable = itemSubtotal - itemDisc;
      const gst = hasGst ? ((taxable * (item.gstRate || 12)) / 100) : 0;

      subtotal += itemSubtotal;
      itemDiscountAmount += itemDisc;
      totalGst += gst;
      totalCost += item.quantity * (item.purchasePrice || 0);
    });

    let billDiscount = 0;
    if (discountType === 'PERCENTAGE') {
      billDiscount = (subtotal * discountValue) / 100;
    } else if (discountType === 'FLAT') {
      billDiscount = Math.min(subtotal, discountValue);
    }

    const totalDiscount = itemDiscountAmount + billDiscount;
    const taxableAmount = subtotal - totalDiscount;

    const gstScalingFactor = taxableAmount / (subtotal - itemDiscountAmount || 1);
    const finalGst = hasGst ? (totalGst * Math.max(0, gstScalingFactor)) : 0;

    const grandTotal = hasGst ? Math.round(taxableAmount + finalGst) : Math.round(taxableAmount);
    const roundOff = grandTotal - (taxableAmount + finalGst);

    const grossProfit = subtotal - totalCost;
    const netProfit = grossProfit - totalDiscount;

    return {
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
  }, [cartItems, discountType, discountValue, gstNumber]);

  const totals = calculateTotals();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSpeedModeToggle = async () => {
    const newSpeedVal = !localSettings.speedMode;
    setLocalSettings(prev => ({ ...prev, speedMode: newSpeedVal }));
    await saveItem('settings', { key: 'speedMode', value: newSpeedVal });
    toast.success(newSpeedVal ? 'Speed Mode Enabled ⚡' : 'Speed Mode Disabled');
  };

  return (
    <div 
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans select-none overflow-hidden"
      onClick={handleBackgroundClick}
    >
      {/* Immersive Billing Top Bar */}
      <header className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-[10px] sm:text-base tracking-wider text-emerald-600 dark:text-emerald-400 hidden min-[400px]:inline">🟢 Ready</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Connection status indicator */}
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Cloud Synced">
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Synced</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 animate-pulse" title="Offline Mode (Saving Locally)">
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>
        </div>

        {/* Center title area */}
        <div className="text-center hidden lg:block">
          <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{storeName}</span>
          <span className="text-xs text-gray-500 ml-2">Bill No: #{billNumber}</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <button
            onClick={handleSpeedModeToggle}
            className={cn(
              "px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer",
              localSettings.speedMode 
                ? "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
            title="Speed Mode (⚡)"
          >
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
            <span className="hidden sm:inline">Speed Mode</span>
          </button>

          <div className="text-[10px] sm:text-xs font-mono font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950 px-2 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {user?.role === 'OWNER' && (
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="p-1.5 sm:p-2 bg-gray-105 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-250 dark:border-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
              title="Dashboard Home"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}

          <button
            onClick={logout}
            className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-900 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </header>

      {/* Main Billing Grid Workspace */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr] overflow-y-auto lg:overflow-hidden bg-gray-50 dark:bg-gray-950">
        
        {/* Left Hand side inputs & forms */}
        <div className="flex flex-col lg:overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 bg-transparent shrink-0">
          
          <div className="relative" ref={searchRef}>
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode or type medicine name... (F4)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 sm:pl-12 pr-20 sm:pr-28 py-3 sm:py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-sm sm:text-base font-medium shadow-sm transition-all"
            />
            {/* Action buttons (Camera, Voice) inside input */}
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={startVoiceSearch}
                className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-brand-400 text-gray-500 dark:text-gray-400 rounded-xl transition-colors cursor-pointer"
                title="Voice Search"
              >
                <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-brand-400 text-gray-500 dark:text-gray-400 rounded-xl transition-colors cursor-pointer"
                title="Camera Scanner Backup"
              >
                <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Smart Search Dropdown */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl max-h-[35vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No matching medicine in local cache
                  </div>
                ) : (
                  searchResults.map((medicine, idx) => (
                    <button
                      key={`${medicine._id}-${medicine.batchId}`}
                      type="button"
                      onClick={() => openQtyModal(medicine)}
                      disabled={medicine.availableQty <= 0 && medicine.batchId !== 'OUT_OF_STOCK'}
                      className={cn(
                        "w-full flex items-center justify-between p-4 transition-colors text-left cursor-pointer",
                        idx === focusedMedicineIndex
                          ? "bg-brand-50 dark:bg-brand-900/30 border-l-4 border-brand-600"
                          : ""
                      )}
                    >
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm capitalize">
                          {medicine.name} {medicine.dosage}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          Batch: {medicine.batchNumber} · Exp: {new Date(medicine.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                          {formatCurrency(medicine.sellingPrice)}
                        </p>
                        <p className={cn("text-[10px] font-bold mt-1", medicine.availableQty > 0 ? "text-gray-500 dark:text-gray-400" : "text-red-500")}>
                          Stock: {medicine.availableQty}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Details Inputs (Customer, Doctor, Symptoms) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomerSelector
              selected={customer}
              onChange={setCustomer}
              inputRef={customerInputRef}
              localCustomers={localCustomers}
              onQuickCreate={(newCust) => setLocalCustomers(prev => [newCust, ...prev])}
              onAfterSelect={() => doctorInputRef.current?.focus()}
              onBeforeSelect={() => searchInputRef.current?.focus()}
            />
            <DoctorSelector
              selected={doctor}
              onChange={setDoctor}
              inputRef={doctorInputRef}
              onAfterSelect={() => symptomInputRef.current?.focus()}
              onBeforeSelect={() => customerInputRef.current?.focus()}
            />
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <SymptomSelector
              selected={symptoms}
              onChange={setSymptoms}
              inputRef={symptomInputRef}
              onAfterSelect={() => paymentRef.current?.focus()}
              onBeforeSelect={() => doctorInputRef.current?.focus()}
            />
          </div>

          {/* Checkout billing configuration inputs */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-105 dark:border-gray-800 pb-3">
              <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Checkout Options</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Flat Discount (₹)</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => {
                    setDiscountType('FLAT');
                    setDiscountValue(parseFloat(e.target.value) || 0);
                  }}
                  placeholder="0"
                  className="w-28 text-right pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  min="0"
                />
              </div>
            </div>

            {/* Indian localized GST components */}
            {gstNumber && (
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Taxable Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totals.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Total GST (12%)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totals.totalGst)}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right side: Real Time Transaction Cart & Checkout */}
        <div className="flex flex-col bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 lg:overflow-hidden lg:h-full shrink-0">
          {/* Cart Header */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-50 dark:bg-brand-950/20 text-brand-600 rounded-xl flex items-center justify-center border border-brand-100 dark:border-brand-900/30">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-gray-900 dark:text-white text-base">Cart</h2>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{cartItems.length} items scanned</p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="text-xs font-extrabold text-red-650 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30 transition-all cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Scroll Items */}
          <div 
            className="flex-1 lg:overflow-y-auto p-4 lg:p-6 space-y-3 bg-gray-50/30 dark:bg-transparent outline-none focus:bg-gray-100/50 dark:focus:bg-gray-900/20 transition-colors"
            ref={cartRef}
            tabIndex={0}
            onKeyDown={(e) => {
              if (cartItems.length === 0) return;
              const currentItem = cartItems[focusedCartIndex];
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedCartIndex(prev => Math.min(prev + 1, cartItems.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedCartIndex(prev => Math.max(prev - 1, 0));
              } else if (e.key === 'ArrowRight' || e.key === '+' || e.key === '=') {
                e.preventDefault();
                if (currentItem) updateQuantity(focusedCartIndex, currentItem.quantity + 1);
              } else if (e.key === 'ArrowLeft' || e.key === '-') {
                e.preventDefault();
                if (currentItem) updateQuantity(focusedCartIndex, currentItem.quantity - 1);
              } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                if (currentItem) {
                  removeFromCart(focusedCartIndex);
                  setFocusedCartIndex(prev => Math.min(prev, Math.max(0, cartItems.length - 2)));
                  if (cartItems.length === 1) searchInputRef.current?.focus();
                }
              } else if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                setFocusedCartIndex(-1);
                searchInputRef.current?.focus();
              }
            }}
          >
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-650 py-12">
                <div className="h-16 w-16 bg-white dark:bg-gray-950 rounded-2xl flex items-center justify-center mb-4 border border-gray-150 dark:border-gray-800">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Cart (empty)</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ready for barcode scans...</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={`${item.medicineId}-${item.batchId}`}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-950 border rounded-2xl transition-all",
                    index === focusedCartIndex
                      ? "border-brand-500 shadow-md ring-2 ring-brand-500/20"
                      : "border-gray-200 dark:border-gray-800 hover:border-brand-500/30"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate capitalize">{item.medicineName} {item.medicineDosage}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Batch: {item.batchNumber} · Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <span className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 w-8 sm:w-10 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="min-w-[70px] text-right text-sm sm:text-base font-extrabold text-gray-900 dark:text-white shrink-0">
                        {formatCurrency(item.quantity * item.sellingPrice)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Large Payment Options */}
          <div 
            className="p-6 bg-white dark:bg-gray-950 border-t border-gray-250 dark:border-gray-800 space-y-4 shrink-0 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-900/50 transition-colors rounded-xl"
            ref={paymentRef}
            tabIndex={0}
            onKeyDown={(e) => {
              const modes = ['cash', 'upi', 'card', 'credit'];
              const currentIdx = modes.indexOf(paymentMethod);
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                setPaymentMethod(modes[Math.min(currentIdx + 1, modes.length - 1)]);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setPaymentMethod(modes[Math.max(currentIdx - 1, 0)]);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                symptomInputRef.current?.focus();
              } else if (e.key === 'Enter') {
                e.preventDefault();
                // If they hit enter on payment section but haven't selected one yet, default to cash if they just hit enter?
                // Wait, if they are navigating with arrows, paymentMethod is set. If they just hit enter, they might want to select the first one.
                if (!paymentMethod) {
                  setPaymentMethod('cash');
                } else if (cartItems.length > 0) {
                  processSale();
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                checkoutBtnRef.current?.focus();
              }
            }}
          >
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Payment Method (F8)</span>
            <div className="grid grid-cols-4 gap-3">
              {PAYMENT_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = paymentMethod === mode.value.toLowerCase();
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setPaymentMethod(mode.value.toLowerCase())}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-xl border text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-brand-650 border-brand-700 text-white font-black shadow-lg shadow-brand-600/10"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Massive Checkout Pane */}
          <div className="p-4 lg:p-6 bg-white dark:bg-gray-950 border-t border-gray-250 dark:border-gray-800 space-y-4 shrink-0 shadow-2xl sticky bottom-0 z-10 lg:static">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-450 dark:text-gray-400">Total Amount Due</span>
              <span className="text-3xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(totals.grandTotal)}</span>
            </div>

            <button
              ref={checkoutBtnRef}
              onClick={processSale}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  paymentRef.current?.focus();
                }
              }}
              disabled={processing || cartItems.length === 0 || !paymentMethod}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer focus:ring-4 focus:ring-brand-500/30"
            >
              {processing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Receipt className="h-6 w-6" />
              )}
              COMPLETE SALE (Enter)
            </button>

            {/* Reprint actions */}
            <div className="flex gap-3 text-xs font-bold pt-2">
              <button
                onClick={handlePrint}
                disabled={!lastBill || cartItems.length > 0}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-850 disabled:opacity-30 rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Reprint Last Bill
              </button>
              <button
                onClick={() => {
                  if (!lastBill) return;
                  const text = `Hi ${lastBill.customerName}, your receipt from ${storeName} is ready. Amount: ${formatCurrency(lastBill.grandTotal)}.`;
                  window.open(`https://wa.me/${lastBill.customerPhone}?text=${encodeURIComponent(text)}`);
                }}
                disabled={!lastBill || !lastBill.customerPhone || cartItems.length > 0}
                className="flex-1 py-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 disabled:opacity-30 rounded-xl flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
                WhatsApp Receipt
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Quantity Modal Dialog */}
      {qtyModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-slate-950/80 backdrop-blur-md"
          onClick={() => { setQtyModal(null); searchInputRef.current?.focus(); }}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4 text-gray-900 dark:text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-1">Add Medicine</p>
            <h3 className="text-lg font-black text-gray-900 dark:text-white capitalize mb-1">
              {qtyModal.medicine.name} {qtyModal.medicine.dosage}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Batch: {qtyModal.medicine.batchNumber} · Available: {qtyModal.medicine.availableQty} · price: ₹{qtyModal.medicine.sellingPrice}
            </p>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              Quantity:
            </label>
            <input
              ref={qtyInputRef}
              type="number"
              min="1"
              max={qtyModal.medicine.availableQty}
              value={qtyModal.qty}
              onChange={e => setQtyModal(prev => ({ ...prev, qty: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirmQtyModal(); }
                if (e.key === 'Escape') { setQtyModal(null); searchInputRef.current?.focus(); }
              }}
              className="w-full text-3xl sm:text-4xl font-extrabold text-center py-3 sm:py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-brand-500 focus:outline-none rounded-2xl text-gray-900 dark:text-white mb-4 sm:mb-6"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => { setQtyModal(null); searchInputRef.current?.focus(); }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-805 text-sm font-semibold rounded-xl text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={confirmQtyModal}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Add ↵
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Backup Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 dark:bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden w-full max-w-md">
            <div className="p-4 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Camera className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Device Camera Scanner
              </span>
              <button onClick={stopCamera} className="text-gray-700 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg cursor-pointer">
                Close
              </button>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover"></video>
              <div className="absolute inset-8 border-2 border-brand-500/40 rounded-xl pointer-events-none"></div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 space-y-3">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block text-center">Place barcode inside the square to scan.</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulateCameraScan('BT7432')}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs rounded-xl font-bold text-gray-700 dark:text-slate-350 cursor-pointer"
                >
                  Scan Demo Batch (BT7432)
                </button>
                <button
                  onClick={() => simulateCameraScan('CRO-2026')}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs rounded-xl font-bold text-gray-700 dark:text-slate-350 cursor-pointer"
                >
                  Scan Demo Barcode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
