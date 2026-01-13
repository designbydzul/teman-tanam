'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, WhatsappLogo, Clock } from '@phosphor-icons/react';
import {
  useNotificationSettings,
  isValidIndonesianNumber,
} from '@/hooks/useNotificationSettings';

export default function NotifikasiPage() {
  const router = useRouter();
  const { settings, loading, updateSettings } =
    useNotificationSettings();

  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Toast state (matching Home.tsx style)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToastMessage = (message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastMessage(message);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 3000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

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
    }
  }, [settings]);

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

    const result = await updateSettings(enabled, enabled ? phoneNumber : null);

    if (result.success) {
      // Navigate back to home with success toast
      router.push('/?toast=notifikasi-saved');
    } else {
      showToastMessage(result.error || 'Gagal simpan. Coba lagi ya!');
      if (result.error?.includes('nomor')) {
        setPhoneError(result.error);
      }
      setIsSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <div
      className="ios-fixed-container"
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F5F5F5',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Back Button */}
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              left: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
          </button>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
            }}
          >
            Notifikasi
          </h1>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Loading State - Skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="skeleton-pulse"
                style={{
                  height: i === 1 ? '80px' : '60px',
                  borderRadius: '12px',
                  backgroundColor: '#E8E8E8',
                }}
              />
            ))}
          </div>
        )}

        {/* Content when loaded */}
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
                  <h2
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#2C2C2C',
                      margin: 0,
                    }}
                  >
                    WhatsApp Reminder
                  </h2>
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
                      border: phoneError ? '2px solid #F44336' : '2px solid transparent',
                      overflow: 'hidden',
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

                  {/* Time Display */}
                  <div
                    style={{
                      marginTop: '16px',
                      backgroundColor: '#FAFAFA',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(124, 179, 66, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={24} weight="regular" color="#7CB342" />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.875rem',
                          color: '#757575',
                        }}
                      >
                        Waktu Reminder
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: '#2C2C2C',
                        }}
                      >
                        07:00 WIB (setiap hari)
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Save Button at bottom */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 24px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F5F5F5',
        }}
      >
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
      </div>

      {/* Toast notification (matching Home.tsx style) */}
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
              justifyContent: 'space-between',
              gap: '12px',
              zIndex: 4000,
            }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                color: '#2C2C2C',
                margin: 0,
                flex: 1,
              }}
            >
              {toastMessage}
            </p>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="#757575"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
