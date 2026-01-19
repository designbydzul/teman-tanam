'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getPhaseDisplay } from '@/lib/lifecycle-config';
import { typography, radius } from '@/styles/theme';
import type { LifecyclePhase } from '@/types';

// ============================================================================
// Types
// ============================================================================

type BadgeSize = 'sm' | 'md' | 'lg';

interface PhaseBadgeProps {
  /** The lifecycle phase to display */
  phase: LifecyclePhase | string | null | undefined;
  /** Size variant */
  size?: BadgeSize;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Whether to show the icon emoji */
  showIcon?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

// ============================================================================
// Size Configuration
// ============================================================================

interface SizeConfig {
  fontSize: string;
  paddingX: string;
  paddingY: string;
  iconSize: string;
  gap: string;
}

const SIZE_CONFIG: Record<BadgeSize, SizeConfig> = {
  sm: {
    fontSize: typography.fontSize.xs,
    paddingX: '8px',
    paddingY: '2px',
    iconSize: '12px',
    gap: '4px',
  },
  md: {
    fontSize: typography.fontSize.sm,
    paddingX: '10px',
    paddingY: '4px',
    iconSize: '14px',
    gap: '6px',
  },
  lg: {
    fontSize: typography.fontSize.base,
    paddingX: '12px',
    paddingY: '6px',
    iconSize: '16px',
    gap: '8px',
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

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.max(0, parseInt(cleanHex.substring(0, 2), 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, parseInt(cleanHex.substring(2, 4), 16) - Math.round(255 * percent / 100));
  const b = Math.max(0, parseInt(cleanHex.substring(4, 6), 16) - Math.round(255 * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PhaseBadge Component
 *
 * Displays a plant's lifecycle phase as a small badge with icon and label.
 * Used on plant cards and detail pages.
 *
 * Features:
 * - Three size variants (sm, md, lg)
 * - Color-coded based on phase
 * - Special highlight for harvest_ready phase
 * - Accessible with proper aria-label
 */
const PhaseBadge = memo(function PhaseBadge({
  phase,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className = '',
  onClick,
}: PhaseBadgeProps) {
  // Get phase display info
  const phaseDisplay = useMemo(() => getPhaseDisplay(phase), [phase]);
  const sizeConfig = SIZE_CONFIG[size];

  // Determine colors
  const backgroundColor = useMemo(
    () => hexToRgba(phaseDisplay.color, 0.15),
    [phaseDisplay.color]
  );
  const textColor = useMemo(
    () => darkenColor(phaseDisplay.color, 30),
    [phaseDisplay.color]
  );
  const borderColor = useMemo(
    () => hexToRgba(phaseDisplay.color, 0.3),
    [phaseDisplay.color]
  );

  // Check if this is harvest_ready for special highlight
  const isHarvestReady = phase === 'harvest_ready';

  // Build aria-label
  const ariaLabel = `Fase tanaman: ${phaseDisplay.label}`;

  // Base styles
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    padding: `${sizeConfig.paddingY} ${sizeConfig.paddingX}`,
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: radius.full,
    fontFamily: typography.fontFamily,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.fontWeight.medium,
    color: textColor,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  };

  // Harvest ready special styles
  const harvestReadyStyles: React.CSSProperties = isHarvestReady
    ? {
        backgroundColor: hexToRgba(phaseDisplay.color, 0.25),
        border: `1.5px solid ${hexToRgba(phaseDisplay.color, 0.5)}`,
        boxShadow: `0 0 8px ${hexToRgba(phaseDisplay.color, 0.3)}`,
      }
    : {};

  // Render as motion element for harvest_ready animation
  if (isHarvestReady) {
    return (
      <motion.span
        className={className}
        style={{ ...baseStyles, ...harvestReadyStyles }}
        aria-label={ariaLabel}
        role={onClick ? 'button' : 'status'}
        onClick={onClick}
        animate={{
          boxShadow: [
            `0 0 4px ${hexToRgba(phaseDisplay.color, 0.2)}`,
            `0 0 12px ${hexToRgba(phaseDisplay.color, 0.4)}`,
            `0 0 4px ${hexToRgba(phaseDisplay.color, 0.2)}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.95 } : undefined}
      >
        {showIcon && (
          <span
            style={{
              fontSize: sizeConfig.iconSize,
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            {phaseDisplay.icon}
          </span>
        )}
        {showLabel && <span>{phaseDisplay.label}</span>}
      </motion.span>
    );
  }

  // Regular badge (non-animated)
  const Component = onClick ? motion.button : 'span';
  const motionProps = onClick
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }
    : {};

  return (
    <Component
      className={className}
      style={baseStyles}
      aria-label={ariaLabel}
      role={onClick ? 'button' : 'status'}
      onClick={onClick}
      {...motionProps}
    >
      {showIcon && (
        <span
          style={{
            fontSize: sizeConfig.iconSize,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {phaseDisplay.icon}
        </span>
      )}
      {showLabel && <span>{phaseDisplay.label}</span>}
    </Component>
  );
});

export default PhaseBadge;
