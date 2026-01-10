'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiSlash } from '@phosphor-icons/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getSyncQueueCount } from '@/lib/offlineStorage';

/**
 * GlobalOfflineBanner
 * A simple, globally positioned offline banner that shows at the top of the viewport
 * when the user is offline. This is separate from the more detailed OfflineIndicator
 * used in Home which shows sync status.
 */
const GlobalOfflineBanner: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = React.useState(0);

  // Update pending count when offline
  React.useEffect(() => {
    if (!isOnline) {
      setPendingCount(getSyncQueueCount());
    }
  }, [isOnline]);

  // Listen for storage changes to update pending count
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (!isOnline) {
        setPendingCount(getSyncQueueCount());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isOnline]);

  const offlineText = pendingCount > 0
    ? `Kamu sedang offline · ${pendingCount} aksi tersimpan`
    : 'Kamu sedang offline';

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFF3E0',
            borderBottom: '1px solid #FFE0B2',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <WifiSlash size={18} weight="bold" color="#E65100" />
          <span
            style={{
              color: '#E65100',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {offlineText}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalOfflineBanner;
