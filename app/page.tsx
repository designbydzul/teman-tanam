'use client';

import React, { useState, useEffect } from 'react';
import { Splash, ErrorBoundary, GlobalOfflineBanner } from '@/components/shared';
import { AuthScreen, ForgotPassword, Onboarding } from '@/components/auth';
import { Home } from '@/components/Home';
import { useAuth } from '@/hooks/useAuth';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('Page');

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);
  const [authScreen, setAuthScreen] = useState<'login' | 'forgot-password'>('login');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    profile,
    loading: isCheckingAuth,
    completeOnboarding,
    session,
    user,
  } = useAuth();

  // Get user name from profile or localStorage for backward compatibility
  const [userName, setUserName] = useState('');

  // Debug auth state changes
  useEffect(() => {
    debug.log('Auth state:', {
      showSplash,
      isCheckingAuth,
      isAuthenticated,
      hasCompletedOnboarding,
      session: session ? 'exists' : 'null',
      user: user ? (user as { email?: string }).email : 'null',
      profile: profile ? 'exists' : 'null',
    });
  }, [showSplash, isCheckingAuth, isAuthenticated, hasCompletedOnboarding, session, user, profile]);

  // Debug when hasCompletedOnboarding changes
  useEffect(() => {
    debug.log('hasCompletedOnboarding changed to:', hasCompletedOnboarding);
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    const typedProfile = profile as { display_name?: string } | null;
    const typedUser = user as { email?: string } | null;

    if (typedProfile?.display_name) {
      setUserName(typedProfile.display_name);
    } else if (typedUser?.email) {
      // Use email prefix as fallback name
      const emailName = typedUser.email.split('@')[0];
      // Capitalize first letter
      const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      setUserName(formattedName);
    } else {
      // Final fallback
      setUserName('Teman');
    }
  }, [profile, user]);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    debug.log('Splash complete');
    setShowSplash(false);
  };

  // Handle login completion (for manual override/testing)
  const handleLogin = () => {
    debug.log('handleLogin called');
    // Auth state will be updated automatically by useAuth hook
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async ({ name, locations }: { name: string; locations: string[] }) => {
    debug.log('Onboarding complete:', { name, locations });
    // Save to Supabase via the hook
    const result = await completeOnboarding(name, locations);
    if (result.success) {
      setUserName(name);
    } else {
      // Fallback to localStorage if Supabase fails
      localStorage.setItem('userName', name);
      localStorage.setItem('userLocations', JSON.stringify(locations));
      setUserName(name);
    }
  };

  // Show splash screen only during initial load
  // Once splash animation completes AND auth check is done, proceed
  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  // Show splash/loading if still checking auth (after splash animation)
  if (isCheckingAuth) {
    debug.log('Still checking auth...');
    return <Splash onComplete={() => {}} />;
  }

  // Show forgot password screen - keep showing even if authenticated (during password reset flow)
  if (authScreen === 'forgot-password' || isResettingPassword) {
    return (
      <>
        <GlobalOfflineBanner />
        <ErrorBoundary>
          <ForgotPassword
            initialEmail={forgotPasswordEmail}
            onNavigate={(screen: string) => {
              setAuthScreen(screen as 'login' | 'forgot-password');
              setIsResettingPassword(false);
              if (screen === 'login') {
                setForgotPasswordEmail('');
              }
            }}
            onStartReset={() => setIsResettingPassword(true)}
            onResetComplete={() => {
              setIsResettingPassword(false);
              setAuthScreen('login');
              setForgotPasswordEmail('');
            }}
          />
        </ErrorBoundary>
      </>
    );
  }

  // Show auth screen if not logged in
  if (!isAuthenticated) {
    // Show login/signup screen
    return (
      <>
        <GlobalOfflineBanner />
        <ErrorBoundary>
          <AuthScreen
            onLogin={handleLogin}
            onNavigate={(screen: string, email?: string) => {
              setAuthScreen(screen as 'login' | 'forgot-password');
              if (screen === 'forgot-password' && email) {
                setForgotPasswordEmail(email);
              }
            }}
          />
        </ErrorBoundary>
      </>
    );
  }

  // Show onboarding if logged in but hasn't completed onboarding
  // hasCompletedOnboarding is true only when profile has display_name
  if (!hasCompletedOnboarding) {
    return (
      <>
        <GlobalOfflineBanner />
        <ErrorBoundary>
          <Onboarding onComplete={handleOnboardingComplete} />
        </ErrorBoundary>
      </>
    );
  }

  // Show the Home component (Home has its own detailed OfflineIndicator)
  return (
    <ErrorBoundary>
      <Home userName={userName || 'Teman'} />
    </ErrorBoundary>
  );
}
