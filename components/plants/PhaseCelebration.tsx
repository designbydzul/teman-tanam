'use client';

import React, { memo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getPhaseDisplay } from '@/lib/lifecycle-config';
import { colors, typography, radius, shadows } from '@/styles/theme';
import type { LifecyclePhase } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface PhaseCelebrationProps {
  /** Whether the celebration modal is open */
  isOpen: boolean;
  /** Callback when closing the modal */
  onClose: () => void;
  /** The phase being celebrated */
  phase: LifecyclePhase;
  /** Plant name for personalized message */
  plantName: string;
  /** Whether this is the first harvest (extra special!) */
  isFirstHarvest?: boolean;
}

// ============================================================================
// Celebration Messages
// ============================================================================

interface CelebrationContent {
  headline: string;
  subtext: string;
}

function getCelebrationContent(
  phase: LifecyclePhase,
  plantName: string,
  isFirstHarvest: boolean
): CelebrationContent {
  // Handle harvest specially
  if (phase === 'harvested') {
    if (isFirstHarvest) {
      return {
        headline: 'Panen Pertama! 🎉',
        subtext: `Selamat! ${plantName} berhasil dipanen untuk pertama kalinya!`,
      };
    }
    return {
      headline: 'Panen Lagi! 🎉',
      subtext: `Mantap! ${plantName} dipanen lagi~`,
    };
  }

  // Other milestone phases
  const messages: Partial<Record<LifecyclePhase, CelebrationContent>> = {
    harvest_ready: {
      headline: 'Siap Panen! ✨',
      subtext: `${plantName} udah siap dipetik nih!`,
    },
    mature: {
      headline: 'Tanaman Dewasa! 🌳',
      subtext: `${plantName} udah gede dan sehat!`,
    },
    flowering: {
      headline: 'Mulai Berbunga! 🌸',
      subtext: `Wah, ${plantName} cantik banget!`,
    },
    fruiting: {
      headline: 'Mulai Berbuah! 🍅',
      subtext: `Keren, ${plantName} udah berbuah!`,
    },
  };

  return messages[phase] || {
    headline: 'Selamat! 🎉',
    subtext: `${plantName} mencapai fase baru!`,
  };
}

// ============================================================================
// Confetti Configuration
// ============================================================================

const CONFETTI_COLORS = [
  colors.greenFresh,   // #7CB342
  colors.yellowSun,    // #FFD54F
  colors.blueSky,      // #87CEEB
  '#F48FB1',           // Pink (flowering color)
  '#FFCC80',           // Orange (fruiting color)
];

function fireConfetti() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 6000,
    colors: CONFETTI_COLORS,
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Initial burst from center
  confetti({
    ...defaults,
    particleCount: 50,
    origin: { x: 0.5, y: 0.5 },
    startVelocity: 45,
  });

  // Continuous smaller bursts
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 15 * (timeLeft / duration);

    // Random positions on sides
    confetti({
      ...defaults,
      particleCount: Math.floor(particleCount),
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount: Math.floor(particleCount),
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  return () => clearInterval(interval);
}

// ============================================================================
// Auto-dismiss timer (4 seconds)
// ============================================================================

const AUTO_DISMISS_MS = 4000;

// ============================================================================
// Main Component
// ============================================================================

/**
 * PhaseCelebration Component
 *
 * A joyful celebration modal that appears when plants reach milestone phases.
 * Features confetti animation, bouncy icon, and auto-dismiss.
 *
 * Celebration phases:
 * - harvest_ready: Plant is ready to be harvested
 * - harvested: Plant was harvested (extra special if first time!)
 * - mature: Perpetual plant reached maturity
 * - flowering: Plant started flowering
 * - fruiting: Plant started fruiting
 */
const PhaseCelebration = memo(function PhaseCelebration({
  isOpen,
  onClose,
  phase,
  plantName,
  isFirstHarvest = false,
}: PhaseCelebrationProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const confettiCleanupRef = useRef<(() => void) | null>(null);

  // Get celebration content
  const content = getCelebrationContent(phase, plantName, isFirstHarvest);
  const phaseDisplay = getPhaseDisplay(phase);

  // Handle close
  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  }, [onClose]);

  // Fire confetti and set auto-dismiss timer when opening
  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      confettiCleanupRef.current = fireConfetti();

      // Set auto-dismiss timer
      timerRef.current = setTimeout(() => {
        onClose();
      }, AUTO_DISMISS_MS);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (confettiCleanupRef.current) {
        confettiCleanupRef.current();
        confettiCleanupRef.current = null;
      }
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - tap to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 5500,
              cursor: 'pointer',
            }}
            aria-hidden="true"
          />

          {/* Celebration Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Selamat! ${content.headline}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
            }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '320px',
              backgroundColor: colors.white,
              borderRadius: radius.xl,
              padding: '32px 24px',
              boxShadow: shadows.xl,
              zIndex: 5501,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 200,
                delay: 0.1,
              }}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: `${phaseDisplay.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <motion.span
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  fontSize: '48px',
                  lineHeight: 1,
                }}
              >
                {phaseDisplay.icon}
              </motion.span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontFamily: typography.fontFamilyAccent,
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
                color: phaseDisplay.color,
                margin: 0,
                marginBottom: '12px',
              }}
            >
              {content.headline}
            </motion.h2>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.lg,
                color: colors.gray600,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {content.subtext}
            </motion.p>

            {/* Tap to dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.5 }}
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.xs,
                color: colors.gray400,
                margin: 0,
                marginTop: '20px',
              }}
            >
              Ketuk untuk menutup
            </motion.p>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: AUTO_DISMISS_MS / 1000,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: phaseDisplay.color,
                borderRadius: `0 0 ${radius.xl} ${radius.xl}`,
                transformOrigin: 'left',
                opacity: 0.6,
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default PhaseCelebration;
