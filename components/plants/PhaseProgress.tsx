'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getValidPhases, getPhaseConfig, getPhaseDisplay } from '@/lib/lifecycle-config';
import { colors, typography, radius, shadows } from '@/styles/theme';
import type { LifecyclePhase, PlantLifecycleType } from '@/types';

// ============================================================================
// Types
// ============================================================================

type ProgressVariant = 'dots' | 'bar' | 'steps';
type ProgressSize = 'sm' | 'md';

interface PhaseProgressProps {
  /** Current lifecycle phase */
  currentPhase: LifecyclePhase;
  /** Plant's lifecycle type */
  lifecycleType: PlantLifecycleType;
  /** Progress percentage (0-100) for bar variant */
  progress?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Size variant */
  size?: ProgressSize;
  /** Whether to show phase labels */
  showLabels?: boolean;
  /** Additional CSS class name */
  className?: string;
}

// ============================================================================
// Size Configuration
// ============================================================================

interface SizeConfig {
  dotSize: number;
  dotSizeActive: number;
  lineHeight: number;
  fontSize: string;
  iconSize: string;
  stepGap: string;
  barHeight: number;
}

const SIZE_CONFIG: Record<ProgressSize, SizeConfig> = {
  sm: {
    dotSize: 10,
    dotSizeActive: 14,
    lineHeight: 2,
    fontSize: typography.fontSize.xs,
    iconSize: '14px',
    stepGap: '8px',
    barHeight: 6,
  },
  md: {
    dotSize: 14,
    dotSizeActive: 18,
    lineHeight: 3,
    fontSize: typography.fontSize.sm,
    iconSize: '18px',
    stepGap: '12px',
    barHeight: 8,
  },
};

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ============================================================================
// Dots Variant
// ============================================================================

interface DotsVariantProps {
  phases: LifecyclePhase[];
  currentPhase: LifecyclePhase;
  currentIndex: number;
  sizeConfig: SizeConfig;
  showLabels: boolean;
}

