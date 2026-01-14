'use client';

/**
 * Notification Settings Modal
 *
 * Full notification settings modal with:
 * - WhatsApp toggle
 * - Phone number input
 * - Hour picker for reminder time
 * - Test notification button
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsappLogo, X, Clock } from '@phosphor-icons/react';
import { useNotificationSettings, isValidIndonesianNumber } from '@/hooks/useNotificationSettings';
import { supabase } from '@/lib/supabase/client';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('NotificationSettingsModal');

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
  const { settings, loading, updateSettings } = useNotificationSettings();

  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reminderHour, setReminderHour] = useState('07');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Sync state with fetched settings
  useEffect(() => {
    if (settings) {
      setEnabled(settings.whatsapp_enabled);
      // Display the number without the 62 prefix for better UX
      if (settings.whatsapp_number) {
        const displayNumber = settings.whatsapp_number.startsWith('62')
          ? settings.whatsapp_number.substring(2)
          : settings.whatsapp_number;
        setPhoneNumber(displayNumber);
      }
      // Set reminder hour (extract just the hour from HH:MM:SS)
      if (settings.reminder_time) {
        const hour = settings.reminder_time.substring(0, 2); // Get HH
        setReminderHour(hour);
      }
    }
  }, [settings]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

  // Handle save
  const handleSave = async () => {
    // Validate phone number if enabled
    if (enabled) {
      if (!phoneNumber.trim()) {
        setPhoneError('Masukkan nomor WhatsApp');
        return;
      }

      if (!isValidIndonesianNumber(phoneNumber)) {
        setPhoneError('Format nomor gak valid. Contoh: 81234567890');
        return;
      }
    }

    setIsSaving(true);

    const result = await updateSettings(
      enabled,
      enabled ? phoneNumber : null,
      reminderHour + ':00:00' // Convert HH to HH:00:00 for database
    );

    if (result.success) {
      if (onSuccess) {
        onSuccess();
      }
      showToastMessage('Pengaturan notifikasi berhasil disimpan');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      showToastMessage(result.error || 'Gagal simpan. Coba lagi ya!');
      if (result.error?.includes('nomor')) {
        setPhoneError(result.error);
      }
      setIsSaving(false);
    }
  };

  // Handle send test notification
  const handleSendTest = async () => {
    // Validate phone number
    if (!phoneNumber.trim()) {
      setPhoneError('Masukkan nomor WhatsApp');
      return;
    }

    if (!isValidIndonesianNumber(phoneNumber)) {
      setPhoneError('Format nomor gak valid. Contoh: 81234567890');
      return;
    }

    setIsSendingTest(true);

    try {
      // Format phone number to 628xxx format
      const formattedPhone = '62' + phoneNumber;

      // Get the session token to send with the request
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToastMessage('Sesi kamu habis. Silakan login lagi.');
        return;
      }

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        showToastMessage(data.message || 'Pesan test berhasil dikirim! 🎉');
      } else {
        showToastMessage(data.error || 'Gagal kirim pesan test. Coba lagi ya!');
      }
    } catch (error) {
      debug.error('Test notification error:', error);
      showToastMessage('Gagal kirim pesan test. Coba lagi ya!');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setPhoneError(null);
    setIsSaving(false);
    setIsSendingTest(false);
    setFocusedInput(null);
    setShowToast(false);
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
              maxWidth: '420px',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
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
              <div style={{ padding: '32px 24px 24px 24px' }}>
                {/* Title */}
                <h2
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#2D5016',
                    textAlign: 'center',
                    margin: '0 0 24px 0',
                  }}
                >
                  Notifikasi
                </h2>

                {/* Loading State */}
                {loading && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#757575' }}>
                    Memuat...
                  </div>
                )}

                {/* Settings */}
                {!loading && (
                  <>
                    {/* WhatsApp Reminder Section */}
                    <div style={{ marginBottom: '24px' }}>
                      {/* Header with toggle */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <WhatsappLogo
                            size={22}
                            weight="fill"
                            color={enabled ? '#25D366' : '#999999'}
                          />
                          <h3
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#2C2C2C',
                              margin: 0,
                            }}
                          >
                            WhatsApp Reminder
                          </h3>
                        </div>
                        <button
                          onClick={() => setEnabled(!enabled)}
                          style={{
                            width: '48px',
                            height: '28px',
                            borderRadius: '14px',
                            backgroundColor: enabled ? '#7CB342' : '#E0E0E0',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.2s ease',
                            padding: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: '#FFFFFF',
                              position: 'absolute',
                              top: '3px',
                              left: enabled ? '23px' : '3px',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                            }}
                          />
                        </button>
                      </div>

                      {/* Phone Number Input - Show only when enabled */}
                      {enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
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
                                : focusedInput === 'phone'
                                ? '2px solid #7CB342'
                                : '2px solid transparent',
                              overflow: 'hidden',
                              transition: 'border-color 200ms',
                            }}
                          >
                            <div
                              style={{
                                padding: '16px',
                                backgroundColor: '#F0F0F0',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem',
                                color: '#757575',
                                borderRight: '1px solid #E0E0E0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <WhatsappLogo size={20} weight="fill" color="#25D366" />
                              +62
                            </div>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              onFocus={() => setFocusedInput('phone')}
                              onBlur={() => setFocusedInput(null)}
                              placeholder="81234567890"
                              style={{
                                flex: 1,
                                padding: '16px',
                                fontSize: '1rem',
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

                          {/* Hour Picker - Dropdown */}
                          <div style={{ marginTop: '16px' }}>
                            <label
                              style={{
                                display: 'block',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '14px',
                                color: '#757575',
                                marginBottom: '8px',
                              }}
                            >
                              Waktu Reminder
                            </label>
                            <div
                              style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#FAFAFA',
                                borderRadius: '12px',
                                border: focusedInput === 'time' ? '2px solid #7CB342' : '2px solid transparent',
                                transition: 'border-color 200ms',
                              }}
                            >
                              <Clock
                                size={20}
                                weight="regular"
                                color="#757575"
                                style={{ marginLeft: '16px' }}
                              />
                              <select
                                value={reminderHour}
                                onChange={(e) => setReminderHour(e.target.value)}
                                onFocus={() => setFocusedInput('time')}
                                onBlur={() => setFocusedInput(null)}
                                style={{
                                  flex: 1,
                                  padding: '16px',
                                  paddingLeft: '12px',
                                  fontSize: '1rem',
                                  fontFamily: "'Inter', sans-serif",
                                  color: '#2C2C2C',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  outline: 'none',
                                  cursor: 'pointer',
                                  WebkitAppearance: 'none',
                                  appearance: 'none',
                                }}
                              >
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return (
                                    <option key={hour} value={hour}>
                                      {hour}:00
                                    </option>
                                  );
                                })}
                              </select>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                style={{ marginRight: '16px', pointerEvents: 'none' }}
                              >
                                <path
                                  d="M5 7.5L10 12.5L15 7.5"
                                  stroke="#757575"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Test Button */}
                          <div style={{ marginTop: '16px' }}>
                            <button
                              onClick={handleSendTest}
                              disabled={isSendingTest || !phoneNumber}
                              style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '2px solid #7CB342',
                                backgroundColor: '#FFFFFF',
                                color: '#7CB342',
                                fontSize: '1rem',
                                fontWeight: 600,
                                fontFamily: "'Inter', sans-serif",
                                cursor: isSendingTest || !phoneNumber ? 'not-allowed' : 'pointer',
                                opacity: isSendingTest || !phoneNumber ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                              }}
                            >
                              <WhatsappLogo size={20} weight="fill" />
                              {isSendingTest ? 'Mengirim...' : 'Kirim Test Notifikasi'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: isSaving ? '#E0E0E0' : '#7CB342',
                        color: '#FFFFFF',
                        fontSize: '1rem',
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Toast notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  left: '24px',
                  right: '24px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  zIndex: 10000,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#2C2C2C',
                    margin: 0,
                  }}
                >
                  {toastMessage}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationReminderModal;
