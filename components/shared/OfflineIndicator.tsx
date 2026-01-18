'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiSlash,
  CloudArrowUp,
  CheckCircle,
  XCircle,
  ArrowClockwise,
} from '@phosphor-icons/react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface IndicatorConfig {
  show: boolean;
  bg?: string;
  borderColor?: string;
  textColor?: string;
  iconColor?: string;
  icon?: ReactNode;
  text?: string;
  showRetry?: boolean;
  retryText?: string;
}

interface OfflineIndicatorProps {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  syncNow: () => void;
}

/**
 * OfflineIndicator Component
 * Shows connection and sync status as a banner at the top of the screen
 *
 * Props must be provided from usePlants hook in parent component:
 * const { isOnline, syncStatus, pendingCount, syncNow } = usePlants();
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  syncStatus,
  pendingCount,
  syncNow,
}) => {

  // Determine what to show
  const getIndicatorConfig = (): IndicatorConfig => {
    // Offline state - more prominent orange/yellow style
    if (!isOnline) {
      const offlineText = pendingCount > 0
        ? `Kamu sedang offline · ${pendingCount} aksi tersimpan`
        : 'Kamu sedang offline';
      return {
        show: true,
        bg: '#FFF3E0', // light orange background
        borderColor: '#FFE0B2',
        textColor: '#E65100', // dark orange text
        icon: <WifiSlash size={20} weight="regular" color="#757575" />,
        text: offlineText,
        showRetry: false,
      };
    }

    // Syncing state
    if (syncStatus === 'syncing') {
      return {
        show: true,
        bg: '#3B82F6', // blue
        icon: <CloudArrowUp size={20} weight="regular" className="animate-pulse" />,
        text: 'Menyinkronkan data...',
        showRetry: false,
      };
    }

    // Success state
    if (syncStatus === 'success') {
      return {
        show: true,
        bg: '#22C55E', // green
        icon: <CheckCircle size={20} weight="regular" />,
        text: 'Data tersinkronkan!',
        showRetry: false,
      };
    }

    // Error state
    if (syncStatus === 'error') {
      return {
        show: true,
        bg: '#EF4444', // red
        icon: <XCircle size={20} weight="regular" />,
        text: 'Gagal sinkronkan',
        showRetry: true,
      };
    }

    // Online + idle + has pending items
    if (isOnline && syncStatus === 'idle' && pendingCount > 0) {
      return {
        show: true,
        bg: '#3B82F6', // blue
        icon: <CloudArrowUp size={20} weight="regular" />,
        text: `${pendingCount} item menunggu sinkronisasi`,
        showRetry: true,
        retryText: 'Sync',
      };
    }

    // Online + idle + no pending = don't show
    return { show: false };
  };

  const config = getIndicatorConfig();

  // Determine text and icon colors
  const textColor = config.textColor || 'white';

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
            borderBottom: config.borderColor ? `1px solid ${config.borderColor}` : 'none',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {/* Icon */}
          <span style={{ color: textColor, display: 'flex', alignItems: 'center' }}>
            {config.icon}
          </span>

          {/* Text */}
          <span
            style={{
              color: textColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
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
                backgroundColor: config.textColor ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                border: config.textColor ? `1px solid ${config.textColor}40` : '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '6px',
                color: textColor,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowClockwise size={16} weight="regular" color={textColor} />
              {config.retryText || 'Coba Lagi'}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
