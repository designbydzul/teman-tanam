'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChartBar, X, PencilSimple, MapPin, Question, Info, SignOut, Bell } from '@phosphor-icons/react';
import { auth } from '@/lib/supabase';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('ProfileModal');

type MenuAction = 'edit-profile' | 'location-settings' | 'notification-settings' | 'help-community' | 'about' | 'logout';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string | null;
  onNavigate?: (action: MenuAction) => void;
  onLogout?: () => void;
  showStats?: boolean;
  onToggleStats?: (show: boolean) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  userPhoto,
  onNavigate,
  onLogout,
  showStats,
  onToggleStats,
}) => {
  const router = useRouter();
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  debug.log('render - userPhoto:', !!userPhoto);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, []);

  const handleMenuAction = async (action: MenuAction) => {
    debug.log('Menu action:', action);

    // Show notification settings as full-page overlay (like location settings)
    if (action === 'notification-settings') {
      onClose();
      onNavigate?.(action);
      return;
    }

    if (action === 'logout') {
      onClose();
      // Small delay to ensure modal closes before logout
      logoutTimer.current = setTimeout(async () => {
        try {
          // Sign out from Supabase
          await auth.signOut();
        } catch (err) {
          debug.error('Logout error:', err);
        }

        // Clear localStorage
        localStorage.removeItem('userName');
        localStorage.removeItem('userLocations');
        localStorage.removeItem('temanTanamUserName');
        localStorage.removeItem('temanTanamUserEmail');
        localStorage.removeItem('temanTanamUserPhoto');
        localStorage.removeItem('temanTanamLocations');

        if (onLogout) {
          onLogout();
        } else {
          window.location.reload();
        }
      }, 100);
      return;
    }

    // Open WhatsApp group for help & community
    if (action === 'help-community') {
      window.open('https://chat.whatsapp.com/KPIwLgb5FydCn4jX20Vycu', '_blank');
      onClose();
      return;
    }

    // Navigate to landing page (Tentang Tanam)
    if (action === 'about') {
      onClose();
      if (onNavigate) {
        onNavigate(action);
      }
      return;
    }

    onClose();
    if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="ios-fixed-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />

          {/* Modal Sheet Container - for centering */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 'var(--app-max-width)',
              zIndex: 1001,
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
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
            {/* Close Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
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
                cursor: 'pointer',
              }}
            >
              <X size={20} weight="regular" color="#757575" />
            </motion.button>

            {/* Profile Picture */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '16px',
                backgroundColor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                overflow: 'hidden',
              }}
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <User size={56} weight="light" color="#BDBDBD" />
              )}
            </div>

            {/* User Name */}
            <h2
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '1.75rem',
                fontWeight: 600,
                color: '#2D5016',
                margin: '0 0 8px 0',
              }}
            >
              {userName || 'User'}
            </h2>

            {/* User Email */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#757575',
                margin: '0 0 32px 0',
              }}
            >
              {userEmail || ''}
            </p>

            {/* Menu Items */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Edit Profile */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('edit-profile')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PencilSimple size={20} weight="regular" color="#757575" />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Edit Profil
                </span>
              </motion.button>

              {/* Pengaturan Lokasi Tanam */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('location-settings')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={20} weight="regular" color="#757575" />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Lokasi Tanam
                </span>
              </motion.button>

              {/* Notifikasi */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('notification-settings')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={20} weight="regular" color="#757575" />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Notifikasi
                </span>
              </motion.button>

              {/* Bantuan & Komunitas */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('help-community')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Question size={20} weight="regular" color="#757575" />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Bantuan & Komunitas
                </span>
              </motion.button>

              {/* Tentang Tanam */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('about')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Info size={20} weight="regular" color="#757575" />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Tentang Tanam
                </span>
              </motion.button>

              {/* Tampilkan Statistik Toggle */}
              <div
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ChartBar size={20} weight="regular" color="#757575" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Tampilkan Statistik
                  </span>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => onToggleStats && onToggleStats(!showStats)}
                  style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '14px',
                    backgroundColor: showStats ? '#7CB342' : '#E0E0E0',
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
                      left: showStats ? '23px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Keluar (Logout) */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('logout')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#FEF2F2',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  marginTop: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SignOut size={20} weight="regular" color="#DC2626" />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#DC2626',
                  }}
                >
                  Keluar
                </span>
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
