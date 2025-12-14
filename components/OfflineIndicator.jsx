'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiSlash,
  CloudArrowUp,
  CheckCircle,
  XCircle,
  ArrowClockwise,
} from '@phosphor-icons/react';

/**
 * OfflineIndicator Component
 * Shows connection and sync status as a banner at the top of the screen
 *
 * Props must be provided from usePlants hook in parent component:
 * const { isOnline, syncStatus, pendingCount, syncNow } = usePlants();
 *
 * @param {Object} props
 * @param {boolean} props.isOnline - Online status
 * @param {string} props.syncStatus - 'idle' | 'syncing' | 'success' | 'error'
 * @param {number} props.pendingCount - Number of pending sync items
 * @param {Function} props.syncNow - Function to trigger sync
 */
const OfflineIndicator = ({
  isOnline,
  syncStatus,
  pendingCount,
  syncNow,
}) => {

  // Determine what to show
  const getIndicatorConfig = () => {
    // Offline state
    if (!isOnline) {
      return {
        show: true,
        bg: '#F59E0B', // amber
        icon: <WifiSlash size={18} weight="bold" />,
        text: `Mode Offline - Data tersimpan lokal${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`,
        showRetry: false,
      };
    }

    // Syncing state
    if (syncStatus === 'syncing') {
      return {
        show: true,
        bg: '#3B82F6', // blue
        icon: <CloudArrowUp size={18} weight="bold" className="animate-pulse" />,
        text: 'Menyinkronkan data...',
        showRetry: false,
      };
    }

    // Success state
    if (syncStatus === 'success') {
      return {
        show: true,
        bg: '#22C55E', // green
        icon: <CheckCircle size={18} weight="bold" />,
        text: 'Data tersinkronkan!',
        showRetry: false,
      };
    }

    // Error state
    if (syncStatus === 'error') {
      return {
        show: true,
        bg: '#EF4444', // red
        icon: <XCircle size={18} weight="bold" />,
        text: 'Gagal sinkronkan',
        showRetry: true,
      };
    }

    // Online + idle + has pending items
    if (isOnline && syncStatus === 'idle' && pendingCount > 0) {
      return {
        show: true,
        bg: '#3B82F6', // blue
        icon: <CloudArrowUp size={18} weight="bold" />,
        text: `${pendingCount} item menunggu sinkronisasi`,
        showRetry: true,
        retryText: 'Sync',
      };
    }

    // Online + idle + no pending = don't show
    return { show: false };
  };

  const config = getIndicatorConfig();

  return (
    <AnimatePresence>
      {config.show && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            backgroundColor: config.bg,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {/* Icon */}
          <span style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
            {config.icon}
          </span>

          {/* Text */}
          <span
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {config.text}
          </span>

          {/* Retry button */}
          {config.showRetry && (
            <button
              onClick={syncNow}
              style={{
                marginLeft: '8px',
                padding: '4px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowClockwise size={14} weight="bold" />
              {config.retryText || 'Coba Lagi'}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
