'use client';

/**
 * Unified Auth Screen Component
 *
 * Single adaptive screen for login and signup
 * - Shows email input first
 * - Checks if email exists
 * - Shows password fields based on result
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  WifiSlash,
  Eye,
  EyeSlash,
  CircleNotch,
  ArrowLeft,
  CheckCircle,
} from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';
import { Input } from '@/components/shared';

const debug = createDebugger('AuthScreen');

// Auth flow states
const FLOW_STATES = {
  EMAIL: 'email',
  LOGIN: 'login',
  SIGNUP: 'signup',
  SUCCESS: 'success',
} as const;

type FlowState = typeof FLOW_STATES[keyof typeof FLOW_STATES];
type NavigateScreen = 'forgot-password' | 'login' | 'signup';
type ErrorField = 'email' | 'password' | 'confirmPassword' | '';

interface AuthScreenProps {
  onLogin?: () => void;
  onNavigate?: (screen: NavigateScreen, email?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onNavigate }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Flow state
  const [flowState, setFlowState] = useState<FlowState>(FLOW_STATES.EMAIL);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<ErrorField>('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { isOnline } = useOnlineStatus();

  // Validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Clear error helper
  const clearError = () => {
    setError('');
    setErrorField('');
  };

  // Check if email exists in database
  const checkEmailExists = async () => {
    if (!email.trim()) {
      setError('Email harus diisi');
      setErrorField('email');
      return;
    }

    if (!isEmailValid) {
      setError('Email gak valid nih');
      setErrorField('email');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.exists) {
          setFlowState(FLOW_STATES.LOGIN);
        } else {
          setFlowState(FLOW_STATES.SIGNUP);
        }
      } else {
        setError(data.error || 'Gagal cek email');
        setErrorField('email');
      }
    } catch (err) {
      debug.error('Check email error:', err);
      setError('Gagal cek email. Coba lagi ya!');
      setErrorField('email');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Password harus diisi');
      setErrorField('password');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const { error: loginError } = await auth.signInWithPassword(
        email.trim().toLowerCase(),
        password
      );

      if (loginError) {
        let errorMessage = loginError.message;
        if (loginError.message.includes('Invalid login credentials')) {
          errorMessage = 'Password salah';
        } else if (loginError.message.includes('Email not confirmed')) {
          errorMessage = 'Email belum dikonfirmasi. Cek inbox kamu ya!';
        }
        setError(errorMessage);
        setErrorField('password');
      } else {
        onLogin?.();
      }
    } catch (err) {
      debug.error('Login error:', err);
      setError('Gagal login. Coba lagi ya!');
      setErrorField('password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async () => {
    if (!password.trim()) {
      setError('Password harus diisi');
      setErrorField('password');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      setErrorField('password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password gak sama');
      setErrorField('confirmPassword');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const { data, error: signUpError } = await auth.signUp(
        email.trim().toLowerCase(),
        password
      );

      if (signUpError) {
        let errorMessage = signUpError.message;
        let field: ErrorField = 'password';
        if (signUpError.message.includes('already registered')) {
          errorMessage = 'Email ini sudah terdaftar';
          field = 'email';
          setFlowState(FLOW_STATES.LOGIN);
        } else if (signUpError.message.includes('Password should be')) {
          errorMessage = 'Password minimal 8 karakter';
          field = 'password';
        }
        setError(errorMessage);
        setErrorField(field);
      } else {
        // Check if email confirmation is required
        if (!data.session) {
          setSuccessMessage(`Link konfirmasi sudah dikirim ke ${email}. Cek inbox kamu ya!`);
          setFlowState(FLOW_STATES.SUCCESS);
        } else {
          onLogin?.();
        }
      }
    } catch (err) {
      debug.error('Signup error:', err);
      setError('Gagal daftar. Coba lagi ya!');
      setErrorField('password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      clearError();
      await auth.signInWithGoogle();
    } catch (err) {
      debug.error('Google login error:', err);
      setError((err as Error).message || 'Gagal login dengan Google');
      setErrorField('');
    }
  };

  // Go back to email state
  const handleChangeEmail = () => {
    setFlowState(FLOW_STATES.EMAIL);
    setPassword('');
    setConfirmPassword('');
    clearError();
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (flowState === FLOW_STATES.EMAIL) {
      checkEmailExists();
    } else if (flowState === FLOW_STATES.LOGIN) {
      handleLogin();
    } else if (flowState === FLOW_STATES.SIGNUP) {
      handleSignup();
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    if (isLoading) {
      if (flowState === FLOW_STATES.EMAIL) return 'Mengecek...';
      if (flowState === FLOW_STATES.LOGIN) return 'Login...';
      if (flowState === FLOW_STATES.SIGNUP) return 'Mendaftar...';
    }

    if (flowState === FLOW_STATES.EMAIL) return 'Lanjut';
    if (flowState === FLOW_STATES.LOGIN) return 'Login';
    if (flowState === FLOW_STATES.SIGNUP) return 'Daftar';

    return 'Lanjut';
  };

  // Success screen
  if (flowState === FLOW_STATES.SUCCESS) {
    return (
      <main
        role="main"
        aria-label="Sukses"
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
            {successMessage}
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleChangeEmail}
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
          Kembali
        </motion.button>
      </main>
    );
  }

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

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '0 8px',
        }}
      >
        {/* Change Email Link - shown after email is checked */}
        <AnimatePresence>
          {flowState !== FLOW_STATES.EMAIL && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={handleChangeEmail}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#7CB342',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={16} weight="bold" />
              Ganti email
            </motion.button>
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorField === 'email') clearError();
            }}
            placeholder="Email kamu"
            disabled={!isOnline || isLoading || flowState !== FLOW_STATES.EMAIL}
            autoFocus={flowState === FLOW_STATES.EMAIL}
          />
          {/* Email error message */}
          <AnimatePresence>
            {error && errorField === 'email' && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                role="alert"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  color: '#DC2626',
                }}
              >
                {error}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Password Fields - animated */}
        <AnimatePresence>
          {(flowState === FLOW_STATES.LOGIN || flowState === FLOW_STATES.SIGNUP) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorField === 'password') clearError();
                      }}
                      placeholder="Password"
                      disabled={!isOnline || isLoading}
                      autoFocus
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                          }
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
                    {/* Password error message */}
                    {error && errorField === 'password' ? (
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '12px',
                          color: '#DC2626',
                        }}
                      >
                        {error}
                      </span>
                    ) : flowState === FLOW_STATES.SIGNUP ? (
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '12px',
                          color: password && !isPasswordValid ? '#DC2626' : '#757575',
                        }}
                      >
                        Minimal 8 karakter
                      </span>
                    ) : null}
                  </div>

                  {/* Confirm Password - only for signup */}
                  {flowState === FLOW_STATES.SIGNUP && (
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
                        Ulangi Password
                      </label>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorField === 'confirmPassword') clearError();
                        }}
                        placeholder="Ulangi password"
                        disabled={!isOnline || isLoading}
                        rightIcon={
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={
                              showConfirmPassword
                                ? 'Sembunyikan password'
                                : 'Tampilkan password'
                            }
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
                      {/* Confirm password error */}
                      {error && errorField === 'confirmPassword' ? (
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px',
                            color: '#DC2626',
                          }}
                        >
                          {error}
                        </span>
                      ) : confirmPassword && !doPasswordsMatch ? (
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px',
                            color: '#DC2626',
                          }}
                        >
                          Password gak sama
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Forgot Password Link - only for login */}
                  {flowState === FLOW_STATES.LOGIN && (
                    <button
                      type="button"
                      onClick={() => onNavigate?.('forgot-password', email)}
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
                  )}
                </div>
            </motion.div>
          )}
        </AnimatePresence>

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
          {isLoading && <CircleNotch size={20} weight="bold" className="animate-spin" />}
          {getButtonText()}
        </motion.button>

        {/* Divider - always visible */}
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

        {/* Google Sign-In Button - always visible */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isOnline}
          aria-label="Lanjutkan dengan Google"
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
    </main>
  );
};

export default AuthScreen;
