/**
 * db.js
 * IndexedDB utility for Offline-First operations
 */

const DB_NAME = 'MedStoreOfflineDB';
const DB_VERSION = 1;

let dbInstance = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Medicines store (keyPath is _id)
      if (!db.objectStoreNames.contains('medicines')) {
        const medicineStore = db.createObjectStore('medicines', { keyPath: '_id' });
        medicineStore.createIndex('name', 'name', { unique: false });
        medicineStore.createIndex('barcode', 'barcode', { unique: false });
      }

      // Customers store (keyPath is _id)
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: '_id' });
        customerStore.createIndex('phone', 'phone', { unique: false });
        customerStore.createIndex('name', 'name', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Pending sales store (for offline-first sales queue)
      if (!db.objectStoreNames.contains('pendingSales')) {
        db.createObjectStore('pendingSales', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

/**
 * Bulk save items into a store
 */
export const saveBulk = async (storeName, items) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    // Retrieve existing items to preserve temporary offline creations
    const getReq = store.getAll();
    getReq.onsuccess = () => {
      const existing = getReq.result || [];
      const temps = existing.filter(item => item.isOfflineTemp);
      
      store.clear();
      
      temps.forEach(t => store.put(t));
      items.forEach((item) => {
        if (item && (item._id || item.key)) {
          store.put(item);
        }
      });
    };

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Put a single item
 */
export const saveItem = async (storeName, item) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Get all items from a store
 */
export const getAllItems = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Get a single item by key
 */
export const getItem = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Delete an item by key
 */
export const deleteItem = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
};
