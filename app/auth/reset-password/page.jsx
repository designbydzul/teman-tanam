'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ResetPassword } from '@/components/auth';
import { ErrorBoundary } from '@/components/shared';
import { CircleNotch } from '@phosphor-icons/react';

function LoadingSpinner() {
  return (
    <main
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#FFFFFF',
      }}
    >
      <CircleNotch
        size={40}
        weight="bold"
        color="#7CB342"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: '#757575',
        }}
      >
        Memverifikasi link...
      </p>
    </main>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleRecovery = async () => {
      // Check for PKCE code in URL query params
      const code = searchParams.get('code');

      if (code) {
        console.log('[ResetPassword] Found code in URL, exchanging for session...');
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[ResetPassword] Code exchange error:', exchangeError);
            setError('Link reset password sudah kadaluarsa atau tidak valid. Silakan minta link baru.');
            return;
          }

          if (data?.session) {
            console.log('[ResetPassword] Session established from code');
            setIsReady(true);
            return;
          }
        } catch (err) {
          console.error('[ResetPassword] Exchange exception:', err);
          setError('Terjadi kesalahan saat memverifikasi link.');
          return;
        }
      }

      // Listen for auth state changes - for hash-based tokens (implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[ResetPassword] Auth event:', event, 'Session:', !!session);

          if (event === 'PASSWORD_RECOVERY') {
            // Recovery token was detected and session established
            setIsReady(true);
          } else if (event === 'SIGNED_IN' && session) {
            // User is signed in, they can reset password
            setIsReady(true);
          }
        }
      );

      // Check if session already exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[ResetPassword] Existing session found');
        setIsReady(true);
        return;
      }

      // No code and no session - wait for hash processing or show error
      if (!code) {
        // Give Supabase a moment to process URL hash (implicit flow fallback)
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setIsReady(true);
          } else {
            // No session found after waiting - link may be expired
            setError('Link reset password sudah kadaluarsa atau tidak valid. Silakan minta link baru.');
          }
        }, 2000);
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    handleRecovery();
  }, [searchParams]);

  const handleNavigate = (view) => {
    if (view === 'login') {
      router.push('/');
    }
  };

  // Show loading while waiting for session
  if (!isReady && !error) {
    return <LoadingSpinner />;
  }

  // Show error if link is invalid/expired
  if (error) {
    return (
      <main
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
        <div
          style={{
            textAlign: 'center',
            maxWidth: '320px',
          }}
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
            Link Tidak Valid
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
            {error}
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
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
          }}
        >
          Kembali ke Login
        </button>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <ResetPassword onNavigate={handleNavigate} />
    </ErrorBoundary>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
