'use client';

/**
 * WhatsApp Setup Screen
 *
 * Optional screen shown after user adds their first plant.
 * Allows users to enable WhatsApp reminders for watering and fertilizing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, WhatsappLogo } from '@phosphor-icons/react';
import { useNotificationSettings, isValidIndonesianNumber } from '@/hooks/useNotificationSettings';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/shared';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('WhatsAppSetup');

interface WhatsAppSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

const WhatsAppSetup: React.FC<WhatsAppSetupProps> = ({ onComplete, onSkip }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateSettings } = useNotificationSettings();
  const { toast, showToast, hideToast } = useToast();
  const completeTimer = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (completeTimer.current) {
        clearTimeout(completeTimer.current);
      }
    };
  }, []);

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
      const result = await updateSettings(true, phoneNumber);

      if (result.success) {
        showToast('Siap! Kamu akan dapat reminder tiap pagi', { type: 'success' });
        // Small delay to show toast
        completeTimer.current = setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setPhoneError(result.error || 'Gagal menyimpan. Coba lagi ya!');
        setIsSubmitting(false);
      }
    } catch (error) {
      debug.error('Error enabling WhatsApp:', error);
      setPhoneError('Gagal menyimpan. Coba lagi ya!');
      setIsSubmitting(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    debug.log('handleSkip called');
    onSkip();
  };

  return (
    <div
      style={{
        height: '100vh',
        // @ts-expect-error - 100dvh is valid but TypeScript doesn't recognize it
        height: '100dvh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable content area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px 24px 24px 24px',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            backgroundColor: 'rgba(37, 211, 102, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <Bell size={40} weight="fill" color="#25D366" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '2rem',
            fontWeight: 600,
            color: '#2D5016',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Mau diingetin siram & pupuk?
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1rem',
            color: '#757575',
            textAlign: 'center',
            margin: '12px 0 32px 0',
            lineHeight: 1.6,
            maxWidth: '300px',
          }}
        >
          Kami bisa kirim reminder harian via WhatsApp kalau ada tanaman yang butuh perhatian.
        </motion.p>

        {/* Phone Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ width: '100%', maxWidth: '320px' }}
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
          {phoneError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                margin: '8px 0 0 0',
                fontSize: '0.75rem',
                color: '#F44336',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {phoneError}
            </motion.p>
          )}
        </motion.div>
      </motion.div>

      {/* Bottom Buttons - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          flexShrink: 0,
          padding: '16px 24px 24px 24px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F0F0F0',
        }}
      >
        {/* Enable Button */}
        <motion.button
          type="button"
          onClick={handleEnable}
          disabled={isSubmitting}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            padding: '16px',
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
            marginBottom: '12px',
          }}
        >
          <WhatsappLogo size={20} weight="fill" />
          {isSubmitting ? 'Menyimpan...' : 'Ya, Aktifkan Reminder'}
        </motion.button>

        {/* Skip Button */}
        <motion.button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: 'none',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#757575',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            textDecoration: 'none',
          }}
        >
          Nanti aja, skip →
        </motion.button>
      </motion.div>

      {/* Toast notification */}
      <Toast
        isVisible={!!toast}
        message={toast?.message || ''}
        type={toast?.type}
        variant="action"
        onClose={hideToast}
      />
    </div>
  );
};

export default WhatsAppSetup;
