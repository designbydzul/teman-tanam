/**
 * Login Screen Component
 *
 * Passwordless authentication via magic link email
 * Also supports Google OAuth sign-in
 * Design matches Figma specifications exactly
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagicLinkModal from './MagicLinkModal';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiSlash } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('Login');

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [error, setError] = useState('');
  const { isOnline } = useOnlineStatus();

  // Disable buttons when offline or loading
  const isButtonDisabled = !isOnline || isLoading;

  const handleEmailSubmit = async (e) => {
    // Prevent all default behaviors
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Don't proceed if already loading or no email
    if (isLoading || !email) return;

    setIsLoading(true);
    setError('');

    debug.log('Sending magic link to:', email);

    try {
      const result = await auth.sendMagicLink(email);
      debug.log('Magic link sent successfully:', result);
      setShowModal(true);
    } catch (err) {
      debug.error('Magic link error:', err);
      setError(err.message || 'Gagal mengirim magic link. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMagicLink = async (emailToResend) => {
    try {
      await auth.sendMagicLink(emailToResend);
    } catch (err) {
      debug.error('Resend error:', err);
      throw err;
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

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
        width: '100vw',
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

      {/* Login Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleEmailSubmit}
        action="javascript:void(0)"
        method="post"
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Email Label */}
        <label
          htmlFor="email"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1rem',
            fontWeight: 400,
            color: '#757575', // Gray 600
            marginBottom: '-8px',
          }}
        >
          Email Kamu
        </label>

        {/* Email Input */}
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="emailkamu@email.com"
          required
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: '1rem',
            fontFamily: "'Inter', sans-serif",
            color: '#2C2C2C',
            backgroundColor: '#FAFAFA',
            border: inputFocused || email ? '2px solid #7CB342' : '2px solid transparent',
            borderRadius: '12px',
            outline: 'none',
            transition: 'border-color 200ms, background-color 200ms',
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />

        {/* Error Message */}
        {error && (
          <p
            role="alert"
            aria-live="polite"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#DC2626',
              margin: '-8px 0 0 0',
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        {/* Submit Button - Masuk atau Daftar */}
        <button
          type="submit"
          disabled={isButtonDisabled || !email}
          onClick={handleEmailSubmit}
          aria-label={isLoading ? 'Mengirim magic link' : 'Masuk atau daftar dengan email'}
          aria-busy={isLoading}
          style={{
            width: '100%',
            padding: '18px',
            fontSize: '1.125rem',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF',
            backgroundColor: !isOnline ? '#CCCCCC' : (isLoading ? '#9CCC65' : '#7CB342'),
            border: 'none',
            borderRadius: '12px',
            cursor: isButtonDisabled || !email ? 'not-allowed' : 'pointer',
            transition: 'all 200ms',
            opacity: isButtonDisabled || !email ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isButtonDisabled && email) {
              e.target.style.backgroundColor = '#689F38';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(124, 179, 66, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (isOnline) {
              e.target.style.backgroundColor = '#7CB342';
            }
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {isLoading ? 'Mengirim...' : 'Masuk atau Daftar'}
        </button>

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
      </motion.form>

      {/* Info Text - Optional */}
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
        Kami akan mengirimkan magic link ke email Anda untuk masuk tanpa password
      </motion.p>

      {/* Magic Link Modal */}
      <MagicLinkModal
        isOpen={showModal}
        onClose={handleModalClose}
        email={email}
        onResend={handleResendMagicLink}
      />
    </main>
  );
};

export default Login;
