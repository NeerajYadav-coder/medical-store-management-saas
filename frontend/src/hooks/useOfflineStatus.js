import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncs, processSyncQueue } from '../lib/offlineQueue';
import api from '../api/axios.config';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const checkQueueDepth = useCallback(async () => {
    try {
      const records = await getPendingSyncs();
      setPendingCount(records.length);
    } catch (e) {
      console.error("Error reading sync queue", e);
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (isOnline) {
      await processSyncQueue(api);
      await checkQueueDepth();
    }
  }, [isOnline, checkQueueDepth]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkQueueDepth();
    
    // Poll queue depth periodically
    const intervalId = setInterval(checkQueueDepth, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [handleSync, checkQueueDepth]);

  return { isOnline, pendingCount, syncNow: handleSync };
}
