'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, typography } from '@/styles/theme';
import PhaseBadge from '@/components/plants/PhaseBadge';
import { getPhaseDisplay } from '@/lib/lifecycle-config';
import type { PlantUI as Plant, LifecyclePhase } from '@/types';

interface PlantCardProps {
  plant: Plant;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  failedImages: Set<string>;
  failedSpeciesImages: Set<string>;
  onImageError: (plantId: string) => void;
  onSpeciesImageError: (speciesId: string) => void;
  onClick: () => void;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
}

/**
 * PlantCard Component
 *
 * Displays a single plant in the grid with image, name, and status.
 * Supports multi-select mode with visual selection indicator.
 *
 * Wrapped in React.memo to prevent unnecessary re-renders when:
 * - Other plants in the list change
 * - Parent component re-renders but this plant's data hasn't changed
 */
const PlantCard = memo(function PlantCard({
  plant,
  isSelected,
  isMultiSelectMode,
  failedImages,
  failedSpeciesImages,
  onImageError,
  onSpeciesImageError,
  onClick,
  onLongPressStart,
  onLongPressEnd,
}: PlantCardProps) {
  const hasPlantImage = plant.image && !failedImages.has(plant.id);
  const speciesId = plant.species?.id || '';
  const hasSpeciesImage = plant.species?.imageUrl && speciesId && !failedSpeciesImages.has(speciesId);

  // Get current phase info
  const currentPhase = plant.currentPhase as LifecyclePhase | null;
  const isHarvestReady = currentPhase === 'harvest_ready';
  const phaseDisplay = useMemo(() => {
    return currentPhase ? getPhaseDisplay(currentPhase) : null;
  }, [currentPhase]);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onTouchStart={onLongPressStart}
      onTouchEnd={onLongPressEnd}
      onMouseDown={onLongPressStart}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        minWidth: 0,
        width: '100%',
      }}
    >
      {/* Plant Image with Selection Overlay */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: radius.xl,
          overflow: 'hidden',
          marginBottom: '8px',
          backgroundColor: colors.gray100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: isMultiSelectMode && isSelected
            ? `3px solid ${colors.greenFresh}`
            : isHarvestReady
            ? `3px solid ${colors.yellowSun}`
            : '3px solid transparent',
          boxShadow: isHarvestReady
            ? `0 0 12px ${colors.yellowSun}50`
            : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {hasPlantImage ? (
          <>
            <img
              src={plant.image!}
              alt={plant.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={() => onImageError(plant.id)}
            />
            {/* Species image badge - only show when plant has custom photo */}
            {hasSpeciesImage && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                <img
                  src={plant.species?.imageUrl || ''}
                  alt={plant.species?.name || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={() => speciesId && onSpeciesImageError(speciesId)}
                />
              </div>
            )}
          </>
        ) : hasSpeciesImage ? (
          /* Show species image as main image when no plant photo */
          <img
            src={plant.species?.imageUrl || ''}
            alt={plant.species?.name || plant.name || ''}
            style={{
              width: '70%',
              height: '70%',
              objectFit: 'contain',
            }}
            onError={() => speciesId && onSpeciesImageError(speciesId)}
          />
        ) : (
          <span style={{ fontSize: '3rem' }}>
            {plant.species?.emoji || '🌱'}
          </span>
        )}
      </div>

      {/* Plant Name */}
      <h3
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.lineHeight.normal,
          color: colors.greenForest,
          margin: '0 0 4px 0',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {plant.name}
      </h3>

      {/* Phase Badge or Status */}
      {currentPhase ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <PhaseBadge
            phase={currentPhase}
            size="sm"
            showIcon
            showLabel
          />
        </div>
      ) : (
        <p
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.normal,
            lineHeight: typography.lineHeight.normal,
            color: plant.statusColor || colors.gray600,
            margin: 0,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {plant.status}
        </p>
      )}
    </motion.div>
  );
});

export default PlantCard;
