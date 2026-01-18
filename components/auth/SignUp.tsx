'use client';

/**
 * Sign Up Screen Component
 *
 * Email/password registration with Google OAuth option
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiSlash, Eye, EyeSlash, CircleNotch, CheckCircle } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';
import { Input } from '@/components/shared';

const debug = createDebugger('SignUp');

type NavigateScreen = 'login' | 'signup';

interface SignUpProps {
  onNavigate?: (screen: NavigateScreen) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isOnline } = useOnlineStatus();

  // Password validation
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email harus diisi.');
      return;
    }

    if (!password.trim()) {
      setError('Password harus diisi.');
      return;
    }

    if (password.length < 8) {
      setError('Password harus minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await auth.signUp(email, password);

      if (signUpError) {
        // Map common errors to Indonesian
        let errorMessage = signUpError.message;
        if (signUpError.message.includes('already registered')) {
          errorMessage = 'Email ini sudah terdaftar. Coba login atau gunakan email lain.';
        } else if (signUpError.message.includes('Password should be')) {
          errorMessage = 'Password harus minimal 8 karakter.';
        } else if (signUpError.message.includes('Invalid email')) {
          errorMessage = 'Format email tidak valid.';
        }
        setError(errorMessage);
      } else {
        // Check if email confirmation is required
        if (!data.session) {
          setShowSuccess(true);
        } else {
          // Auto-logged in (email confirmation disabled)
          onNavigate?.('login');
        }
      }
    } catch (err) {
      debug.error('Sign up error:', err);
      setError('Gagal mendaftar. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await auth.signInWithGoogle();
      // Redirect will happen automatically
    } catch (err) {
      debug.error('Google login error:', err);
      setError((err as Error).message || 'Gagal login dengan Google. Coba lagi.');
    }
  };

  // Success state - show confirmation message
  if (showSuccess) {
    return (
      <main
        role="main"
        aria-label="Pendaftaran Berhasil"
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
          <CheckCircle size={48} weight="regular" color="#7CB342" />
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
            Kami sudah kirim link konfirmasi ke <strong style={{ color: '#2C2C2C' }}>{email}</strong>.
            Klik link di email untuk mengaktifkan akun kamu.
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
      aria-label="Halaman Daftar"
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        background: '#FFFFFF',
        padding: '60px 16px 40px',
      }}
    >
      {/* App Name / Logo */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '3rem',
          fontWeight: 600,
          color: '#2D5016',
          textAlign: 'center',
          margin: 0,
          marginTop: '20px',
        }}
      >
        Teman Tanam
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          color: '#757575',
          textAlign: 'center',
          margin: 0,
        }}
      >
        Buat akun baru
      </motion.p>

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
            <WifiSlash size={20} weight="regular" color="#757575" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#92400E',
                lineHeight: 1.4,
              }}
            >
              Kamu lagi offline. Daftar butuh koneksi internet ya!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Up Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSignUp}
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
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            disabled={!isOnline || isLoading}
          />
        </div>

        {/* Password Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="password"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#2C2C2C',
            }}
          >
            Password
          </label>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            disabled={!isOnline || isLoading}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <EyeSlash size={22} weight="regular" color="#757575" />
                ) : (
                  <Eye size={22} weight="regular" color="#757575" />
                )}
              </button>
            }
          />
          {password && !isPasswordValid && (
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#DC2626',
              }}
            >
              Password harus minimal 8 karakter
            </span>
          )}
        </div>

        {/* Confirm Password Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="confirmPassword"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#2C2C2C',
            }}
          >
            Konfirmasi Password
          </label>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            disabled={!isOnline || isLoading}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showConfirmPassword ? (
                  <EyeSlash size={22} weight="regular" color="#757575" />
                ) : (
                  <Eye size={22} weight="regular" color="#757575" />
                )}
              </button>
            }
          />
          {confirmPassword && !doPasswordsMatch && (
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#DC2626',
              }}
            >
              Password tidak sama
            </span>
          )}
        </div>

        {/* Sign Up Button */}
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
              <CircleNotch size={20} weight="regular" className="animate-spin" />
              Mendaftar...
            </>
          ) : (
            'Daftar'
          )}
        </motion.button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            margin: '8px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E0E0E0' }} />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#757575',
            }}
          >
            atau
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E0E0E0' }} />
        </div>

        {/* Google Sign-In Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isOnline}
          aria-label="Daftar dengan akun Google"
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1rem',
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
        >
          {/* Google Icon SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
        </motion.button>
      </motion.form>

      {/* Login Link */}
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
        Sudah punya akun?{' '}
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

export default SignUp;
