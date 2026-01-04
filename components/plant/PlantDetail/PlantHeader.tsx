'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DotsThree, PencilSimple, Trash, ChatDots } from '@phosphor-icons/react';
import { colors, radius, typography } from '@/styles/theme';
import type { PlantData } from './types';

interface PlantHeaderProps {
  plant: PlantData;
  daysSinceStarted: number | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTanyaTanam: () => void;
  onImageClick: () => void;
}

/**
 * PlantHeader Component
 *
 * Displays plant image, name, and action buttons (back, menu).
 */
const PlantHeader: React.FC<PlantHeaderProps> = ({
  plant,
  daysSinceStarted,
  onBack,
  onEdit,
  onDelete,
  onTanyaTanam,
  onImageClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [speciesImageError, setSpeciesImageError] = useState(false);

  const handleMenuItemClick = (action: () => void) => {
    setShowMenu(false);
    action();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Plant Image */}
      <div
        onClick={plant.photoUrl && !imageLoadError ? onImageClick : undefined}
        style={{
          width: '100%',
          height: '280px',
          backgroundColor: colors.gray100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: plant.photoUrl && !imageLoadError ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {plant.photoUrl && !imageLoadError ? (
          <img
            src={plant.photoUrl}
            alt={plant.customName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={() => setImageLoadError(true)}
          />
        ) : plant.species?.imageUrl && !speciesImageError ? (
          <img
            src={plant.species.imageUrl}
            alt={plant.species.name || plant.customName}
            style={{
              width: '60%',
              height: '60%',
              objectFit: 'contain',
            }}
            onError={() => setSpeciesImageError(true)}
          />
        ) : (
          <span style={{ fontSize: '5rem' }}>
            {plant.species?.emoji || '🌱'}
          </span>
        )}

        {/* Species badge when plant has custom photo */}
        {plant.photoUrl && !imageLoadError && plant.species?.imageUrl && !speciesImageError && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '48px',
              height: '48px',
              borderRadius: radius.lg,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}
          >
            <img
              src={plant.species.imageUrl}
              alt={plant.species.name || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
      </div>

      {/* Back Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        aria-label="Kembali ke daftar tanaman"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      >
        <ArrowLeft size={24} weight="bold" color={colors.gray800} aria-hidden="true" />
      </motion.button>

      {/* Menu Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Menu aksi tanaman"
        aria-expanded={showMenu}
        aria-haspopup="menu"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      >
        <DotsThree size={24} weight="bold" color={colors.gray800} aria-hidden="true" />
      </motion.button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 15,
            }}
          />
          {/* Menu */}
          <motion.div
            role="menu"
            aria-label="Menu aksi tanaman"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: '64px',
              right: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: radius.lg,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              zIndex: 20,
              minWidth: '180px',
            }}
          >
            {/* Tanya Tanam */}
            <button
              role="menuitem"
              onClick={() => handleMenuItemClick(onTanyaTanam)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.sm,
                color: colors.gray800,
                textAlign: 'left',
              }}
            >
              <ChatDots size={20} weight="regular" color={colors.gray600} aria-hidden="true" />
              Tanya Tanam
            </button>

            {/* Edit */}
            <button
              role="menuitem"
              onClick={() => handleMenuItemClick(onEdit)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.sm,
                color: colors.gray800,
                textAlign: 'left',
                borderTop: `1px solid ${colors.gray100}`,
              }}
            >
              <PencilSimple size={20} weight="regular" color={colors.gray600} aria-hidden="true" />
              Edit Tanaman
            </button>

            {/* Delete */}
            <button
              role="menuitem"
              onClick={() => handleMenuItemClick(onDelete)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.sm,
                color: '#F44336',
                textAlign: 'left',
                borderTop: `1px solid ${colors.gray100}`,
              }}
            >
              <Trash size={20} weight="regular" color="#F44336" aria-hidden="true" />
              Hapus Tanaman
            </button>
          </motion.div>
        </>
      )}

      {/* Plant Info Section */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.gray100}`,
        }}
      >
        {/* Plant Name */}
        <h1
          className="font-accent"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '2rem',
            fontWeight: 600,
            color: colors.greenForest,
            margin: '0 0 4px 0',
          }}
        >
          {plant.customName}
        </h1>

        {/* Species Name */}
        {plant.species?.name && (
          <p
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.sm,
              color: colors.gray600,
              margin: '0 0 8px 0',
            }}
          >
            {plant.species.name}
            {plant.species.scientific && (
              <span style={{ fontStyle: 'italic' }}> ({plant.species.scientific})</span>
            )}
          </p>
        )}

        {/* Location and days */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          {/* Location badge */}
          <span
            style={{
              padding: '6px 12px',
              backgroundColor: colors.gray100,
              borderRadius: radius.full,
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.xs,
              color: colors.gray600,
            }}
          >
            {plant.location}
          </span>

          {/* Days since started */}
          {daysSinceStarted !== null && (
            <span
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.fontSize.xs,
                color: colors.gray600,
              }}
            >
              {daysSinceStarted === 0
                ? 'Baru ditambahkan'
                : `${daysSinceStarted} hari bersama`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantHeader;
