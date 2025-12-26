/**
 * Login Screen Component
 *
 * Google OAuth sign-in only
 * Design matches Figma specifications exactly
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiSlash } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('Login');

const Login = ({ onLogin }) => {
  const [error, setError] = useState('');
  const { isOnline } = useOnlineStatus();

  const handleGoogleLogin = async () => {
    try {
      await auth.signInWithGoogle();
      // Redirect will happen automatically
    } catch (err) {
      debug.error('Google login error:', err);
      setError(err.message || 'Gagal login dengan Google. Coba lagi.');
    }
  };

  return (
    <main
      role="main"
      aria-label="Halaman Login"
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        background: '#FFFFFF',
        padding: '80px 30px 40px',
      }}
    >
      {/* App Name / Logo */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '3.5rem',
          fontWeight: 600,
          color: '#2D5016', // Green Forest
          textAlign: 'center',
          margin: 0,
          marginTop: '60px',
        }}
      >
        Teman Tanam
      </motion.h1>

      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 20px',
              backgroundColor: '#FEF3C7',
              borderRadius: '12px',
              maxWidth: '360px',
              width: '100%',
              marginTop: '-20px',
            }}
          >
            <WifiSlash size={22} weight="bold" color="#D97706" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#92400E',
                lineHeight: 1.4,
              }}
            >
              Kamu lagi offline. Login butuh koneksi internet ya!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Error Message */}
        {error && (
          <p
            role="alert"
            aria-live="polite"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#DC2626',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isOnline}
          aria-label="Masuk dengan akun Google"
          style={{
            width: '100%',
            padding: '18px',
            fontSize: '1.125rem',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            color: !isOnline ? '#999999' : '#2C2C2C',
            backgroundColor: !isOnline ? '#F5F5F5' : '#FFFFFF',
            border: '2px solid #E0E0E0',
            borderRadius: '12px',
            cursor: !isOnline ? 'not-allowed' : 'pointer',
            transition: 'all 200ms',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: !isOnline ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (isOnline) {
              e.target.style.backgroundColor = '#FAFAFA';
              e.target.style.borderColor = '#BDBDBD';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (isOnline) {
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.borderColor = '#E0E0E0';
            }
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {/* Google Icon SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Lanjutkan dengan Google
        </button>
      </motion.div>

      {/* Info Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.875rem',
          color: '#757575',
          textAlign: 'center',
          maxWidth: '320px',
          lineHeight: 1.6,
        }}
      >
        Masuk dengan akun Google Anda untuk melanjutkan
      </motion.p>
    </main>
  );
};

export default Login;
