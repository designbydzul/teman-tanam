'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

interface ActionToastProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
}

/**
 * ActionToast Component
 *
 * Toast notification for plant actions (watering, fertilizing, etc.)
 */
const ActionToast: React.FC<ActionToastProps> = ({
  isVisible,
  message,
  onClose,
}) => {
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#2C2C2C',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10001,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {message}
          </span>
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
            }}
          >
            <X size={16} weight="bold" color="#FFFFFF" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ActionToast;
