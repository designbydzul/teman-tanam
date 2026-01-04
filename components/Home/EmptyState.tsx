'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Plant, MagnifyingGlass } from '@phosphor-icons/react';
import { colors, typography } from '@/styles/theme';

interface EmptyStateProps {
  hasNoPlants: boolean;
  isSearching: boolean;
  isFilteringLocation: boolean;
  isFilteringStatus: boolean;
  onAddPlant: () => void;
}

/**
 * EmptyState Component
 *
 * Shows appropriate message when no plants match current filters.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  hasNoPlants,
  isSearching,
  isFilteringLocation,
  isFilteringStatus,
  onAddPlant,
}) => {
  // Determine message based on why the list is empty
  const getMessage = () => {
    if (hasNoPlants) {
      return {
        icon: <Plant size={64} weight="duotone" color={colors.greenFresh} />,
        title: 'Belum ada tanaman',
        subtitle: 'Tambahkan tanaman pertamamu untuk mulai tracking perawatan',
        showAddButton: true,
      };
    }

    if (isSearching) {
      return {
        icon: <MagnifyingGlass size={64} weight="duotone" color={colors.gray400} />,
        title: 'Tidak ditemukan',
        subtitle: 'Coba kata kunci lain atau reset filter pencarian',
        showAddButton: false,
      };
    }

    if (isFilteringLocation || isFilteringStatus) {
      return {
        icon: <Plant size={64} weight="duotone" color={colors.gray400} />,
        title: 'Tidak ada tanaman',
        subtitle: 'Tidak ada tanaman yang cocok dengan filter ini',
        showAddButton: false,
      };
    }

    return {
      icon: <Plant size={64} weight="duotone" color={colors.gray400} />,
      title: 'Tidak ada tanaman',
      subtitle: 'Tambahkan tanaman untuk memulai',
      showAddButton: true,
    };
  };

  const { icon, title, subtitle, showAddButton } = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          marginBottom: '24px',
          opacity: 0.8,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.gray800,
          margin: '0 0 8px 0',
        }}
      >
        {title}
      </h3>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.normal,
          color: colors.gray600,
          margin: '0 0 24px 0',
          maxWidth: '280px',
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>

      {/* Add Button */}
      {showAddButton && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAddPlant}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: colors.greenFresh,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: '#FFFFFF',
          }}
        >
          <Plus size={20} weight="bold" />
          Tambah Tanaman
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
