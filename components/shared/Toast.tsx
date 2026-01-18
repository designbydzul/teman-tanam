'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Warning, Info, WifiHigh, WifiSlash, ArrowsClockwise } from '@phosphor-icons/react';
import type { NetworkStatus } from '@/types';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';
export type ToastVariant = 'action' | 'network' | 'simple';

interface ToastProps {
  isVisible: boolean;
  message: string;
  title?: string;
  type?: ToastType;
  position?: ToastPosition;
  variant?: ToastVariant;
  networkStatus?: NetworkStatus;
  onClose: () => void;
  /** Show icon (default: true for action/network, false for simple) */
  showIcon?: boolean;
}

/**
 * Unified Toast Component
 *
 * Supports three variants:
 * - action: Action feedback with icons (bottom, dark theme)
 * - network: Network status changes (top, colored by status)
 * - simple: Simple white toast without icon (bottom, light theme)
 *
 * For action variant, supports types: success, error, warning, info
 * For network variant, uses networkStatus for styling
 */
const Toast: React.FC<ToastProps> = ({
  isVisible,
  message,
  title,
  type = 'success',
  position = 'bottom',
  variant = 'action',
  networkStatus = 'online',
  onClose,
  showIcon,
}) => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Action toast config (bottom, dark theme with type-based icon)
  const getActionConfig = () => {
    const configs = {
      success: {
        icon: <CheckCircle size={20} weight="regular" color="#7CB342" />,
        bgColor: '#2C2C2C',
        textColor: '#FFFFFF',
      },
      error: {
        icon: <XCircle size={20} weight="regular" color="#DC2626" />,
        bgColor: '#2C2C2C',
        textColor: '#FFFFFF',
      },
      warning: {
        icon: <Warning size={20} weight="regular" color="#FF9800" />,
        bgColor: '#2C2C2C',
        textColor: '#FFFFFF',
      },
      info: {
        icon: <Info size={20} weight="regular" color="#757575" />,
        bgColor: '#2C2C2C',
        textColor: '#FFFFFF',
      },
    };
    return configs[type];
  };

  // Network toast config (top, colored by status)
  const getNetworkConfig = () => {
    const configs = {
      online: {
        bgColor: '#F1F8E9',
        borderColor: '#C5E1A5',
        textColor: '#2D5016',
        icon: <WifiHigh size={20} weight="regular" color="#7CB342" />,
      },
      reconnecting: {
        bgColor: '#FEF3C7',
        borderColor: '#FDE68A',
        textColor: '#92400E',
        icon: <ArrowsClockwise size={20} weight="regular" color="#FF9800" style={{ animation: 'spin 1s linear infinite' }} />,
      },
      offline: {
        bgColor: '#FEE2E2',
        borderColor: '#FECACA',
        textColor: '#991B1B',
        icon: <WifiSlash size={20} weight="regular" color="#757575" />,
      },
    };
    return configs[networkStatus];
  };

  // Simple toast config (white background, no icon by default)
  const getSimpleConfig = () => ({
    bgColor: '#FFFFFF',
    textColor: '#2C2C2C',
    secondaryTextColor: '#757575',
    icon: null,
  });

  const isNetwork = variant === 'network';
  const isSimple = variant === 'simple';
  const config = isNetwork ? getNetworkConfig() : isSimple ? getSimpleConfig() : getActionConfig();
  const isTop = position === 'top' || isNetwork;
  const shouldShowIcon = showIcon ?? (!isSimple);

  // Animation variants
  const animationVariants = {
    initial: { opacity: 0, y: isTop ? -50 : 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: isTop ? -50 : 50 },
  };

  // Positioning styles
  const positionStyles = isTop
    ? {
        top: 'env(safe-area-inset-top, 20px)',
        marginTop: '20px',
      }
    : {
        bottom: '100px',
      };

  // Get secondary text color for simple variant
  const secondaryTextColor = isSimple
    ? (config as ReturnType<typeof getSimpleConfig>).secondaryTextColor
    : config.textColor;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={animationVariants.initial}
          animate={animationVariants.animate}
          exit={animationVariants.exit}
          transition={{ type: 'spring', stiffness: 300, damping: isSimple ? 25 : 30 }}
          style={{
            position: 'fixed',
            ...(isSimple ? { left: '24px', right: '24px' } : { left: '50%', transform: 'translateX(-50%)' }),
            backgroundColor: config.bgColor,
            border: isNetwork ? `1px solid ${(config as ReturnType<typeof getNetworkConfig>).borderColor}` : 'none',
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: isNetwork ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: '12px',
            zIndex: isSimple ? 4000 : 10001,
            boxShadow: isSimple ? '0 4px 20px rgba(0, 0, 0, 0.15)' : isNetwork ? '0 4px 20px rgba(0, 0, 0, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.25)',
            maxWidth: isSimple ? undefined : 'calc(100vw - 48px)',
            width: isNetwork ? '340px' : 'auto',
            ...positionStyles,
            ...(isSimple ? { bottom: '24px' } : {}),
          }}
        >
          {/* Icon */}
          {shouldShowIcon && config.icon && (
            <div style={{ flexShrink: 0, marginTop: isNetwork ? '2px' : 0 }}>
              {config.icon}
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: isSimple ? '1rem' : '15px',
                  fontWeight: 600,
                  color: config.textColor,
                  margin: '0 0 4px 0',
                }}
              >
                {title}
              </h4>
            )}
            {isSimple && !title ? (
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: config.textColor,
                  margin: 0,
                }}
              >
                {message}
              </p>
            ) : (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: isNetwork ? '13px' : isSimple ? '14px' : '14px',
                  fontWeight: isNetwork ? 400 : isSimple ? 400 : 500,
                  color: isSimple && title ? secondaryTextColor : config.textColor,
                  opacity: isNetwork && title ? 0.8 : 1,
                  lineHeight: 1.4,
                  display: isSimple && !title ? 'none' : 'block',
                }}
              >
                {message}
              </span>
            )}
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
              opacity: isNetwork ? 0.6 : 1,
            }}
          >
            <X size={20} weight="regular" color={isSimple ? '#757575' : config.textColor} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Toast;
