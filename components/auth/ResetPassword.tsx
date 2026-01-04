'use client';

/**
 * Reset Password Screen Component
 *
 * Set new password after clicking reset link in email
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiSlash, Eye, EyeSlash, CircleNotch, CheckCircle } from '@phosphor-icons/react';
import { createDebugger } from '@/lib/debug';
import { Input } from '@/components/shared';

const debug = createDebugger('ResetPassword');

type AuthScreen = 'login' | 'signup' | 'forgot' | 'reset';

interface ResetPasswordProps {
  onNavigate?: (screen: AuthScreen) => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const { error: updateError } = await auth.updatePassword(password);

      if (updateError) {
        debug.error('Update password error:', updateError);
        let errorMessage = updateError.message;
        if (updateError.message.includes('Password should be')) {
          errorMessage = 'Password harus minimal 8 karakter.';
        } else if (updateError.message.includes('Auth session missing')) {
          errorMessage = 'Sesi kadaluarsa. Minta link reset password baru.';
        }
        setError(errorMessage);
      } else {
        setShowSuccess(true);
      }
    } catch (err) {
      debug.error('Update password error:', err);
      setError('Gagal mengubah password. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (showSuccess) {
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
      aria-label="Halaman Reset Password"
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
          Buat Password Baru
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
          Masukkan password baru untuk akun kamu.
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
            Konfirmasi Password Baru
          </label>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password baru"
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
              Menyimpan...
            </>
          ) : (
            'Simpan Password Baru'
          )}
        </motion.button>
      </motion.form>
    </main>
  );
};

export default ResetPassword;
