'use client';

import React, { memo, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CircleNotch } from '@phosphor-icons/react';
import { getValidPhases, getPhaseConfig, canManuallySetPhase } from '@/lib/lifecycle-config';
import { colors, typography, radius, shadows } from '@/styles/theme';
import type { LifecyclePhase, PlantLifecycleType } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface PhaseSelectorProps {
  /** Whether the selector is open */
  isOpen: boolean;
  /** Callback when closing the selector */
  onClose: () => void;
  /** Current lifecycle phase of the plant */
  currentPhase: LifecyclePhase;
  /** Plant's lifecycle type */
  lifecycleType: PlantLifecycleType;
  /** Callback when a phase is selected */
  onSelectPhase: (phase: LifecyclePhase) => void | Promise<void>;
  /** Whether the selection is being saved */
  isLoading?: boolean;
}

// ============================================================================
// Helper Text for Phases
// ============================================================================

const PHASE_HELPER_TEXT: Partial<Record<LifecyclePhase, string>> = {
  seedling: 'Tanaman baru ditanam atau baru tumbuh',
  growing: 'Tanaman aktif tumbuh, belum berbunga',
  flowering: 'Tanaman mulai mengeluarkan bunga',
  fruiting: 'Sudah ada buah yang terbentuk',
  harvest_ready: 'Buah/sayur sudah siap dipetik!',
  harvested: 'Sudah dipanen, siklus selesai',
  resting: 'Tanaman istirahat sebelum siklus berikutnya',
  mature: 'Tanaman sudah dewasa dan sehat',
};

// ============================================================================
// Color Utilities
// ============================================================================

function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ============================================================================
// Phase Option Component
// ============================================================================

interface PhaseOptionProps {
  phase: LifecyclePhase;
  isCurrent: boolean;
  isSelectable: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

const PhaseOption = memo(function PhaseOption({
  phase,
  isCurrent,
  isSelectable,
  isLoading,
  onSelect,
}: PhaseOptionProps) {
  const config = getPhaseConfig(phase);
  if (!config) return null;

  const helperText = PHASE_HELPER_TEXT[phase];
  const isDisabled = !isSelectable || isLoading;

  return (
    <motion.button
      onClick={isDisabled ? undefined : onSelect}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      style={{
        width: '100%',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: isCurrent
          ? hexToRgba(config.color, 0.12)
          : isSelectable
          ? colors.white
          : colors.gray100,
        border: isCurrent
          ? `2px solid ${hexToRgba(config.color, 0.4)}`
          : `1px solid ${colors.gray200}`,
        borderRadius: radius.lg,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isSelectable ? 1 : 0.5,
        transition: 'all 0.2s ease',
        textAlign: 'left',
        minHeight: '72px',
      }}
    >
      {/* Phase icon */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: isCurrent ? config.color : hexToRgba(config.color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '22px',
            lineHeight: 1,
            filter: isSelectable ? 'none' : 'grayscale(50%)',
          }}
        >
          {config.icon}
        </span>
      </div>

      {/* Label and helper text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.base,
            fontWeight: isCurrent ? typography.fontWeight.semibold : typography.fontWeight.medium,
            color: isCurrent ? config.color : isSelectable ? colors.gray800 : colors.gray400,
            marginBottom: '2px',
          }}
        >
          {config.label}
        </div>
        {helperText && (
          <div
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.sm,
              color: colors.gray600,
              lineHeight: 1.4,
            }}
          >
            {helperText}
          </div>
        )}
      </div>

      {/* Current indicator or checkmark */}
      {isCurrent && (
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Check size={14} weight="bold" color={colors.white} />
        </div>
      )}
    </motion.button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * PhaseSelector Component
 *
 * A bottom sheet that allows users to manually update their plant's
 * lifecycle phase. Shows all valid phases for the plant's lifecycle type
 * and indicates which transitions are allowed.
 */
const PhaseSelector = memo(function PhaseSelector({
  isOpen,
  onClose,
  currentPhase,
  lifecycleType,
  onSelectPhase,
  isLoading = false,
}: PhaseSelectorProps) {
  // Get valid phases for this lifecycle type
  const validPhases = useMemo(() => getValidPhases(lifecycleType), [lifecycleType]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onClose]);

  // Handle phase selection
  const handleSelectPhase = useCallback(
    async (phase: LifecyclePhase) => {
      if (phase === currentPhase || isLoading) return;

      try {
        await onSelectPhase(phase);
        // Close after successful selection (parent should handle this if needed)
      } catch {
        // Error handling should be done by parent
      }
    },
    [currentPhase, isLoading, onSelectPhase]
  );

  // Check if a phase is selectable
  const isPhaseSelectable = useCallback(
    (phase: LifecyclePhase) => {
      if (phase === currentPhase) return true; // Current is always "selectable" (shown as selected)
      return canManuallySetPhase(currentPhase, phase, lifecycleType);
    },
    [currentPhase, lifecycleType]
  );

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
            onClick={isLoading ? undefined : onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 5000,
            }}
            aria-hidden="true"
          />

          {/* Bottom Sheet Container */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 'var(--app-max-width, 400px)',
              zIndex: 5001,
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="phase-selector-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                backgroundColor: colors.white,
                borderRadius: '20px 20px 0 0',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: shadows.xl,
              }}
            >
              {/* Handle bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px 0 8px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '4px',
                    backgroundColor: colors.gray200,
                    borderRadius: radius.full,
                  }}
                />
              </div>

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 20px 16px',
                  borderBottom: `1px solid ${colors.gray200}`,
                }}
              >
                <div>
                  <h2
                    id="phase-selector-title"
                    style={{
                      fontFamily: typography.fontFamilyAccent,
                      fontSize: typography.fontSize['2xl'],
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.greenForest,
                      margin: 0,
                      marginBottom: '4px',
                    }}
                  >
                    Ubah Fase Tanaman
                  </h2>
                  <p
                    style={{
                      fontFamily: typography.fontFamily,
                      fontSize: typography.fontSize.sm,
                      color: colors.gray600,
                      margin: 0,
                    }}
                  >
                    Pilih fase yang sesuai dengan kondisi tanamanmu
                  </p>
                </div>

                <button
                  onClick={isLoading ? undefined : onClose}
                  disabled={isLoading}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: colors.gray100,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="Tutup"
                >
                  <X size={20} weight="regular" color={colors.gray600} />
                </button>
              </div>

              {/* Loading overlay */}
              {isLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '20px 20px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <CircleNotch
                      size={32}
                      weight="regular"
                      color={colors.greenFresh}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    <span
                      style={{
                        fontFamily: typography.fontFamily,
                        fontSize: typography.fontSize.sm,
                        color: colors.gray600,
                      }}
                    >
                      Menyimpan...
                    </span>
                  </div>
                </div>
              )}

              {/* Phase options list */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {validPhases.map((phase) => (
                  <PhaseOption
                    key={phase}
                    phase={phase}
                    isCurrent={phase === currentPhase}
                    isSelectable={isPhaseSelectable(phase)}
                    isLoading={isLoading}
                    onSelect={() => handleSelectPhase(phase)}
                  />
                ))}

                {/* Helper note */}
                <p
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.xs,
                    color: colors.gray400,
                    textAlign: 'center',
                    marginTop: '8px',
                    padding: '0 12px',
                    lineHeight: 1.5,
                  }}
                >
                  Kamu bisa maju atau mundur satu fase, atau langsung ke "Siap Panen" jika tanamanmu sudah siap dipetik.
                </p>
              </div>

              {/* Inline keyframes for spinner */}
              <style>
                {`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}
              </style>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

export default PhaseSelector;
