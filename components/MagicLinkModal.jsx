import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MagicLinkModal = ({ isOpen, onClose, email }) => {
  const handleOpenEmail = () => {
    // Open default email client
    window.location.href = 'mailto:';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px 12px 0 0',
              padding: '24px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Title */}
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '18px',
                fontWeight: 600,
                color: '#666666',
                marginTop: '8px',
                marginBottom: '32px',
                textAlign: 'center',
              }}
            >
              Magic Link Berhasil Dikirim
            </h2>

            {/* Plant Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#F1F8E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 35C20 35 8 28 8 18C8 13.5817 11.5817 10 16 10C17.8885 10 19.6089 10.6584 21 11.7639C22.3911 10.6584 24.1115 10 26 10C30.4183 10 34 13.5817 34 18C34 28 22 35 20 35Z"
                  fill="#7CB342"
                />
                <path
                  d="M20 11.7639V35"
                  stroke="#2D5016"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* "Coba check" text */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 400,
                color: '#666666',
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              Coba check
            </p>

            {/* Email */}
            <p
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '24px',
                fontWeight: 600,
                color: '#2D5016',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {email}
            </p>

            {/* Instruction text */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 400,
                color: '#666666',
                marginBottom: '32px',
                textAlign: 'center',
                lineHeight: '1.5',
              }}
            >
              Tekan link yang kamu terima,
              <br />
              gak usah inget2 password lagi cape
            </p>

            {/* Buka Email Button */}
            <button
              onClick={handleOpenEmail}
              className="bg-green-fresh"
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#7CB342',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#689F38';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#7CB342';
              }}
            >
              Buka Email
            </button>

            {/* Kirim Ulang Button */}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: '#666666',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              Kirim Ulang
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MagicLinkModal;
