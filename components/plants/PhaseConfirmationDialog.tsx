'use client';

import React, { memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPhaseDisplay } from '@/lib/lifecycle-config';
import { colors, typography, radius, shadows } from '@/styles/theme';
import type { LifecyclePhase } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface PhaseConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when closing the dialog */
  onClose: () => void;
  /** Callback when user confirms the phase change */
  onConfirm: () => Promise<void>;
  /** Callback when user chooses "remind later" */
  onRemindLater: () => void;
  /** Plant name for personalized message */
  plantName: string;
  /** Current phase of the plant */
  currentPhase: LifecyclePhase | null;
  /** Suggested next phase */
  suggestedPhase: LifecyclePhase | null;
  /** Optional hint text about the phase */
  nextHint?: string;
  /** Whether the confirmation is processing */
  isProcessing?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PhaseConfirmationDialog Component
 *
 * A modal dialog that asks users to confirm when their plant has entered
 * a new lifecycle phase. Shows when the estimated time for a phase transition
 * has been reached.
 *
 * Actions:
 * - "Ya, Betul!" - Confirms the phase transition
 * - "Belum" - Dismisses and reminds in 7 days
 */
const PhaseConfirmationDialog = memo(function PhaseConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onRemindLater,
  plantName,
  currentPhase,
  suggestedPhase,
  nextHint,
  isProcessing = false,
}: PhaseConfirmationDialogProps) {
  // Get display info for the suggested phase
  const suggestedPhaseDisplay = suggestedPhase ? getPhaseDisplay(suggestedPhase) : null;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isProcessing, onClose]);

  // Handle confirm click
  const handleConfirm = useCallback(async () => {
    if (isProcessing) return;
    await onConfirm();
  }, [isProcessing, onConfirm]);

  // Handle remind later click
  const handleRemindLater = useCallback(() => {
    if (isProcessing) return;
    onRemindLater();
  }, [isProcessing, onRemindLater]);

  if (!suggestedPhase || !suggestedPhaseDisplay) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isProcessing ? undefined : onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 5950,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Konfirmasi fase ${suggestedPhaseDisplay.label}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '340px',
              backgroundColor: colors.white,
              borderRadius: radius.xl,
              padding: '32px 24px',
              boxShadow: shadows.xl,
              zIndex: 5951,
              textAlign: 'center',
            }}
          >
            {/* Loading Overlay */}
            {isProcessing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: radius.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <motion.svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={colors.greenFresh}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="31.4 31.4"
                  />
                </motion.svg>
              </div>
            )}

            {/* Phase Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                damping: 15,
                stiffness: 200,
                delay: 0.1,
              }}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: `${suggestedPhaseDisplay.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <span
                style={{
                  fontSize: '40px',
                  lineHeight: 1,
                }}
              >
                {suggestedPhaseDisplay.icon}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                fontFamily: typography.fontFamilyAccent,
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.gray800,
                margin: 0,
                marginBottom: '12px',
              }}
            >
              Waktunya Update Fase?
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.base,
                color: colors.gray600,
                margin: 0,
                marginBottom: '8px',
                lineHeight: 1.5,
              }}
            >
              Sepertinya <strong>{plantName}</strong> sudah masuk fase{' '}
              <strong style={{ color: suggestedPhaseDisplay.color }}>
                {suggestedPhaseDisplay.label}
              </strong>
            </motion.p>

            {/* Hint text */}
            {nextHint && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.sm,
                  color: colors.gray400,
                  margin: 0,
                  marginBottom: '24px',
                  fontStyle: 'italic',
                }}
              >
                {nextHint}
              </motion.p>
            )}

            {!nextHint && <div style={{ marginBottom: '24px' }} />}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.white,
                  backgroundColor: isProcessing ? colors.gray400 : colors.greenFresh,
                  border: 'none',
                  borderRadius: radius.lg,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Ya, Betul! ✓
              </button>

              {/* Remind Later Button */}
              <button
                onClick={handleRemindLater}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily,
                  fontWeight: typography.fontWeight.medium,
                  color: isProcessing ? colors.gray400 : colors.gray600,
                  backgroundColor: 'transparent',
                  border: `2px solid ${isProcessing ? colors.gray200 : colors.gray200}`,
                  borderRadius: radius.lg,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Belum
              </button>
            </motion.div>

            {/* Footer hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.xs,
                color: colors.gray400,
                margin: 0,
                marginTop: '16px',
              }}
            >
              Akan diingatkan lagi dalam 7 hari
            </motion.p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default PhaseConfirmationDialog;
