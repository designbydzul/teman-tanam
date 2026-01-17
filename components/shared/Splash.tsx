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
    <>
      <style jsx global>{`
        .splash-container {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
          height: 100vh;
          height: 100dvh;
          padding: 0 60px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #F5F5DC;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
      `}</style>
      <div className="splash-container">
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
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            Teman<br />Tanam
          </h1>
        </motion.div>
      </div>
    </>
  );
};

export default Splash;
