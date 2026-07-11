import React from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOnline, pendingCount, syncNow } = useOfflineStatus();

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white border shadow-sm text-sm font-medium transition-all">
      {isOnline ? (
        <>
          <div className="flex items-center gap-1.5 text-green-600">
            <Wifi size={16} />
            <span>Online</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 border-l pl-3 ml-1 text-orange-600">
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-orange-500"></span>
              {pendingCount} Pending Sync
              <button 
                onClick={syncNow}
                className="ml-1 p-1 hover:bg-orange-100 rounded-full transition-colors"
                title="Sync Now"
              >
                <RefreshCw size={14} className="hover:animate-spin" />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-red-600">
            <WifiOff size={16} />
            <span>Offline Mode</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 border-l pl-3 ml-1 text-gray-500">
              {pendingCount} Saved Locally
            </div>
          )}
        </>
      )}
    </div>
  );
}
