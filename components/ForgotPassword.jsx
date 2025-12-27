/**
 * Forgot Password Screen Component
 *
 * Sends password reset email
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiSlash, CircleNotch, CheckCircle, ArrowLeft } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('ForgotPassword');

const ForgotPassword = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isOnline } = useOnlineStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email harus diisi.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: resetError } = await auth.resetPasswordForEmail(email);

      if (resetError) {
        debug.error('Reset password error:', resetError);
        setError('Gagal mengirim email reset. Coba lagi.');
      } else {
        setShowSuccess(true);
      }
    } catch (err) {
      debug.error('Reset password error:', err);
      setError('Gagal mengirim email reset. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <main
        role="main"
        aria-label="Email Reset Terkirim"
        style={{
          display: 'flex',
          width: '100%',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          background: '#FFFFFF',
          padding: '40px 24px',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#F1F8E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle size={48} weight="fill" color="#7CB342" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center', maxWidth: '320px' }}
        >
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '2rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: '0 0 12px 0',
            }}
          >
            Cek Email Kamu!
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#757575',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Kami sudah kirim link reset password ke <strong style={{ color: '#2C2C2C' }}>{email}</strong>.
            Klik link di email untuk mengatur ulang password kamu.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate?.('login')}
          style={{
            padding: '14px 32px',
            fontSize: '1rem',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF',
            backgroundColor: '#7CB342',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          Kembali ke Login
        </motion.button>
      </main>
    );
  }

  return (
    <main
      role="main"
      aria-label="Halaman Lupa Password"
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        background: '#FFFFFF',
        padding: '60px 16px 40px',
      }}
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNavigate?.('login')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Kembali ke login"
      >
        <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
      </motion.button>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginTop: '40px' }}
      >
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '2.5rem',
            fontWeight: 600,
            color: '#2D5016',
            margin: '0 0 12px 0',
          }}
        >
          Lupa Password?
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#757575',
            margin: 0,
            maxWidth: '300px',
            lineHeight: 1.5,
          }}
        >
          Masukkan email kamu, kami akan kirim link untuk reset password.
        </p>
      </motion.div>

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
              Kamu lagi offline. Reset password butuh koneksi internet ya!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              role="alert"
              aria-live="polite"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#DC2626',
                margin: 0,
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#FEF2F2',
                borderRadius: '8px',
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Email Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="email"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#2C2C2C',
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            disabled={!isOnline || isLoading}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              fontFamily: "'Inter', sans-serif",
              color: '#2C2C2C',
              backgroundColor: '#FAFAFA',
              border: '2px solid transparent',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 200ms',
            }}
            onFocus={(e) => (e.target.style.border = '2px solid #7CB342')}
            onBlur={(e) => (e.target.style.border = '2px solid transparent')}
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isOnline || isLoading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1rem',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF',
            backgroundColor: !isOnline || isLoading ? '#CCCCCC' : '#7CB342',
            border: 'none',
            borderRadius: '12px',
            cursor: !isOnline || isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 200ms',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {isLoading ? (
            <>
              <CircleNotch size={20} weight="bold" className="animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Link Reset'
          )}
        </motion.button>
      </motion.form>

      {/* Back to Login Link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: '#757575',
          textAlign: 'center',
        }}
      >
        Ingat password?{' '}
        <button
          type="button"
          onClick={() => onNavigate?.('login')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#7CB342',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Login
        </button>
      </motion.p>
    </main>
  );
};

export default ForgotPassword;
