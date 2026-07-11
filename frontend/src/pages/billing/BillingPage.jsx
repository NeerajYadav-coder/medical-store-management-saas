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
import OfflineIndicator from '../../components/common/OfflineIndicator';
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
import { getImageUrl } from '../../utils/image';
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
  const { store, storeName, storeAddress, storePhone, drugLicense, gstNumber, storeOwner } = useStore();
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
  const [customerHistory, setCustomerHistory] = useState({ sales: [], itemsSummary: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
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

  // Fetch customer purchase history
  useEffect(() => {
    if (customer?.customerId && !customer.customerId.startsWith('temp_')) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await customerApi.getPurchaseHistory(customer.customerId);
          if (res?.success) {
            setCustomerHistory(res.data);
          } else {
            setCustomerHistory({ sales: [], itemsSummary: [] });
          }
        } catch (error) {
          console.error('Error fetching customer history:', error);
          setCustomerHistory({ sales: [], itemsSummary: [] });
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setCustomerHistory({ sales: [], itemsSummary: [] });
    }
  }, [customer]);

  const handleQuickAddFromHistory = (medicineId) => {
    const parentMedicine = localMedicines.find(m => m._id === medicineId);
    if (!parentMedicine) {
      toast.error('Medicine not found in local catalog');
      return;
    }
    // Find active batch with stock
    const activeBatch = parentMedicine.batches?.find(
      b => b.quantityRemaining > 0 && new Date(b.expiryDate) > new Date()
    );
    if (!activeBatch) {
      toast.error('This medicine is currently out of stock or expired');
      return;
    }
    addToCartFromLocal(parentMedicine, activeBatch);
  };

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
      // Auto-print removed: invoice is stored and available via "Reprint Last Bill"
      const speedBillData = { ...saleData, createdAt: new Date().toISOString() };
      setLastBill(speedBillData);

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
    const storeOwnerPrint = escapeHtml(storeOwner || '');
    const storeLogoPrint = store?.logo ? getImageUrl(store.logo) : '';

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
            ${storeLogoPrint ? `<img src="${storeLogoPrint}" alt="Logo" style="height: 40px; max-width: 120px; object-fit: contain; margin-bottom: 4px;" /><br/>` : ''}
            <h1 class="store-name">${storeNamePrint}</h1>
            ${storeOwnerPrint ? `<p style="margin: 2px 0; font-size: 10px; font-weight: bold;">Proprietor: ${storeOwnerPrint}</p>` : ''}
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
      className="flex flex-col h-screen bg-system-background text-label-primary font-sans select-none overflow-hidden"
      onClick={handleBackgroundClick}
    >
      {/* Immersive Billing Top Bar */}
      <header className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-3 bg-secondary-background/80 border-b border-separator-apple/10 backdrop-blur-md shrink-0 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-system-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-system-green"></span>
            </span>
            <span className="font-extrabold text-[10px] sm:text-base tracking-wider text-system-green hidden min-[400px]:inline">🟢 Ready</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-separator-apple/10"></div>

          {/* Connection status indicator */}
          <OfflineIndicator />
        </div>

        {/* Center title area */}
        <div className="text-center hidden lg:block">
          <span className="text-apple-subheadline font-semibold text-label-primary">{storeName}</span>
          <span className="text-apple-caption-1 text-label-secondary ml-2 font-mono">Bill No: #{billNumber}</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <button
            onClick={handleSpeedModeToggle}
            className={cn(
              "px-3 py-1.5 rounded-xl text-apple-footnote font-semibold transition-apple-micro active-apple-press flex items-center gap-1 border cursor-pointer",
              localSettings.speedMode 
                ? "bg-system-orange border-transparent text-white shadow-sm"
                : "bg-secondary-background border-separator-apple/10 text-label-secondary hover:text-label-primary"
            )}
            title="Speed Mode (⚡)"
          >
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
            <span className="hidden sm:inline">Speed Mode</span>
          </button>

          <div className="text-apple-footnote font-mono font-medium text-label-secondary bg-secondary-background px-3 py-1.5 rounded-xl border border-separator-apple/10">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {user?.role === 'OWNER' && (
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="p-1.5 sm:p-2 bg-secondary-background hover:bg-secondary-background/80 border border-separator-apple/10 rounded-lg transition-apple-micro active-apple-press text-label-secondary cursor-pointer"
              title="Dashboard Home"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}

          <button
            onClick={logout}
            className="p-1.5 sm:p-2 bg-secondary-background hover:bg-system-red/10 border border-separator-apple/10 hover:border-system-red/20 rounded-lg text-label-secondary hover:text-system-red transition-apple-micro active-apple-press cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </header>

      {/* Main Billing Grid Workspace */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr] overflow-y-auto lg:overflow-hidden bg-system-background">
        
        {/* Left Hand side inputs & forms */}
        <div className="flex flex-col lg:overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 bg-transparent shrink-0">
          
          <div className="relative" ref={searchRef}>
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-system-blue" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode or type medicine name... (F4)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 sm:pl-12 pr-20 sm:pr-28 py-3 sm:py-4 rounded-2xl border border-separator-apple/10 bg-secondary-background text-label-primary focus:outline-none focus:border-system-blue focus:ring-4 focus:ring-system-blue/10 text-sm sm:text-base font-medium transition-apple-micro"
            />
            {/* Action buttons (Camera, Voice) inside input */}
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={startVoiceSearch}
                className="p-1.5 sm:p-2 bg-secondary-background hover:text-system-blue hover:bg-system-blue/10 text-label-secondary rounded-xl transition-apple-micro active-apple-press cursor-pointer"
                title="Voice Search"
              >
                <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="p-1.5 sm:p-2 bg-secondary-background hover:text-system-blue hover:bg-system-blue/10 text-label-secondary rounded-xl transition-apple-micro active-apple-press cursor-pointer"
                title="Camera Scanner Backup"
              >
                <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Smart Search Dropdown */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-secondary-background border border-separator-apple/10 rounded-2xl shadow-elevated max-h-[35vh] overflow-y-auto divide-y divide-separator-apple/10">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-label-tertiary text-apple-subheadline">
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
                        "w-full flex items-center justify-between p-4 transition-apple-micro text-left cursor-pointer",
                        idx === focusedMedicineIndex
                          ? "bg-system-blue/10 border-l-4 border-system-blue"
                          : "hover:bg-secondary-background/40"
                      )}
                    >
                      <div>
                        <h4 className="font-bold text-label-primary text-apple-headline capitalize">
                          {medicine.name} {medicine.dosage}
                        </h4>
                        <p className="text-apple-caption-2 text-label-secondary mt-1 font-mono">
                          Batch: {medicine.batchNumber} · Exp: {new Date(medicine.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-apple-subheadline font-bold text-system-blue text-tabular-nums">
                          {formatCurrency(medicine.sellingPrice)}
                        </p>
                        <p className={cn("text-apple-caption-2 font-semibold mt-1", medicine.availableQty > 0 ? "text-label-secondary" : "text-system-red")}>
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

          {customer && customerHistory?.itemsSummary?.length > 0 && (
            <div className="card p-4 animate-fade-in bg-secondary-background border border-separator-apple/10">
              <div className="flex items-center justify-between mb-3 border-b border-separator-apple/5 pb-2">
                <span className="text-apple-subheadline font-bold text-label-primary flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-system-blue" /> Frequently Purchased by {customer.customerName}
                </span>
                <span className="text-[10px] bg-system-blue/10 text-system-blue px-2 py-0.5 rounded-full font-semibold">Click '+' to quickly add</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {customerHistory.itemsSummary.slice(0, 8).map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleQuickAddFromHistory(item._id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-separator-apple/10 hover:border-system-blue/30 hover:bg-system-blue/5 text-left transition-apple-micro active-apple-press cursor-pointer group"
                  >
                    <span className="h-5 w-5 rounded-lg bg-system-blue/10 flex items-center justify-center text-system-blue group-hover:bg-system-blue group-hover:text-white transition-colors text-xs font-bold font-mono">+</span>
                    <div>
                      <span className="text-apple-subheadline font-semibold text-label-primary">{item.name} {item.dosage}</span>
                      <span className="text-[9px] text-label-secondary uppercase font-semibold block">{item.form || 'Item'} · Bought: {item.totalQuantity}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <SymptomSelector
              selected={symptoms}
              onChange={setSymptoms}
              inputRef={symptomInputRef}
              onAfterSelect={() => paymentRef.current?.focus()}
              onBeforeSelect={() => doctorInputRef.current?.focus()}
            />
          </div>

          {/* Checkout billing configuration inputs */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-separator-apple/10 pb-3">
              <span className="text-apple-caption-2 font-semibold uppercase text-label-secondary tracking-wider">Checkout Options</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-apple-subheadline text-label-primary font-semibold">Flat Discount (₹)</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary text-apple-subheadline">₹</span>
                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => {
                    setDiscountType('FLAT');
                    setDiscountValue(parseFloat(e.target.value) || 0);
                  }}
                  placeholder="0"
                  className="w-28 text-right pl-7 pr-3 py-2 text-apple-subheadline border border-separator-apple/10 bg-secondary-background text-label-primary rounded-xl focus:border-system-blue focus:outline-none transition-apple-micro text-tabular-nums"
                  min="0"
                />
              </div>
            </div>

            {/* Indian localized GST components */}
            {gstNumber && (
              <div className="space-y-2 border-t border-separator-apple/10 pt-3">
                <div className="flex justify-between text-apple-subheadline">
                  <span className="text-label-secondary font-semibold">Taxable Amount</span>
                  <span className="font-bold text-label-primary text-tabular-nums">{formatCurrency(totals.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-apple-subheadline">
                  <span className="text-label-secondary font-semibold">Total GST (12%)</span>
                  <span className="font-bold text-label-primary text-tabular-nums">{formatCurrency(totals.totalGst)}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right side: Real Time Transaction Cart & Checkout */}
        <div className="flex flex-col bg-secondary-background/30 border-t lg:border-t-0 lg:border-l border-separator-apple/10 lg:overflow-hidden lg:h-full shrink-0">
          {/* Cart Header */}
          <div className="px-6 py-4 bg-secondary-background/60 border-b border-separator-apple/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-system-blue/10 text-system-blue rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-apple-headline font-semibold text-label-primary tracking-tight">Cart</h2>
                <p className="text-apple-footnote text-label-secondary">{cartItems.length} items scanned</p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="text-apple-caption-2 font-bold text-system-red hover:bg-system-red/10 border border-separator-apple/10 px-3 py-1.5 rounded-lg transition-apple-micro active-apple-press cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Scroll Items */}
          <div 
            className="flex-1 lg:overflow-y-auto p-4 lg:p-6 space-y-3 bg-secondary-background/20 outline-none focus:bg-secondary-background/40 transition-apple-micro"
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
              <div className="h-full flex flex-col items-center justify-center text-label-tertiary py-12">
                <div className="h-16 w-16 bg-secondary-background rounded-2xl flex items-center justify-center mb-4 border border-separator-apple/10">
                  <ShoppingCart className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-apple-subheadline font-semibold text-label-secondary">Cart is Empty</p>
                <p className="text-apple-caption-1 opacity-70 mt-1">Ready for barcode scans...</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={`${item.medicineId}-${item.batchId}`}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary-background border rounded-2xl transition-apple-micro",
                    index === focusedCartIndex
                      ? "border-system-blue ring-2 ring-system-blue/15 shadow-sm"
                      : "border-separator-apple/10 hover:border-system-blue/20"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-apple-headline font-bold text-label-primary truncate capitalize">{item.medicineName} {item.medicineDosage}</p>
                    <p className="text-apple-caption-2 text-label-secondary mt-1 font-mono">Batch: {item.batchNumber} · Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="flex items-center bg-system-background border border-separator-apple/10 rounded-xl overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="p-2 sm:p-2.5 hover:bg-secondary-background/80 text-label-secondary transition-apple-micro cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <span className="text-apple-headline font-black text-label-primary w-8 sm:w-10 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="p-2 sm:p-2.5 hover:bg-secondary-background/80 text-label-secondary transition-apple-micro cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="min-w-[70px] text-right text-apple-headline font-semibold text-label-primary shrink-0 text-tabular-nums">
                        {formatCurrency(item.quantity * item.sellingPrice)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="p-2 sm:p-2.5 text-label-tertiary hover:text-system-red hover:bg-system-red/10 rounded-lg transition-apple-micro shrink-0 cursor-pointer"
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
            className="p-6 bg-secondary-background/60 border-t border-separator-apple/10 space-y-4 shrink-0 focus:outline-none focus:bg-secondary-background/40 transition-apple-micro rounded-xl"
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
            <span className="text-apple-caption-2 font-black uppercase text-label-secondary tracking-wider">Payment Method (F8)</span>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-3">
              {PAYMENT_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = paymentMethod === mode.value.toLowerCase();
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setPaymentMethod(mode.value.toLowerCase())}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-xl border text-center transition-apple-micro active-apple-press cursor-pointer",
                      isSelected
                        ? "bg-system-blue border-transparent text-white font-semibold shadow-sm"
                        : "bg-secondary-background border-separator-apple/10 text-label-secondary hover:bg-secondary-background/85"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 lg:p-6 bg-secondary-background/60 border-t border-separator-apple/10 space-y-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative lg:static">
            <div className="flex items-center justify-between">
              <span className="text-apple-caption-2 font-semibold uppercase tracking-wider text-label-secondary">Total Amount Due</span>
              <span className="text-apple-title-2 font-bold tracking-tight text-label-primary text-tabular-nums">{formatCurrency(totals.grandTotal)}</span>
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
              className="w-full py-4 bg-system-blue hover:bg-system-blue/90 disabled:bg-secondary-background disabled:text-label-tertiary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-apple-headline rounded-2xl flex items-center justify-center gap-2.5 transition-apple-micro active-apple-press shadow-sm"
            >
              {processing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Receipt className="h-6 w-6" />
              )}
              Complete Sale (Enter)
            </button>

            {/* Reprint actions */}
            <div className="flex gap-3 text-apple-footnote font-bold pt-2">
              <button
                onClick={handlePrint}
                disabled={!lastBill || cartItems.length > 0}
                className="flex-1 py-3 bg-secondary-background hover:bg-secondary-background/85 border border-separator-apple/10 disabled:opacity-30 rounded-xl flex items-center justify-center gap-2 text-label-primary font-medium transition-apple-micro active-apple-press cursor-pointer"
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
                className="flex-1 py-3 bg-system-green/10 hover:bg-system-green/20 border border-system-green/25 disabled:opacity-30 rounded-xl flex items-center justify-center gap-2 text-system-green font-medium transition-apple-micro active-apple-press cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-md"
          onClick={() => { setQtyModal(null); searchInputRef.current?.focus(); }}
        >
          <div
            className="bg-secondary-background border border-separator-apple/10 rounded-3xl shadow-elevated p-6 w-full max-w-sm mx-4 text-label-primary"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-apple-caption-2 font-bold uppercase tracking-widest text-system-blue mb-1">Add Medicine</p>
            <h3 className="text-apple-title-3 font-bold text-label-primary capitalize mb-1">
              {qtyModal.medicine.name} {qtyModal.medicine.dosage}
            </h3>
            <p className="text-apple-caption-2 text-label-secondary mb-4 font-mono">
              Batch: {qtyModal.medicine.batchNumber} · Available: {qtyModal.medicine.availableQty} · price: ₹{qtyModal.medicine.sellingPrice}
            </p>
            <label className="block text-apple-footnote font-semibold text-label-secondary mb-2">
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
              className="w-full text-apple-title-1 font-bold text-center py-3 sm:py-4 bg-secondary-background border border-separator-apple/10 focus:border-system-blue focus:ring-4 focus:ring-system-blue/10 rounded-2xl text-label-primary mb-4 sm:mb-6 shadow-sm font-mono"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => { setQtyModal(null); searchInputRef.current?.focus(); }}
                className="flex-1 py-3 bg-secondary-background hover:bg-secondary-background/80 text-apple-subheadline font-semibold rounded-xl text-label-primary transition-apple-micro active-apple-press cursor-pointer border border-separator-apple/10"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={confirmQtyModal}
                className="flex-1 py-3 bg-system-blue hover:bg-system-blue/90 text-white text-apple-subheadline font-semibold rounded-xl transition-apple-micro active-apple-press cursor-pointer shadow-sm"
              >
                Add ↵
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Backup Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-secondary-background border border-separator-apple/10 rounded-3xl shadow-elevated overflow-hidden w-full max-w-md">
            <div className="p-4 bg-secondary-background/60 border-b border-separator-apple/10 flex justify-between items-center">
              <span className="font-semibold text-label-primary text-apple-subheadline flex items-center gap-2">
                <Camera className="h-4 w-4 text-system-blue" /> Device Camera Scanner
              </span>
              <button onClick={stopCamera} className="text-label-secondary hover:text-label-primary text-apple-caption-2 font-bold bg-secondary-background border border-separator-apple/10 px-3 py-1.5 rounded-lg cursor-pointer transition-apple-micro active-apple-press">
                Close
              </button>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover"></video>
              <div className="absolute inset-8 border-2 border-system-blue/40 rounded-xl pointer-events-none"></div>
            </div>

            <div className="p-4 bg-secondary-background space-y-3">
              <span className="text-[10px] text-label-secondary block text-center">Place barcode inside the square to scan.</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulateCameraScan('BT7432')}
                  className="py-2.5 bg-secondary-background hover:bg-secondary-background/80 text-apple-caption-2 rounded-xl font-bold text-label-primary transition-apple-micro active-apple-press cursor-pointer border border-separator-apple/10"
                >
                  Scan Demo Batch (BT7432)
                </button>
                <button
                  onClick={() => simulateCameraScan('CRO-2026')}
                  className="py-2.5 bg-secondary-background hover:bg-secondary-background/80 text-apple-caption-2 rounded-xl font-bold text-label-primary transition-apple-micro active-apple-press cursor-pointer border border-separator-apple/10"
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
