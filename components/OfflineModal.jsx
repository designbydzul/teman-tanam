import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiSlash } from '@phosphor-icons/react';

/**
 * OfflineModal Component
 *
 * Shows a friendly modal when user tries to access online-only features while offline.
 */
const OfflineModal = ({ isOpen, onClose, featureName = null }) => {
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '32px 24px',
                width: '100%',
                maxWidth: '320px',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF3E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <WifiSlash size={36} weight="duotone" color="#E65100" />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 12px 0',
                }}
              >
                Tidak ada koneksi
              </h2>

              {/* Message */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  color: '#666666',
                  lineHeight: 1.5,
                  margin: '0 0 24px 0',
                }}
              >
                {featureName
                  ? `${featureName} membutuhkan koneksi internet. Coba lagi nanti ya!`
                  : 'Fitur ini membutuhkan koneksi internet. Coba lagi nanti ya!'}
              </p>

              {/* Button */}
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#7CB342',
                  color: '#FFFFFF',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#689F38';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#7CB342';
                }}
              >
                Oke, mengerti
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OfflineModal;
