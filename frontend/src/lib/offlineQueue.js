import { openDB } from 'idb';

const DB_NAME = 'medstore-offline-db';
const STORE_NAME = 'sync-queue';
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

/**
 * Enqueue a request (e.g., a sale) to be synced later
 * @param {string} url - API endpoint
 * @param {object} payload - request body
 * @param {string} method - HTTP method
 */
export async function enqueueSync(url, payload, method = 'POST') {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const record = {
    id: crypto.randomUUID(),
    url,
    payload,
    method,
    createdAt: new Date().toISOString(),
    status: 'pending' // 'pending' | 'failed'
  };
  
  await store.put(record);
  await tx.done;
  
  // Register background sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-sales');
    } catch (err) {
      console.error('Background Sync registration failed:', err);
      // Fallback: we will handle sync on app foreground or online event
    }
  }
  
  return record;
}

/**
 * Get all pending sync requests
 */
export async function getPendingSyncs() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Remove a successfully synced request from the queue
 * @param {string} id 
 */
export async function removeSyncRecord(id) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
}

/**
 * Process the queue manually (fallback for when Background Sync isn't available)
 */
export async function processSyncQueue(apiClient) {
  if (!navigator.onLine) return;

  const records = await getPendingSyncs();
  if (records.length === 0) return;

  for (const record of records) {
    try {
      if (record.method === 'POST') {
        await apiClient.post(record.url, record.payload);
      } else if (record.method === 'PUT') {
        await apiClient.put(record.url, record.payload);
      }
      // On success, remove from queue
      await removeSyncRecord(record.id);
    } catch (err) {
      console.error('Failed to sync record:', record.id, err);
      // We keep it in the queue for the next retry, unless it's a 4xx error (bad request)
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
         // Log the failure to backend later, but remove from queue to unblock
         await removeSyncRecord(record.id);
      }
    }
  }
}
