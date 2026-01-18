'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, WhatsappLogo, Clock, Bell } from '@phosphor-icons/react';
import { useNotificationSettings, formatWhatsAppNumber, isValidIndonesianNumber } from '@/hooks/useNotificationSettings';
import { useToast } from '@/hooks/useToast';
import { Skeleton, Toast } from '@/components/shared';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface NotificationSettingsProps {
  onBack: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const { settings, logs, loading, logsLoading, updateSettings, fetchLogs } = useNotificationSettings();
  const { toast, showToast, hideToast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  // Fetch logs on mount
  useEffect(() => {
    fetchLogs(5);
  }, [fetchLogs]);

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
      showToast('Pengaturan disimpan', { type: 'success' });
    } else {
      showToast(result.error || 'Gagal simpan. Coba lagi ya!', { type: 'error' });
      if (result.error?.includes('nomor')) {
        setPhoneError(result.error);
      }
    }

    setIsSaving(false);
  };

  // Format date for log display
  const formatLogDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "d MMM yyyy, HH:mm", { locale: idLocale });
    } catch {
      return dateStr;
    }
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
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#FAFAFA',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
        </motion.button>
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#2D5016',
            margin: 0,
          }}
        >
          Notifikasi
        </h1>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton.Box height={80} borderRadius={12} />
            <Skeleton.Box height={60} borderRadius={12} />
            <Skeleton.Box height={60} borderRadius={12} />
          </div>
        ) : (
          <>
            {/* WhatsApp Reminder Section */}
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 16px 0',
                }}
              >
                WhatsApp Reminder
              </h2>

              {/* Toggle Card */}
              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: enabled ? 'rgba(37, 211, 102, 0.1)' : '#EEEEEE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <WhatsappLogo
                      size={24}
                      weight="fill"
                      color={enabled ? '#25D366' : '#999999'}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9375rem',
                      color: '#2C2C2C',
                    }}
                  >
                    Aktifkan reminder harian via WA
                  </span>
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
                      }}
                    >
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

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isSaving ? '#E0E0E0' : '#7CB342',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: isSaving ? 'not-allowed' : 'pointer',
                marginBottom: '32px',
              }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </motion.button>

            {/* Notification History */}
            <div>
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Bell size={20} weight="regular" color="#757575" />
                Riwayat Notifikasi
              </h2>

              {logsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton.Box height={48} borderRadius={8} />
                  <Skeleton.Box height={48} borderRadius={8} />
                  <Skeleton.Box height={48} borderRadius={8} />
                </div>
              ) : logs.length === 0 ? (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    color: '#999999',
                    textAlign: 'center',
                    padding: '24px',
                  }}
                >
                  Belum ada riwayat notifikasi
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: '#FAFAFA',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: log.status === 'sent' ? 'rgba(124, 179, 66, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {log.status === 'sent' ? (
                            <Check size={14} weight="bold" color="#7CB342" />
                          ) : (
                            <X size={14} weight="bold" color="#F44336" />
                          )}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '0.875rem',
                              color: '#2C2C2C',
                            }}
                          >
                            {formatLogDate(log.sent_at)}
                          </p>
                          {log.status === 'sent' ? (
                            <p
                              style={{
                                margin: '2px 0 0 0',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.75rem',
                                color: '#757575',
                              }}
                            >
                              {log.plants_count} tanaman
                            </p>
                          ) : (
                            <p
                              style={{
                                margin: '2px 0 0 0',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.75rem',
                                color: '#F44336',
                              }}
                            >
                              Gagal
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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

export default NotificationSettings;
