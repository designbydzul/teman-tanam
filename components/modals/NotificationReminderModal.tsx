'use client';

/**
 * Notification Reminder Modal
 *
 * A popup modal that prompts users to enable WhatsApp reminders.
 * Shown when user has plants but notifications are not enabled.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('NotificationReminderModal');

interface NotificationReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}

const NotificationReminderModal: React.FC<NotificationReminderModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings,
}) => {
  // Handle enable - navigate to settings page
  const handleEnable = () => {
    debug.log('handleEnable called - navigating to settings');
    onClose();
    onNavigateToSettings();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
            }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '400px',
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#F5F5F5',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1,
              }}
            >
              <X size={18} weight="bold" color="#757575" />
            </button>

            {/* Content */}
            <div
              style={{
                padding: '32px 24px 24px 24px',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                }}
              >
                <Bell size={32} weight="fill" color="#25D366" />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#2D5016',
                  textAlign: 'center',
                  margin: '0 0 12px 0',
                }}
              >
                Mau diingetin siram & pupuk?
              </h2>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  color: '#757575',
                  textAlign: 'center',
                  margin: '0 0 24px 0',
                  lineHeight: 1.6,
                }}
              >
                Kami bisa kirim reminder harian via WhatsApp kalau ada tanaman yang butuh perhatian.
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Enable Button */}
                <button
                  type="button"
                  onClick={handleEnable}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  Ya, Aktifkan Reminder
                </button>

                {/* Skip Button */}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9375rem',
                    color: '#757575',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  Nanti aja, skip
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationReminderModal;
