/**
 * Splash Screen Component
 *
 * Displays the Teman Tanam splash screen on app launch
 * Auto-navigates to main app after 2 seconds
 * Design matches Figma specifications exactly
 */

'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashProps {
  onComplete?: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    // Auto-navigate after 2 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        padding: '0 60px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5DC', // Cream
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.33, 1, 0.68, 1],
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: '4rem',
            fontWeight: 600,
            color: '#2D5016',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Teman Tanam
        </h1>
      </motion.div>
    </div>
  );
};

export default Splash;
