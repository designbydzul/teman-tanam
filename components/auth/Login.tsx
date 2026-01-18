/**
 * Login Screen Component
 *
 * Email/password login with Google OAuth option
 * Design matches app specifications
 */

'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiSlash, Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';
import { Input } from '@/components/shared';

const debug = createDebugger('Login');

type AuthScreen = 'login' | 'signup' | 'forgot-password';

interface LoginProps {
  onLogin?: () => void;
  onNavigate?: (screen: AuthScreen) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isOnline } = useOnlineStatus();

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email dan password harus diisi.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: loginError } = await auth.signInWithPassword(email, password);
      if (loginError) {
        // Map common errors to Indonesian
        let errorMessage = loginError.message;
        if (loginError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email atau password salah. Coba lagi.';
        } else if (loginError.message.includes('Email not confirmed')) {
          errorMessage = 'Email belum dikonfirmasi. Cek inbox kamu.';
        }
        setError(errorMessage);
      } else {
        onLogin?.();
      }
    } catch (err) {
      debug.error('Email login error:', err);
      setError('Gagal login. Coba lagi.');
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
        gap: '32px',
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
          marginTop: '40px',
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
        onSubmit={handleEmailLogin}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Masukkan password"
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
        </div>

        {/* Forgot Password Link */}
        <button
          type="button"
          onClick={() => onNavigate?.('forgot-password')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#7CB342',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'right',
            marginTop: '-8px',
          }}
        >
          Lupa password?
        </button>

        {/* Login Button */}
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
              Masuk...
            </>
          ) : (
            'Masuk'
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
          aria-label="Masuk dengan akun Google"
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

      {/* Sign Up Link */}
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
        Belum punya akun?{' '}
        <button
          type="button"
          onClick={() => onNavigate?.('signup')}
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
          Daftar
        </button>
      </motion.p>
    </main>
  );
};

export default Login;
