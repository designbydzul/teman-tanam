'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, ArrowsClockwise } from '@phosphor-icons/react';
import { useLifecyclePhase } from '@/hooks/useLifecyclePhase';
import PhaseBadge from '@/components/plants/PhaseBadge';
import PhaseProgress from '@/components/plants/PhaseProgress';
import PhaseSelector from '@/components/plants/PhaseSelector';
import PhaseCelebration from '@/components/plants/PhaseCelebration';
import PhaseConfirmationDialog from '@/components/plants/PhaseConfirmationDialog';
import { colors, typography, radius } from '@/styles/theme';
import type { Plant, LifecyclePhase, PlantLifecycleType } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface PlantLifecycleSectionProps {
  /** Plant data */
  plant: Plant;
  /** Optional callback when phase is updated successfully */
  onPhaseUpdated?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PlantLifecycleSection Component
 *
 * Displays and manages the plant's lifecycle phase within the PlantDetail view.
 * Includes:
 * - PhaseBadge showing current phase
 * - PhaseProgress visualization
 * - Harvest timeline info (for harvestable plants)
 * - PhaseSelector for manual updates
 * - PhaseCelebration for milestone moments
 */
const PlantLifecycleSection: React.FC<PlantLifecycleSectionProps> = ({
  plant,
  onPhaseUpdated,
}) => {
  // State for selector, confirmation, and celebration modals
  const [showSelector, setShowSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<LifecyclePhase | null>(null);
  const [isUpdatingPhase, setIsUpdatingPhase] = useState(false);

  // Use lifecycle phase hook
  const {
    currentPhase,
    phaseDisplay,
    phaseProgress,
    validPhases,
    harvestInfo,
    lifecycleType,
    isLoading,
    updatePhase,
    shouldShowConfirmation,
    suggestedPhase,
    dismissPhaseReminder,
    phaseConfig,
  } = useLifecyclePhase(plant.id, plant);

  // Auto-show confirmation dialog when shouldShowConfirmation becomes true
  useEffect(() => {
    if (shouldShowConfirmation && !showConfirmDialog && !showSelector && !showCelebration) {
      setShowConfirmDialog(true);
    }
  }, [shouldShowConfirmation, showConfirmDialog, showSelector, showCelebration]);

  // Handle phase selection
  const handleSelectPhase = useCallback(
    async (newPhase: LifecyclePhase) => {
      if (!currentPhase || newPhase === currentPhase) {
        setShowSelector(false);
        return;
      }

      setIsUpdatingPhase(true);

      try {
        const result = await updatePhase(newPhase);

        if (result.success) {
          setShowSelector(false);

          // Show celebration for milestone phases
          if (result.isCelebration) {
            setCelebrationPhase(newPhase);
            setShowCelebration(true);
          }

          // Notify parent
          onPhaseUpdated?.();
        } else {
          // Could show error toast here
          console.error('Failed to update phase:', result.error);
        }
      } catch (error) {
        console.error('Error updating phase:', error);
      } finally {
        setIsUpdatingPhase(false);
      }
    },
    [currentPhase, updatePhase, onPhaseUpdated]
  );

  // Handle badge tap to open selector
  const handleBadgeTap = useCallback(() => {
    setShowSelector(true);
  }, []);

  // Close celebration
  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationPhase(null);
  }, []);

  // Handle phase confirmation (user clicked "Ya, Betul!")
  const handleConfirmPhase = useCallback(async () => {
    if (!suggestedPhase) return;

    setIsUpdatingPhase(true);

    try {
      const result = await updatePhase(suggestedPhase);

      if (result.success) {
        setShowConfirmDialog(false);

        // Show celebration for milestone phases
        if (result.isCelebration) {
          setCelebrationPhase(suggestedPhase);
          setShowCelebration(true);
        }

        // Notify parent
        onPhaseUpdated?.();
      } else {
        console.error('Failed to confirm phase:', result.error);
      }
    } catch (error) {
      console.error('Error confirming phase:', error);
    } finally {
      setIsUpdatingPhase(false);
    }
  }, [suggestedPhase, updatePhase, onPhaseUpdated]);

  // Handle remind later (user clicked "Belum")
  const handleRemindLater = useCallback(() => {
    dismissPhaseReminder();
    setShowConfirmDialog(false);
  }, [dismissPhaseReminder]);

  // Don't render if no phase data
  if (!currentPhase || !lifecycleType) {
    if (isLoading) {
      return (
        <div
          style={{
            padding: '16px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowsClockwise
            size={20}
            weight="regular"
            color={colors.gray400}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      );
    }
    return null;
  }

  // Check if this is a harvestable plant type
  const isHarvestable = lifecycleType === 'annual_harvest' || lifecycleType === 'perennial_harvest';
  const showHarvestInfo = isHarvestable && harvestInfo.timelineMessage;

  return (
    <>
      {/* Main Section */}
      <div
        style={{
          padding: '16px 0',
          borderTop: `1px solid ${colors.gray200}`,
        }}
      >
        {/* Header Row: Phase Badge + Harvest Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          {/* Phase Badge - Tappable */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={handleBadgeTap}
            style={{ cursor: 'pointer' }}
          >
            <PhaseBadge
              phase={currentPhase}
              size="md"
              showIcon
              showLabel
            />
          </motion.div>

          {/* Harvest Timeline Info */}
          {showHarvestInfo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Timer size={16} weight="regular" color={colors.gray600} />
              <span
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.sm,
                  color: harvestInfo.isOverdue ? colors.warning : colors.gray600,
                  fontWeight: harvestInfo.showReminder
                    ? typography.fontWeight.medium
                    : typography.fontWeight.normal,
                }}
              >
                {harvestInfo.timelineMessage}
              </span>
            </div>
          )}
        </div>

        {/* Phase Progress Dots */}
        <PhaseProgress
          currentPhase={currentPhase}
          lifecycleType={lifecycleType}
          progress={phaseProgress}
          variant="dots"
          size="sm"
          showLabels={false}
        />

        {/* Harvest Reminder Banner */}
        {harvestInfo.showReminder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              backgroundColor: `${colors.yellowSun}15`,
              border: `1px solid ${colors.yellowSun}40`,
              borderRadius: radius.md,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '16px' }}>✨</span>
            <span
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.sm,
                color: colors.gray800,
                flex: 1,
              }}
            >
              Mungkin sudah waktunya panen? Cek tanamanmu!
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBadgeTap}
              style={{
                padding: '6px 12px',
                backgroundColor: colors.yellowSun,
                border: 'none',
                borderRadius: radius.md,
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.gray800,
                cursor: 'pointer',
              }}
            >
              Update
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Phase Selector Modal */}
      <PhaseSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        currentPhase={currentPhase}
        lifecycleType={lifecycleType}
        onSelectPhase={handleSelectPhase}
        isLoading={isUpdatingPhase}
      />

      {/* Phase Confirmation Dialog (Auto-suggestion) */}
      <PhaseConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmPhase}
        onRemindLater={handleRemindLater}
        plantName={plant.customName || plant.name}
        currentPhase={currentPhase}
        suggestedPhase={suggestedPhase}
        nextHint={phaseConfig?.description}
        isProcessing={isUpdatingPhase}
      />

      {/* Phase Celebration Modal */}
      {celebrationPhase && (
        <PhaseCelebration
          isOpen={showCelebration}
          onClose={handleCloseCelebration}
          phase={celebrationPhase}
          plantName={plant.customName || plant.name}
          isFirstHarvest={
            celebrationPhase === 'harvested' && (plant.totalHarvests || 0) <= 1
          }
        />
      )}
    </>
  );
};

export default PlantLifecycleSection;
