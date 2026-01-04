'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WifiHigh, WifiSlash, ArrowsClockwise } from '@phosphor-icons/react';
import type { NetworkStatus } from './types';

interface NetworkToastProps {
  isVisible: boolean;
  title: string;
  message: string;
  networkStatus: NetworkStatus;
  onClose: () => void;
}

/**
 * NetworkToast Component
 *
 * Toast notification for network status changes.
 */
const NetworkToast: React.FC<NetworkToastProps> = ({
  isVisible,
  title,
  message,
  networkStatus,
  onClose,
}) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const getStatusConfig = () => {
    switch (networkStatus) {
      case 'online':
        return {
          bgColor: '#F1F8E9',
          borderColor: '#C5E1A5',
          textColor: '#2D5016',
          icon: <WifiHigh size={24} weight="duotone" color="#7CB342" />,
        };
      case 'reconnecting':
        return {
          bgColor: '#FEF3C7',
          borderColor: '#FDE68A',
          textColor: '#92400E',
          icon: <ArrowsClockwise size={24} weight="duotone" color="#F59E0B" className="animate-spin" />,
        };
      case 'offline':
      default:
        return {
          bgColor: '#FEE2E2',
          borderColor: '#FECACA',
          textColor: '#991B1B',
          icon: <WifiSlash size={24} weight="duotone" color="#EF4444" />,
        };
    }
  };

  const config = getStatusConfig();

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            zIndex: 10001,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            maxWidth: 'calc(100vw - 48px)',
            width: '340px',
            marginTop: '20px',
          }}
        >
          {/* Icon */}
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {config.icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                color: config.textColor,
                margin: '0 0 4px 0',
              }}
            >
              {title}
            </h4>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 400,
                color: config.textColor,
                margin: 0,
                opacity: 0.8,
                lineHeight: 1.4,
              }}
            >
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Tutup notifikasi"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: 0.6,
            }}
          >
            <X size={18} weight="bold" color={config.textColor} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default NetworkToast;
