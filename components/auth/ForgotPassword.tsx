'use client';

/**
 * Forgot Password Screen Component
 *
 * OTP-based password reset flow:
 * 1. Enter email → Send OTP code
 * 2. Enter 6-digit OTP code
 * 3. Create new password
 * 4. Success → Redirect to login
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  WifiSlash,
  CircleNotch,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';
import { Input } from '@/components/shared';

const debug = createDebugger('ForgotPassword');

type AuthScreen = 'login' | 'signup' | 'forgot' | 'reset';

// Flow states
const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  NEW_PASSWORD: 'new_password',
  SUCCESS: 'success',
} as const;

type Step = typeof STEPS[keyof typeof STEPS];

const RESEND_COOLDOWN = 60; // seconds

interface ForgotPasswordProps {
  onNavigate?: (screen: AuthScreen) => void;
  initialEmail?: string;
  onStartReset?: () => void;
  onResetComplete?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onNavigate,
  initialEmail = '',
  onStartReset,
  onResetComplete,
}) => {
  // Form state
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Flow state
  const [step, setStep] = useState<Step>(STEPS.EMAIL);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState(''); // 'email', 'otp', 'password', 'confirmPassword'
  const [isLoading, setIsLoading] = useState(false);

  // Clear error helper
  const clearError = () => {
    setError('');
    setErrorField('');
  };

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  const { isOnline } = useOnlineStatus();

  // OTP input refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === STEPS.OTP && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  // Validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isOtpComplete = otp.every((digit) => digit !== '');
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Send OTP code
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email.trim()) {
      setError('Email harus diisi');
      setErrorField('email');
      return;
    }

    if (!isEmailValid) {
      setError('Format email gak valid');
      setErrorField('email');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      // Use signInWithOtp which sends a proper OTP code that can be verified
      // We use shouldCreateUser: false to ensure only existing users can reset
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        debug.error('Send OTP error:', otpError);
        // Handle rate limiting error
        if (otpError.message?.includes('security purposes') || otpError.status === 429) {
          // Extract seconds from error message if available
          const match = otpError.message?.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '30';
          setError(`Tunggu ${seconds} detik sebelum kirim ulang`);
        } else if (otpError.message?.includes('Signups not allowed')) {
          setError('Email tidak terdaftar');
        } else {
          setError('Gagal kirim kode. Coba lagi ya!');
        }
        setErrorField('email');
        return;
      }

      debug.log('OTP sent successfully');
      setStep(STEPS.OTP);
      setResendCooldown(RESEND_COOLDOWN);
      // Notify parent that password reset flow has started
      onStartReset?.();
    } catch (err) {
      debug.error('Send OTP error:', err);
      setError('Gagal kirim kode. Coba lagi ya!');
      setErrorField('email');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    clearError();

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        debug.error('Resend OTP error:', otpError);
        if (otpError.message?.includes('security purposes') || otpError.status === 429) {
          const match = otpError.message?.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '30';
          setError(`Tunggu ${seconds} detik sebelum kirim ulang`);
        } else {
          setError('Gagal kirim ulang kode. Coba lagi ya!');
        }
        setErrorField('otp');
        return;
      }

      debug.log('OTP resent successfully');
      setResendCooldown(RESEND_COOLDOWN);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      debug.error('Resend OTP error:', err);
      setError('Gagal kirim ulang kode. Coba lagi ya!');
      setErrorField('otp');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (errorField === 'otp') clearError();

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when complete
    if (digit && index === 5) {
      const completeOtp = [...newOtp.slice(0, 5), digit].join('');
      if (completeOtp.length === 6) {
        verifyOtp(completeOtp);
      }
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      if (errorField === 'otp') clearError();

      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex((d) => d === '');
      if (nextEmptyIndex !== -1) {
        otpInputRefs.current[nextEmptyIndex]?.focus();
      } else {
        otpInputRefs.current[5]?.focus();
        // Auto-verify if complete
        if (pastedData.length === 6) {
          verifyOtp(pastedData);
        }
      }
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP code
  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    clearError();

    try {
      // Use type: 'email' since we're using signInWithOtp
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email',
      });

      if (verifyError) {
        debug.error('Verify OTP error:', verifyError);
        if (verifyError.message?.includes('expired') || verifyError.message?.includes('invalid')) {
          setError('Kode salah atau sudah expired. Coba minta kode baru ya!');
        } else {
          setError('Kode salah atau sudah expired');
        }
        setErrorField('otp');
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        return;
      }

      debug.log('OTP verified successfully, user is now signed in');
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      debug.error('Verify OTP error:', err);
      setError('Kode salah atau sudah expired');
      setErrorField('otp');
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual OTP submit
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOtpComplete) {
      verifyOtp(otp.join(''));
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        debug.error('Update password error:', updateError);
        setError('Gagal ubah password. Coba lagi ya!');
        setErrorField('password');
        return;
      }

      debug.log('Password updated successfully');
      // Sign out after password change so user can login fresh
      await supabase.auth.signOut();
      setStep(STEPS.SUCCESS);
      // Notify parent that password reset is complete
      onResetComplete?.();
    } catch (err) {
      debug.error('Update password error:', err);
      setError('Gagal ubah password. Coba lagi ya!');
      setErrorField('password');
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to email step
  const handleChangeEmail = () => {
    setStep(STEPS.EMAIL);
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setConfirmPassword('');
    clearError();
  };

  // Success state
  if (step === STEPS.SUCCESS) {
    return (
      <main
        role="main"
        aria-label="Password Berhasil Diubah"
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
            Password Berhasil Diubah!
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
            Sekarang kamu bisa login dengan password baru.
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
          Login Sekarang
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
        onClick={() => {
          if (step === STEPS.EMAIL) {
            onNavigate?.('login');
          } else if (step === STEPS.OTP) {
            handleChangeEmail();
          } else if (step === STEPS.NEW_PASSWORD) {
            // Can't go back from password step - already verified
            onNavigate?.('login');
          }
        }}
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
        aria-label="Kembali"
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
          {step === STEPS.EMAIL && 'Lupa Password'}
          {step === STEPS.OTP && 'Masukkan Kode'}
          {step === STEPS.NEW_PASSWORD && 'Buat Password Baru'}
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
          {step === STEPS.EMAIL && 'Masukkan email untuk terima kode reset'}
          {step === STEPS.OTP && (
            <>
              Kode dikirim ke{' '}
              <strong style={{ color: '#2C2C2C' }}>{email}</strong>
            </>
          )}
          {step === STEPS.NEW_PASSWORD && 'Buat password baru untuk akun kamu'}
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

      {/* Email Step */}
      {step === STEPS.EMAIL && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSendOtp}
          style={{
            width: '100%',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
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
              placeholder="nama@email.com"
              disabled={!isOnline || isLoading}
              autoFocus
            />
            {/* Email error */}
            <AnimatePresence>
              {error && step === STEPS.EMAIL && (
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

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isOnline || isLoading || !email.trim()}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#FFFFFF',
              backgroundColor:
                !isOnline || isLoading || !email.trim() ? '#CCCCCC' : '#7CB342',
              border: 'none',
              borderRadius: '12px',
              cursor: !isOnline || isLoading || !email.trim() ? 'not-allowed' : 'pointer',
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
              'Kirim Kode'
            )}
          </motion.button>
        </motion.form>
      )}

      {/* OTP Step */}
      {step === STEPS.OTP && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          onSubmit={handleOtpSubmit}
          style={{
            width: '100%',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          {/* OTP Input Boxes */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                disabled={!isOnline || isLoading}
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'center',
                  border: '2px solid',
                  borderColor: digit ? '#7CB342' : '#E0E0E0',
                  borderRadius: '12px',
                  outline: 'none',
                  backgroundColor: !isOnline || isLoading ? '#F5F5F5' : '#FFFFFF',
                  color: '#2C2C2C',
                  transition: 'border-color 200ms',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7CB342';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = digit ? '#7CB342' : '#E0E0E0';
                }}
              />
            ))}
          </div>

          {/* OTP error */}
          <AnimatePresence>
            {error && step === STEPS.OTP && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                role="alert"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  color: '#DC2626',
                  textAlign: 'center',
                }}
              >
                {error}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Verify Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isOnline || isLoading || !isOtpComplete}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#FFFFFF',
              backgroundColor:
                !isOnline || isLoading || !isOtpComplete ? '#CCCCCC' : '#7CB342',
              border: 'none',
              borderRadius: '12px',
              cursor:
                !isOnline || isLoading || !isOtpComplete ? 'not-allowed' : 'pointer',
              transition: 'background-color 200ms',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? (
              <>
                <CircleNotch size={20} weight="bold" className="animate-spin" />
                Memverifikasi...
              </>
            ) : (
              'Verifikasi'
            )}
          </motion.button>

          {/* Resend Link */}
          <div style={{ textAlign: 'center' }}>
            {resendCooldown > 0 ? (
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#757575',
                  margin: 0,
                }}
              >
                Kirim ulang dalam {resendCooldown} detik
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!isOnline || isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: !isOnline || isLoading ? '#CCCCCC' : '#7CB342',
                  fontWeight: 600,
                  cursor: !isOnline || isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Kirim ulang kode
              </button>
            )}
          </div>

          {/* Change Email Link */}
          <button
            type="button"
            onClick={handleChangeEmail}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#757575',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={16} weight="bold" />
            Ganti email
          </button>
        </motion.form>
      )}

      {/* New Password Step */}
      {step === STEPS.NEW_PASSWORD && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          onSubmit={handleUpdatePassword}
          style={{
            width: '100%',
            maxWidth: '360px',
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
              Password Baru
            </label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorField === 'password') clearError();
              }}
              placeholder="Minimal 8 karakter"
              disabled={!isOnline || isLoading}
              autoFocus
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
            {/* Password error */}
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
            ) : password && !isPasswordValid ? (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  color: '#DC2626',
                }}
              >
                Minimal 8 karakter
              </span>
            ) : null}
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
                    showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'
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

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isOnline || isLoading || !isPasswordValid || !doPasswordsMatch}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#FFFFFF',
              backgroundColor:
                !isOnline || isLoading || !isPasswordValid || !doPasswordsMatch
                  ? '#CCCCCC'
                  : '#7CB342',
              border: 'none',
              borderRadius: '12px',
              cursor:
                !isOnline || isLoading || !isPasswordValid || !doPasswordsMatch
                  ? 'not-allowed'
                  : 'pointer',
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
                Menyimpan...
              </>
            ) : (
              'Simpan Password'
            )}
          </motion.button>
        </motion.form>
      )}

      {/* Back to Login Link - only on email step */}
      {step === STEPS.EMAIL && (
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
      )}
    </main>
  );
};

export default ForgotPassword;