const DotsVariant = memo(function DotsVariant({
  phases,
  currentPhase,
  currentIndex,
  sizeConfig,
  showLabels,
}: DotsVariantProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        width: '100%',
        overflowX: 'auto',
        padding: '4px 0',
      }}
    >
      {phases.map((phase, index) => {
        const phaseDisplay = getPhaseDisplay(phase);
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        const dotColor = isCompleted || isCurrent ? phaseDisplay.color : colors.gray400;
        const dotSize = isCurrent ? sizeConfig.dotSizeActive : sizeConfig.dotSize;

        return (
          <React.Fragment key={phase}>
            {/* Connecting line (before dot, except first) */}
            {index > 0 && (
              <div
                style={{
                  flex: 1,
                  minWidth: '16px',
                  maxWidth: '40px',
                  height: sizeConfig.lineHeight,
                  backgroundColor: isCompleted ? getPhaseDisplay(phases[index - 1]).color : colors.gray200,
                  transition: 'background-color 0.3s ease',
                }}
              />
            )}

            {/* Dot with optional label */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  width: dotSize,
                  height: dotSize,
                  scale: isCurrent ? 1 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: '50%',
                  backgroundColor: isFuture ? 'transparent' : dotColor,
                  border: isFuture
                    ? `2px solid ${colors.gray400}`
                    : isCurrent
                    ? `3px solid ${hexToRgba(dotColor, 0.3)}`
                    : 'none',
                  boxShadow: isCurrent ? `0 0 0 3px ${hexToRgba(dotColor, 0.2)}` : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
                title={`${phaseDisplay.label}: ${isCompleted ? 'Selesai' : isCurrent ? 'Saat ini' : 'Belum'}`}
              />

              {showLabels && (
                <span
                  style={{
                    fontSize: sizeConfig.fontSize,
                    fontFamily: typography.fontFamily,
                    fontWeight: isCurrent ? typography.fontWeight.semibold : typography.fontWeight.normal,
                    color: isCurrent ? dotColor : isFuture ? colors.gray400 : colors.gray600,
                    whiteSpace: 'nowrap',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {phaseDisplay.label}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});

// ============================================================================
// Bar Variant
// ============================================================================

interface BarVariantProps {
  progress: number;
  currentPhase: LifecyclePhase;
  sizeConfig: SizeConfig;
}

const BarVariant = memo(function BarVariant({
  progress,
  currentPhase,
  sizeConfig,
}: BarVariantProps) {
  const phaseDisplay = getPhaseDisplay(currentPhase);
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Gradient from seedling green to current phase color
  const seedlingColor = getPhaseDisplay('seedling').color;
  const gradientStyle = `linear-gradient(90deg, ${seedlingColor} 0%, ${phaseDisplay.color} 100%)`;

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${clampedProgress}% - ${phaseDisplay.label}`}
      style={{
        width: '100%',
        height: sizeConfig.barHeight,
        backgroundColor: colors.gray200,
        borderRadius: radius.full,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          height: '100%',
          background: gradientStyle,
          borderRadius: radius.full,
          position: 'relative',
        }}
      >
        {/* Shimmer effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            animation: 'shimmer 2s infinite',
          }}
        />
      </motion.div>

      {/* Inline keyframes for shimmer */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
});

// ============================================================================
// Steps Variant
// ============================================================================

interface StepsVariantProps {
  phases: LifecyclePhase[];
  currentPhase: LifecyclePhase;
  currentIndex: number;
  sizeConfig: SizeConfig;
}

const StepsVariant = memo(function StepsVariant({
  phases,
  currentPhase,
  currentIndex,
  sizeConfig,
}: StepsVariantProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: sizeConfig.stepGap,
        width: '100%',
      }}
    >
      {phases.map((phase, index) => {
        const phaseConfig = getPhaseConfig(phase);
        const phaseDisplay = getPhaseDisplay(phase);
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <motion.div
            key={phase}
            initial={false}
            animate={{
              opacity: isFuture ? 0.5 : 1,
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: radius.lg,
              backgroundColor: isCurrent
                ? hexToRgba(phaseDisplay.color, 0.1)
                : 'transparent',
              border: isCurrent
                ? `1px solid ${hexToRgba(phaseDisplay.color, 0.3)}`
                : '1px solid transparent',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFuture
                  ? colors.gray200
                  : isCompleted
                  ? hexToRgba(phaseDisplay.color, 0.2)
                  : phaseDisplay.color,
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}
            >
              <span
                style={{
                  fontSize: sizeConfig.iconSize,
                  lineHeight: 1,
                  filter: isFuture ? 'grayscale(100%)' : 'none',
                }}
              >
                {isFuture ? '○' : isCompleted ? '✓' : phaseDisplay.icon}
              </span>
            </div>

            {/* Label and description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.sm,
                  fontWeight: isCurrent
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.medium,
                  color: isFuture ? colors.gray400 : colors.gray800,
                  marginBottom: '2px',
                }}
              >
                {phaseDisplay.label}
                {isCurrent && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.normal,
                      color: phaseDisplay.color,
                    }}
                  >
                    (Saat ini)
                  </span>
                )}
              </div>
              {phaseConfig && (
                <div
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.xs,
                    color: colors.gray600,
                    opacity: isFuture ? 0.6 : 1,
                  }}
                >
                  {phaseConfig.description}
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: isCompleted
                  ? colors.success
                  : isCurrent
                  ? phaseDisplay.color
                  : colors.gray400,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {isCompleted ? '✓' : isCurrent ? '●' : '○'}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * PhaseProgress Component
 *
 * Visualizes a plant's journey through its lifecycle phases.
 *
 * Variants:
 * - dots: Compact horizontal dots connected by lines (default)
 * - bar: Simple progress bar with gradient
 * - steps: Detailed vertical list with icons and descriptions
 *
 * Different lifecycle types show different phase sequences:
 * - annual_harvest: seedling → growing → flowering → fruiting → harvest_ready → harvested
 * - perennial_harvest: same + resting phase
 * - perpetual: seedling → growing → mature
 */
const PhaseProgress = memo(function PhaseProgress({
  currentPhase,
  lifecycleType,
  progress = 0,
  variant = 'dots',
  size = 'md',
  showLabels = false,
  className = '',
}: PhaseProgressProps) {
  const sizeConfig = SIZE_CONFIG[size];

  // Get valid phases for this lifecycle type
  const phases = useMemo(() => getValidPhases(lifecycleType), [lifecycleType]);

  // Find current phase index
  const currentIndex = useMemo(() => {
    const index = phases.indexOf(currentPhase);
    return index === -1 ? 0 : index;
  }, [phases, currentPhase]);

  // Calculate progress for bar variant if not provided
  const calculatedProgress = useMemo(() => {
    if (progress > 0) return progress;
    // Calculate based on current phase index
    return phases.length > 1
      ? Math.round((currentIndex / (phases.length - 1)) * 100)
      : 0;
  }, [progress, currentIndex, phases.length]);

  // Build aria-label
  const ariaLabel = useMemo(() => {
    const phaseDisplay = getPhaseDisplay(currentPhase);
    return `Perjalanan tanaman: fase ${phaseDisplay.label} (${currentIndex + 1} dari ${phases.length} fase)`;
  }, [currentPhase, currentIndex, phases.length]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    width: '100%',
    fontFamily: typography.fontFamily,
  };

  return (
    <div
      className={className}
      style={containerStyles}
      aria-label={ariaLabel}
      role={variant === 'bar' ? undefined : 'group'}
    >
      {variant === 'dots' && (
        <DotsVariant
          phases={phases}
          currentPhase={currentPhase}
          currentIndex={currentIndex}
          sizeConfig={sizeConfig}
          showLabels={showLabels}
        />
      )}

      {variant === 'bar' && (
        <BarVariant
          progress={calculatedProgress}
          currentPhase={currentPhase}
          sizeConfig={sizeConfig}
        />
      )}

      {variant === 'steps' && (
        <StepsVariant
          phases={phases}
          currentPhase={currentPhase}
          currentIndex={currentIndex}
          sizeConfig={sizeConfig}
        />
      )}
    </div>
  );
});

export default PhaseProgress;
