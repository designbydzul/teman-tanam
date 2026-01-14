'use client';

/**
 * Notification Reminder Modal
 *
 * A popup modal that prompts users to enable WhatsApp reminders.
 * Shown when user has plants but notifications are not enabled.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, WhatsappLogo, X } from '@phosphor-icons/react';
import { useNotificationSettings, isValidIndonesianNumber } from '@/hooks/useNotificationSettings';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('NotificationReminderModal');

interface NotificationReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const NotificationReminderModal: React.FC<NotificationReminderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const { updateSettings } = useNotificationSettings();

  // Validate phone number on change
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError(null);
    }
  };

  // Handle enable WhatsApp
  const handleEnable = async () => {
    debug.log('handleEnable called', { phoneNumber });

    // Validate phone number
    if (!phoneNumber.trim()) {
      setPhoneError('Masukkan nomor WhatsApp');
      return;
    }

    if (!isValidIndonesianNumber(phoneNumber)) {
      setPhoneError('Format nomor gak valid. Contoh: 81234567890');
      return;
    }

    setIsSubmitting(true);

    try {
      // Include default reminder time (07:00:00)
      const result = await updateSettings(true, phoneNumber, '07:00:00');

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        debug.error('Update settings failed:', result.error);
        setPhoneError(result.error || 'Gagal menyimpan. Coba lagi ya!');
      }
    } catch (error) {
      debug.error('Error enabling WhatsApp:', error);
      setPhoneError('Gagal menyimpan. Coba lagi ya!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setPhoneNumber('');
    setPhoneError(null);
    setIsSubmitting(false);
    setFocusedInput(false);
    onClose();
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
            onClick={handleClose}
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
              onClick={handleClose}
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

              {/* Phone Input */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    color: '#757575',
                    marginBottom: '8px',
                  }}
                >
                  Nomor WhatsApp
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FAFAFA',
                    borderRadius: '12px',
                    border: phoneError
                      ? '2px solid #F44336'
                      : focusedInput
                      ? '2px solid #7CB342'
                      : '2px solid transparent',
                    overflow: 'hidden',
                    transition: 'border-color 200ms',
                  }}
                >
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#F0F0F0',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9375rem',
                      color: '#757575',
                      borderRight: '1px solid #E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <WhatsappLogo size={18} weight="fill" color="#25D366" />
                    +62
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onFocus={() => setFocusedInput(true)}
                    onBlur={() => setFocusedInput(false)}
                    placeholder="81234567890"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: '14px',
                      fontSize: '0.9375rem',
                      fontFamily: "'Inter', sans-serif",
                      color: '#2C2C2C',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                  />
                </div>
                {phoneError ? (
                  <p
                    style={{
                      margin: '8px 0 0 0',
                      fontSize: '0.75rem',
                      color: '#F44336',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {phoneError}
                  </p>
                ) : (
                  <p
                    style={{
                      margin: '8px 0 0 0',
                      fontSize: '0.75rem',
                      color: '#999999',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Contoh: 81234567890 (tanpa 0 di depan)
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Enable Button */}
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isSubmitting ? '#E0E0E0' : '#25D366',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Ya, Aktifkan Reminder'}
                </button>

                {/* Skip Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9375rem',
                    color: '#757575',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
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
