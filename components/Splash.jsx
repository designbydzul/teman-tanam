/**
 * Splash Screen Component
 *
 * Displays the Teman Tanam splash screen on app launch
 * Auto-navigates to main app after 2 seconds
 * Design matches Figma specifications exactly
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const Splash = ({ onComplete }) => {
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
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.33, 1, 0.68, 1], // Custom ease-out
        }}
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '4rem', // 64px
          fontWeight: 500,
          color: '#2D5016', // Green Forest
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Teman Tanam
      </motion.h1>
    </div>
  );
};

export default Splash;
