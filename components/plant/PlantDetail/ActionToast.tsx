'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from '@phosphor-icons/react';
import { radius, typography } from '@/styles/theme';

interface ActionToastProps {
  show: boolean;
  message: string;
}

/**
 * ActionToast Component
 *
 * Displays a toast notification for completed actions.
 */
const ActionToast: React.FC<ActionToastProps> = ({ show, message }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{
            position: 'fixed',
            bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            backgroundColor: '#2D5016',
            borderRadius: radius.xl,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <CheckCircle size={22} weight="fill" color="#FFFFFF" />
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ActionToast;
