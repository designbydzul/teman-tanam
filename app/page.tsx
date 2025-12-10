'use client';

import React, { useState, useEffect } from 'react';
import Splash from '../components/Splash';
import Login from '../components/Login';
import Onboarding from '../components/Onboarding';
import Home from '../components/Home';

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userName, setUserName] = useState('');

  // Check if user has already completed onboarding
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
      setHasCompletedOnboarding(true);
    }
  }, []);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Handle login completion
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Handle onboarding completion
  const handleOnboardingComplete = ({ name, locations }: { name: string; locations: string[] }) => {
    setUserName(name);
    setHasCompletedOnboarding(true);
  };

  // Show splash screen on initial load
  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show onboarding if logged in but hasn't completed onboarding
  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show the Home component
  return <Home userName={userName} />;
}
