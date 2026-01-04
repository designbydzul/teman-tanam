'use client';

import React from 'react';
import { colors, radius, typography } from '@/styles/theme';
import type { StatItem } from './types';

interface StatsCardsProps {
  stats: StatItem[];
  isLoading?: boolean;
  isVisible?: boolean;
}

/**
 * StatsCards Component
 *
 * Displays a row of 4 stat cards showing plant counts.
 */
const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  isLoading = false,
  isVisible = true,
}) => {
  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        paddingLeft: '24px',
        paddingRight: '24px',
        marginBottom: '16px',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            padding: '10px',
            backgroundColor: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radius.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: '11px',
              fontWeight: typography.fontWeight.normal,
              color: colors.gray600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {stat.label}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.gray800,
              }}
            >
              {stat.value}
            </span>
            <stat.Icon size={20} weight="regular" color={colors.gray400} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
