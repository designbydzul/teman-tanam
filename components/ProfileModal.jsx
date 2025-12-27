import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChartBar, X, PencilSimple, MapPin, Question, Play, SignOut } from '@phosphor-icons/react';
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

    // Open Telegram group for help & community
    if (action === 'help-community') {
      window.open('https://t.me/+aRqNdBkX9Gs4NmU9', '_blank');
      onClose();
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
                  Pengaturan Lokasi Tanam
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

              {/* Tutorial */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('tutorial')}
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
                  <Play size={20} weight="fill" color="#757575" />
                </div>
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
