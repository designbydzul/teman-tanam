'use client';

/**
 * Notification Settings Full Page
 *
 * A full-page overlay (like LocationSettings) for managing WhatsApp notifications.
 * Includes OTP verification for phone numbers to avoid excessive API calls.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, WhatsappLogo, Clock, Check, X } from '@phosphor-icons/react';
import { useNotificationSettings, isValidIndonesianNumber } from '@/hooks/useNotificationSettings';
import { GlobalOfflineBanner } from '@/components/shared';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('NotificationSettings');

interface NotificationSettingsProps {
  onBack: () => void;
  onSuccess?: (message: string) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onBack,
  onSuccess,
}) => {
  const { settings, loading, updateSettings } = useNotificationSettings();

  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reminderHour, setReminderHour] = useState('07');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP verification state
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load settings from hook
  useEffect(() => {
    if (settings && !loading) {
      setEnabled(settings.whatsapp_enabled);
      // Display the number without the 62 prefix for better UX
      if (settings.whatsapp_number) {
        const displayNumber = settings.whatsapp_number.startsWith('62')
          ? settings.whatsapp_number.substring(2)
          : settings.whatsapp_number;
        setPhoneNumber(displayNumber);
        // If there's an existing number, consider it verified
        setIsPhoneVerified(true);
      }
      // Set reminder hour (extract just the hour from HH:MM:SS)
      if (settings.reminder_time) {
        const hour = settings.reminder_time.substring(0, 2); // Get HH
        setReminderHour(hour);
      }
    }
  }, [settings, loading]);

  // Validate phone number on change
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);

    // Reset verification when phone number changes
    if (digitsOnly !== phoneNumber) {
      setIsPhoneVerified(false);
    }

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError(null);
    }
  };

  // Handle enable/disable toggle
  const handleToggleChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    // Clear phone error when disabled
    if (!newEnabled && phoneError) {
      setPhoneError(null);
    }
  };

  // Send OTP to WhatsApp
  const handleSendOtp = async () => {
    debug.log('handleSendOtp called', { phoneNumber });

    // Validate phone number
    if (!phoneNumber.trim()) {
      setPhoneError('Masukkan nomor WhatsApp dulu');
      return;
    }

    if (!isValidIndonesianNumber(phoneNumber)) {
      setPhoneError('Format nomor gak valid. Contoh: 81234567890');
      return;
    }

    setIsSendingOtp(true);

    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Send OTP via WhatsApp
      const response = await fetch('/api/notifications/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp_number: phoneNumber,
          otp_code: otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show OTP modal
        setShowOtpModal(true);
        showToastMessage('Kode OTP sudah dikirim ke WhatsApp!');
      } else {
        setPhoneError(data.error || 'Gagal kirim OTP');
      }
    } catch (error) {
      debug.error('Error sending OTP:', error);
      setPhoneError('Gagal kirim OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    debug.log('handleVerifyOtp called', { otpCode });

    if (!otpCode.trim()) {
      setOtpError('Masukkan kode OTP');
      return;
    }

    if (otpCode.length !== 6) {
      setOtpError('Kode OTP harus 6 digit');
      return;
    }

    setIsVerifyingOtp(true);

    // Verify OTP matches
    if (otpCode === generatedOtp) {
      setIsPhoneVerified(true);
      setShowOtpModal(false);
      setOtpCode('');
      setOtpError(null);
      showToastMessage('Nomor WhatsApp berhasil diverifikasi!');
    } else {
      setOtpError('Kode OTP salah. Coba lagi ya!');
    }

    setIsVerifyingOtp(false);
  };

  // Handle save
  const handleSave = async () => {
    debug.log('handleSave called', { enabled, phoneNumber, reminderHour, isPhoneVerified });

    // Validate if enabled
    if (enabled) {
      if (!phoneNumber.trim()) {
        setPhoneError('Masukkan nomor WhatsApp');
        return;
      }

      if (!isValidIndonesianNumber(phoneNumber)) {
        setPhoneError('Format nomor gak valid. Contoh: 81234567890');
        return;
      }

      if (!isPhoneVerified) {
        setPhoneError('Verifikasi nomor WhatsApp dulu');
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
      // Success - call onBack and show success message via parent
      if (onSuccess) {
        onSuccess('Pengaturan notifikasi berhasil disimpan!');
      }
      onBack();
    } else {
      showToastMessage(result.error || 'Gagal simpan. Coba lagi ya!');
      if (result.error?.includes('nomor')) {
        setPhoneError(result.error);
      }
    }

    setIsSaving(false);
  };

  return (
    <div
      className="ios-fixed-container"
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 3000,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {/* Global Offline Banner */}
      <GlobalOfflineBanner />

      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F5F5F5',
          zIndex: 10,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Back Button */}
          <button
            onClick={onBack}
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
            Atur Notifikasi
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', paddingBottom: '100px', minHeight: 'calc(100vh - 100px)' }}>
        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#757575' }}>
            Memuat pengaturan...
          </div>
        ) : (
          <>
            {/* Enable Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: enabled ? '24px' : '0',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#2C2C2C',
                    margin: '0 0 4px 0',
                  }}
                >
                  Aktifkan Reminder WhatsApp
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    color: '#757575',
                    margin: 0,
                  }}
                >
                  Notifikasi harian via WhatsApp
                </p>
              </div>
              <button
                onClick={() => handleToggleChange(!enabled)}
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '32px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: enabled ? '#7CB342' : '#E0E0E0',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: enabled ? '28px' : '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>

            {/* Settings - only show if enabled */}
            {enabled && (
              <>
                {/* Nomor WhatsApp */}
                <div style={{ marginBottom: '16px' }}>
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
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: phoneError
                        ? '2px solid #F44336'
                        : focusedInput === 'phone'
                        ? '2px solid #7CB342'
                        : '2px solid #E0E0E0',
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
                      onFocus={() => setFocusedInput('phone')}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="81234567890"
                      disabled={isPhoneVerified}
                      style={{
                        flex: 1,
                        padding: '14px',
                        fontSize: '0.9375rem',
                        fontFamily: "'Inter', sans-serif",
                        color: '#2C2C2C',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        opacity: isPhoneVerified ? 0.6 : 1,
                      }}
                    />
                    {/* OTP Button or Verified Badge */}
                    {isPhoneVerified ? (
                      <div
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#E8F5E9',
                          color: '#7CB342',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          marginRight: '8px',
                          borderRadius: '8px',
                        }}
                      >
                        <Check size={16} weight="bold" />
                        Terverifikasi
                      </div>
                    ) : (
                      <button
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !phoneNumber}
                        style={{
                          padding: '8px 16px',
                          marginRight: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isSendingOtp || !phoneNumber ? '#E0E0E0' : '#7CB342',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          cursor: isSendingOtp || !phoneNumber ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                      </button>
                    )}
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

                {/* Waktu Reminder */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.875rem',
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
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: focusedInput === 'time' ? '2px solid #7CB342' : '2px solid #E0E0E0',
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
              </>
            )}
          </>
        )}
      </div>

      {/* Save Button - Fixed at bottom */}
      {!loading && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F0F0F0',
            zIndex: 100,
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <>
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isVerifyingOtp && setShowOtpModal(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4000,
              }}
            />

            {/* Modal Container - for centering */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: 'var(--app-max-width)',
                zIndex: 4001,
              }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px 12px 0 0',
                  padding: '24px',
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => !isVerifyingOtp && setShowOtpModal(false)}
                  disabled={isVerifyingOtp}
                  aria-label="Tutup"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isVerifyingOtp ? 'not-allowed' : 'pointer',
                    opacity: isVerifyingOtp ? 0.5 : 1,
                  }}
                >
                  <X size={20} weight="regular" color="#757575" />
                </button>

                {/* Modal Title */}
                <h2
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#2C2C2C',
                    margin: '0 0 8px 0',
                  }}
                >
                  Verifikasi Nomor WhatsApp
                </h2>

                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    color: '#757575',
                    margin: '0 0 24px 0',
                  }}
                >
                  Masukkan kode OTP yang sudah dikirim ke nomor WhatsApp +62{phoneNumber}
                </p>

                {/* OTP Input */}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    if (otpError) setOtpError(null);
                  }}
                  placeholder="Masukkan 6 digit kode OTP"
                  disabled={isVerifyingOtp}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1.25rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: otpError ? '2px solid #F44336' : '2px solid #E0E0E0',
                    borderRadius: '12px',
                    outline: 'none',
                    marginBottom: otpError ? '8px' : '16px',
                    textAlign: 'center',
                    letterSpacing: '4px',
                    opacity: isVerifyingOtp ? 0.5 : 1,
                  }}
                />
                {otpError && (
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75rem',
                      color: '#F44336',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {otpError}
                  </p>
                )}

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || isVerifyingOtp}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: otpCode.length === 6 && !isVerifyingOtp ? '#7CB342' : '#E0E0E0',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: otpCode.length === 6 && !isVerifyingOtp ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isVerifyingOtp ? 'Memverifikasi...' : 'Verifikasi'}
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: 'calc(100% - 48px)',
              backgroundColor: '#2C2C2C',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              fontFamily: "'Inter', sans-serif",
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Check size={20} weight="bold" color="#7CB342" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSettings;
