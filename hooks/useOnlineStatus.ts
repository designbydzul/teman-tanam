'use client';

import { useState, useEffect, useCallback } from 'react';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('useOnlineStatus');

export interface UseOnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean; // True if was recently offline (for showing "back online" toast)
  clearWasOffline: () => void;
}

/**
 * useOnlineStatus Hook
 *
 * Detects and tracks online/offline status.
 * Returns isOnline boolean and wasOffline for showing "back online" notifications.
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  // Initialize with actual status on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      debug.log('Initial online status:', navigator.onLine);
    }
  }, []);

  // Handle online event
  const handleOnline = useCallback(() => {
    debug.log('Connection restored - online');
    setIsOnline(true);
    setWasOffline(true); // Mark that we were offline
  }, []);

  // Handle offline event
  const handleOffline = useCallback(() => {
    debug.log('Connection lost - offline');
    setIsOnline(false);
  }, []);

  // Clear wasOffline flag (after showing toast)
  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  // Add event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    debug.log('Online status listeners attached');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    clearWasOffline,
  };
}

export default useOnlineStatus;
