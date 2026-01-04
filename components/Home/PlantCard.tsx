'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { colors, radius, typography } from '@/styles/theme';
import type { Plant } from './types';

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
 */
const PlantCard: React.FC<PlantCardProps> = ({
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
}) => {
  const hasPlantImage = plant.image && !failedImages.has(plant.id);
  const hasSpeciesImage = plant.species?.imageUrl && !failedSpeciesImages.has(plant.species.id);

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
            : '3px solid transparent',
          transition: 'border-color 0.2s ease',
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
                  src={plant.species!.imageUrl}
                  alt={plant.species?.name || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={() => onSpeciesImageError(plant.species!.id)}
                />
              </div>
            )}
          </>
        ) : hasSpeciesImage ? (
          /* Show species image as main image when no plant photo */
          <img
            src={plant.species!.imageUrl}
            alt={plant.species?.name || plant.name}
            style={{
              width: '70%',
              height: '70%',
              objectFit: 'contain',
            }}
            onError={() => onSpeciesImageError(plant.species!.id)}
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
          margin: '0 0 2px 0',
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

      {/* Plant Status */}
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
    </motion.div>
  );
};

export default PlantCard;
