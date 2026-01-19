'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { differenceInDays, startOfDay } from 'date-fns';
import { usePlantPhases } from '@/hooks/usePlantPhases';
import { colors, typography, radius } from '@/styles/theme';
import type { PlantUI, PlantPhaseDefinition, PlantSpeciesCategory } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface PlantLifeJourneyProps {
  plant: PlantUI;
  onPhaseAdvance: (
    newPhaseKey: string,
    newPhaseStartedAt: Date
  ) => Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Confirmation modal for advancing phase
 */
const ConfirmAdvanceModal: React.FC<{
  isOpen: boolean;
  plantName: string;
  nextPhase: PlantPhaseDefinition;
  onConfirm: () => void;
  onCancel: () => void;
  isAdvancing: boolean;
}> = ({ isOpen, plantName, nextPhase, onConfirm, onCancel, isAdvancing }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="ios-fixed-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 6000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.xl,
                padding: '32px 24px',
                maxWidth: '320px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: `${nextPhase.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '2rem',
                }}
              >
                {nextPhase.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray800,
                  margin: '0 0 12px 0',
                }}
              >
                Naik ke Fase Berikutnya?
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.sm,
                  color: colors.gray600,
                  margin: '0 0 24px 0',
                  lineHeight: 1.5,
                }}
              >
                Tandai <strong>{plantName}</strong> sudah masuk fase{' '}
                <strong>{nextPhase.phaseName}</strong>?
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Cancel */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  disabled={isAdvancing}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: radius.lg,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.gray800,
                    cursor: isAdvancing ? 'not-allowed' : 'pointer',
                    opacity: isAdvancing ? 0.5 : 1,
                  }}
                >
                  Batal
                </motion.button>

                {/* Confirm */}
                <motion.button
                  whileTap={{ scale: isAdvancing ? 1 : 0.95 }}
                  onClick={onConfirm}
                  disabled={isAdvancing}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: colors.greenFresh,
                    border: 'none',
                    borderRadius: radius.lg,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.white,
                    cursor: isAdvancing ? 'not-allowed' : 'pointer',
                    opacity: isAdvancing ? 0.7 : 1,
                  }}
                >
                  {isAdvancing ? 'Menyimpan...' : 'Lanjutkan'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Celebration overlay with confetti animation
 */
const CelebrationOverlay: React.FC<{
  isVisible: boolean;
  onComplete: () => void;
  phaseName: string;
}> = ({ isVisible, onComplete, phaseName }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
        color: [colors.greenFresh, colors.greenForest, colors.yellowSun, colors.greenLight][
          Math.floor(Math.random() * 4)
        ],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
      })),
    []
  );

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="ios-fixed-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 7000,
            pointerEvents: 'none',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                top: '-5%',
                left: `${particle.x}%`,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                top: '110%',
                scale: [0, 1, 1, 0.5],
                rotate: particle.rotation + 360,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                borderRadius: '2px',
                backgroundColor: particle.color,
              }}
            />
          ))}

          {/* Centered celebration text */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              times: [0, 0.3, 0.7, 1],
            }}
            style={{
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              style={{ fontSize: '4rem', marginBottom: '8px' }}
            >
              🎉
            </motion.div>
            <p
              className="font-accent"
              style={{
                fontSize: '2rem',
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
                margin: '0 0 4px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Selamat!
            </p>
            <p
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.base,
                color: colors.white,
                margin: 0,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Naik ke fase {phaseName}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * PlantLifeJourney Component
 *
 * Collapsible card showing the plant's current growth phase with care tips.
 * Matches the wireframe design with collapsed/expanded states.
 */
const PlantLifeJourney: React.FC<PlantLifeJourneyProps> = ({
  plant,
  onPhaseAdvance,
}) => {
  const category = plant.species?.category as PlantSpeciesCategory | null;
  const { phases, loading, error, getPhaseByKey, getNextPhase } = usePlantPhases(category);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [celebrationPhaseName, setCelebrationPhaseName] = useState('');

  // Current phase info - default to first phase if not set
  const firstPhase = phases.length > 0 ? phases[0] : null;
  const currentPhaseKey = plant.currentPhase || firstPhase?.phaseKey || null;
  const currentPhase = currentPhaseKey ? getPhaseByKey(currentPhaseKey) : firstPhase;
  const nextPhase = currentPhaseKey ? getNextPhase(currentPhaseKey) : (phases.length > 1 ? phases[1] : null);
  const isLastPhase = currentPhase && !nextPhase;

  // Calculate days in current phase
  const daysInPhase = useMemo(() => {
    if (!plant.phaseStartedAt) return 0;
    const phaseStart = startOfDay(new Date(plant.phaseStartedAt));
    const today = startOfDay(new Date());
    return differenceInDays(today, phaseStart);
  }, [plant.phaseStartedAt]);

  // Toggle expanded state
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Handle advance button click
  const handleAdvanceClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextPhase) {
      setShowConfirmModal(true);
    }
  }, [nextPhase]);

  // Handle confirm advance
  const handleConfirmAdvance = useCallback(async () => {
    if (!nextPhase) {
      console.log('[PlantLifeJourney] handleConfirmAdvance: No nextPhase');
      return;
    }

    console.log('[PlantLifeJourney] handleConfirmAdvance: Advancing to phase', nextPhase.phaseKey);
    setIsAdvancing(true);

    try {
      const result = await onPhaseAdvance(nextPhase.phaseKey, new Date());
      console.log('[PlantLifeJourney] onPhaseAdvance result:', result);

      if (result.success) {
        setShowConfirmModal(false);
        setCelebrationPhaseName(nextPhase.phaseName);
        setShowCelebration(true);
      } else {
        console.error('[PlantLifeJourney] Phase advance failed:', result.error);
      }
    } finally {
      setIsAdvancing(false);
    }
  }, [nextPhase, onPhaseAdvance]);

  // Handle celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Don't render if loading or no phases
  if (loading) {
    return null; // Don't show loading state, just hide
  }

  if (phases.length === 0 || !currentPhase) {
    return null;
  }

  if (error) {
    return null;
  }

  const plantName = plant.customName || plant.name || 'Tanaman';

  // Generate phase description based on current phase
  const phaseDescription = currentPhase.description ||
    (daysInPhase === 0 ? 'Baru mulai fase ini' : `${daysInPhase} hari di fase ini`);

  return (
    <>
      {/* Collapsible Card */}
      <motion.div
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          border: `1px solid ${colors.gray200}`,
          overflow: 'hidden',
        }}
      >
        {/* Header - Always visible */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={handleToggle}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ textAlign: 'left', flex: 1 }}>
            {/* Phase name */}
            <p
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.gray800,
                margin: 0,
              }}
            >
              {currentPhase.phaseName}
            </p>
            {/* Short description */}
            <p
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.sm,
                color: colors.gray600,
                margin: '4px 0 0 0',
              }}
            >
              {phaseDescription}
            </p>
          </div>

          {/* Caret icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isExpanded ? (
              <CaretUp size={20} weight="regular" color={colors.gray600} />
            ) : (
              <CaretDown size={20} weight="regular" color={colors.gray600} />
            )}
          </div>
        </motion.button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: '0 16px 16px 16px',
                  borderTop: `1px solid ${colors.gray200}`,
                  paddingTop: '16px',
                }}
              >
                {/* Care tips */}
                {currentPhase.careTips && currentPhase.careTips.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p
                      style={{
                        fontFamily: typography.fontFamily,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.gray800,
                        margin: '0 0 8px 0',
                      }}
                    >
                      Tips fase ini:
                    </p>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '16px',
                        fontFamily: typography.fontFamily,
                        fontSize: typography.fontSize.sm,
                        color: colors.gray600,
                        lineHeight: 1.6,
                      }}
                    >
                      {currentPhase.careTips.slice(0, 3).map((tip, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advance phase button */}
                {nextPhase && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdvanceClick}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: colors.greenLight,
                      border: `1px solid ${colors.greenFresh}`,
                      borderRadius: radius.md,
                      fontFamily: typography.fontFamily,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.greenForest,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{nextPhase.icon}</span>
                    Naik ke fase {nextPhase.phaseName}
                  </motion.button>
                )}

                {/* Last phase indicator */}
                {isLastPhase && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: `${colors.greenFresh}10`,
                      borderRadius: radius.md,
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: typography.fontFamily,
                        fontSize: typography.fontSize.sm,
                        color: colors.greenForest,
                        margin: 0,
                      }}
                    >
                      🎊 Fase terakhir tercapai!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirmation modal */}
      {nextPhase && (
        <ConfirmAdvanceModal
          isOpen={showConfirmModal}
          plantName={plantName}
          nextPhase={nextPhase}
          onConfirm={handleConfirmAdvance}
          onCancel={() => setShowConfirmModal(false)}
          isAdvancing={isAdvancing}
        />
      )}

      {/* Celebration overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
        phaseName={celebrationPhaseName}
      />
    </>
  );
};

export default PlantLifeJourney;
