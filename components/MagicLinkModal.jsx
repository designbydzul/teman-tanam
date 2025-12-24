import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MagicLinkModal = ({ isOpen, onClose, email, onResend }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleOpenEmail = () => {
    // Detect email provider and open appropriate app/URL
    const emailDomain = email?.split('@')[1]?.toLowerCase();

    let emailUrl = 'mailto:'; // Default fallback

    if (emailDomain?.includes('gmail')) {
      emailUrl = 'https://mail.google.com';
    } else if (emailDomain?.includes('yahoo')) {
      emailUrl = 'https://mail.yahoo.com';
    } else if (emailDomain?.includes('outlook') || emailDomain?.includes('hotmail') || emailDomain?.includes('live')) {
      emailUrl = 'https://outlook.live.com';
    } else if (emailDomain?.includes('icloud')) {
      emailUrl = 'https://www.icloud.com/mail';
    } else {
      // For other providers, try to open native email app on mobile
      // This works better on mobile devices
      emailUrl = 'mailto:';
    }

    window.open(emailUrl, '_blank');
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);

    // Call the onResend callback if provided, otherwise simulate
    if (onResend) {
      await onResend(email);
    } else {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsResending(false);
    setResendSuccess(true);

    // Reset success message after 3 seconds
    setTimeout(() => setResendSuccess(false), 3000);
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
              zIndex: 999,
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
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px 12px 0 0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Tutup"
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
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: resendSuccess ? '#7CB342' : '#666666',
                cursor: isResending ? 'not-allowed' : 'pointer',
                padding: '8px',
                opacity: isResending ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              {isResending ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#666666"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="31.4 31.4"
                    />
                  </svg>
                  <style>
                    {`
                      @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                  Mengirim...
                </>
              ) : resendSuccess ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="#7CB342"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Magic link terkirim!
                </>
              ) : (
                'Kirim Ulang'
              )}
            </button>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MagicLinkModal;
