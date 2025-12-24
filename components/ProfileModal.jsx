import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChartBar } from '@phosphor-icons/react';
import { auth } from '@/lib/supabase';

const ProfileModal = ({
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
  console.log('ProfileModal render - userPhoto:', !!userPhoto);

  const handleMenuAction = async (action) => {
    console.log('Menu action:', action);

    if (action === 'logout') {
      onClose();
      // Small delay to ensure modal closes before logout
      setTimeout(async () => {
        try {
          // Sign out from Supabase
          await auth.signOut();
        } catch (err) {
          console.error('Logout error:', err);
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
                maxHeight: '85vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
            {/* Close Button */}
            <button
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Profile Picture */}
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '24px',
                backgroundColor: userPhoto ? 'transparent' : '#F5F5F5',
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
                <User size={48} weight="regular" color="#CCCCCC" />
              )}
            </div>

            {/* User Name */}
            <h2
              style={{
                fontFamily: 'var(--font-caveat), Caveat, cursive',
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
                color: '#666666',
                margin: '0 0 32px 0',
              }}
            >
              {userEmail || ''}
            </p>

            {/* Menu Items */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Edit Profile */}
              <button
                onClick={() => handleMenuAction('edit-profile')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#F5F5F5')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
              </button>

              {/* Pengaturan Lokasi Tanam */}
              <button
                onClick={() => handleMenuAction('location-settings')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#F5F5F5')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="10"
                    r="3"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Pengaturan Lokasi Tanam
                </span>
              </button>

              {/* Bantuan & Komunitas */}
              <button
                onClick={() => handleMenuAction('help-community')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#F5F5F5')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
              </button>

              {/* Tutorial */}
              <button
                onClick={() => handleMenuAction('tutorial')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#F5F5F5')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="10 8 16 12 10 16 10 8"
                    fill="#2C2C2C"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                  }}
                >
                  Tutorial
                </span>
              </button>

              {/* Tampilkan Statistik Toggle */}
              <div
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ChartBar size={24} weight="regular" color="#2C2C2C" />
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
              <button
                onClick={() => handleMenuAction('logout')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  marginTop: '12px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="#DC2626"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
