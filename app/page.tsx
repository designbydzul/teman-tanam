'use client';

import React, { useState, useEffect } from 'react';
import Splash from '../components/Splash';
import Login from '../components/Login';
import Onboarding from '../components/Onboarding';
import Home from '../components/Home';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);
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
    console.log('[Page] Auth state:', {
      showSplash,
      isCheckingAuth,
      isAuthenticated,
      hasCompletedOnboarding,
      session: session ? 'exists' : 'null',
      user: user ? user.email : 'null',
      profile: profile ? 'exists' : 'null',
    });
  }, [showSplash, isCheckingAuth, isAuthenticated, hasCompletedOnboarding, session, user, profile]);

  useEffect(() => {
    if (profile?.display_name) {
      setUserName(profile.display_name);
    } else if (user?.email) {
      // Use email prefix as fallback name
      const emailName = user.email.split('@')[0];
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
    console.log('[Page] Splash complete');
    setShowSplash(false);
  };

  // Handle login completion (for manual override/testing)
  const handleLogin = () => {
    console.log('[Page] handleLogin called');
    // Auth state will be updated automatically by useAuth hook
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async ({ name, locations }: { name: string; locations: string[] }) => {
    console.log('[Page] Onboarding complete:', { name, locations });
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
    console.log('[Page] Still checking auth...');
    return <Splash onComplete={() => {}} />;
  }

  // Show login screen if not logged in
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show onboarding if logged in but hasn't completed onboarding
  // hasCompletedOnboarding is true only when profile has display_name
  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show the Home component
  return <Home userName={userName || 'Teman'} />;
}
