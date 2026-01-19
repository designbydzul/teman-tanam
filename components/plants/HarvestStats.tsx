'use client';

import React from 'react';
import { Basket, CalendarCheck, Timer } from '@phosphor-icons/react';
import { colors, typography } from '@/styles/theme';
import type { PlantLifecycleType } from '@/types';

interface HarvestStatsProps {
  totalHarvests: number;
  firstHarvestAt: string | Date | null;
  daysUntilHarvest: number | null;
  isOverdue: boolean;
  lifecycleType: PlantLifecycleType | null;
  className?: string;
}

/**
 * Formats a date in short Indonesian format (e.g., "15 Jan 2025")
 */
const formatDateShort = (date: string | Date): string => {
  const d = new Date(date);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * HarvestStats Component
 *
 * Displays harvest statistics for harvestable plants.
 * Shows total harvests, first harvest date, and expected harvest countdown.
 */
const HarvestStats: React.FC<HarvestStatsProps> = ({
  totalHarvests,
  firstHarvestAt,
  daysUntilHarvest,
  isOverdue,
  lifecycleType,
  className,
}) => {
  // Only render for harvestable plants
  if (!lifecycleType || lifecycleType === 'perpetual') {
    return null;
  }

  const hasHarvested = totalHarvests > 0;
  const isReadyToHarvest = daysUntilHarvest !== null && daysUntilHarvest <= 0;

  return (
    <div
      className={className}
      style={{
        backgroundColor: hasHarvested ? 'rgba(255, 213, 79, 0.08)' : '#FAFAFA',
        borderRadius: '12px',
        padding: '12px 16px',
        border: hasHarvested
          ? '1px solid rgba(255, 213, 79, 0.3)'
          : '1px solid #E4E4E7',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: hasHarvested ? '8px' : '0',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: hasHarvested
              ? 'rgba(255, 213, 79, 0.2)'
              : 'rgba(117, 117, 117, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Basket
            size={16}
            weight="fill"
            color={hasHarvested ? colors.yellowSun : '#757575'}
          />
        </div>

        {hasHarvested ? (
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: '#795548',
            }}
          >
            Sudah dipanen {totalHarvests} kali 🎉
          </span>
        ) : (
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: '#757575',
            }}
          >
            Belum pernah dipanen
          </span>
        )}
      </div>

      {/* Details for harvested plants */}
      {hasHarvested && firstHarvestAt && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '36px',
            marginBottom: '4px',
          }}
        >
          <CalendarCheck size={14} weight="regular" color="#9E9E9E" />
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.xs,
              color: '#757575',
            }}
          >
            Panen pertama: {formatDateShort(firstHarvestAt)}
          </span>
        </div>
      )}

      {/* Harvest countdown for non-harvested plants */}
      {!hasHarvested && daysUntilHarvest !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '36px',
            marginTop: '6px',
          }}
        >
          <Timer
            size={14}
            weight="regular"
            color={isReadyToHarvest || isOverdue ? colors.yellowSun : '#9E9E9E'}
          />
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.xs,
              color: isReadyToHarvest || isOverdue ? '#795548' : '#757575',
              fontWeight: isReadyToHarvest || isOverdue
                ? typography.fontWeight.medium
                : typography.fontWeight.normal,
            }}
          >
            {isReadyToHarvest || isOverdue
              ? 'Kayaknya udah siap dipanen nih! ✨'
              : `Sekitar ${daysUntilHarvest} hari lagi siap panen`
            }
          </span>
        </div>
      )}

      {/* Perennial hint */}
      {lifecycleType === 'perennial_harvest' && hasHarvested && (
        <div
          style={{
            marginLeft: '36px',
            marginTop: '4px',
          }}
        >
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.xs,
              color: '#9E9E9E',
              fontStyle: 'italic',
            }}
          >
            Tanaman ini bisa dipanen berkali-kali
          </span>
        </div>
      )}
    </div>
  );
};

export default HarvestStats;
