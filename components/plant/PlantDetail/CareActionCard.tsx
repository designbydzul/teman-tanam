'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Drop, Leaf, Scissors, Plus } from '@phosphor-icons/react';
import { colors, radius, typography } from '@/styles/theme';
import type { ActionStyle, CareStatusUI as CareStatus } from '@/types';

interface CareActionCardProps {
  actionType: 'water' | 'fertilize' | 'prune' | 'other';
  status: CareStatus;
  actionStyle: ActionStyle;
  doneToday: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * CareActionCard Component
 *
 * Displays a care action card with icon, status, and click to log action.
 *
 * Wrapped in React.memo to prevent re-renders when:
 * - Other action cards update (e.g., only water status changes)
 * - Parent PlantDetail re-renders but this card's props haven't changed
 */
const CareActionCard = memo(function CareActionCard({
  actionType,
  status,
  actionStyle,
  doneToday,
  onClick,
  disabled = false,
}: CareActionCardProps) {
  const getIcon = () => {
    switch (actionType) {
      case 'water':
        return <Drop size={28} weight={doneToday ? 'fill' : 'duotone'} color={actionStyle.iconColor} />;
      case 'fertilize':
        return <Leaf size={28} weight={doneToday ? 'fill' : 'duotone'} color={actionStyle.iconColor} />;
      case 'prune':
        return <Scissors size={28} weight={doneToday ? 'fill' : 'duotone'} color={actionStyle.iconColor} />;
      case 'other':
        return <Plus size={28} weight="bold" color={actionStyle.iconColor} />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (actionType) {
      case 'water':
        return 'Siram';
      case 'fertilize':
        return 'Pupuk';
      case 'prune':
        return 'Pangkas';
      case 'other':
        return 'Lainnya';
      default:
        return '';
    }
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 12px',
        backgroundColor: doneToday ? actionStyle.iconBg : '#FFFFFF',
        border: `2px solid ${actionStyle.borderColor}`,
        borderRadius: radius.lg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flex: 1,
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: actionStyle.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {getIcon()}
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.gray800,
        }}
      >
        {getLabel()}
      </span>

      {/* Status text - only show for main actions */}
      {actionType !== 'other' && (
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.normal,
            color: actionStyle.color,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {actionStyle.text}
        </span>
      )}
    </motion.button>
  );
});

export default CareActionCard;
