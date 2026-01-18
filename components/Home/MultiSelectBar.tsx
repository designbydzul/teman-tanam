'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Drop,
  Leaf,
  Scissors,
  DotsThree,
  X,
  Trash,
} from '@phosphor-icons/react';
import type { BulkActionType } from '@/types';

interface MultiSelectBarProps {
  selectedCount: number;
  isActioning: boolean;
  onCancel: () => void;
  onAction: (actionType: BulkActionType) => void;
  onDelete: () => void;
}

/**
 * MultiSelectBar Component
 *
 * Bottom action bar shown when in multi-select mode.
 * Contains Cancel, 4 action buttons (Siram, Pupuk, Pangkas, Lainnya), and Delete.
 */
const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  selectedCount,
  isActioning,
  onCancel,
  onAction,
  onDelete,
}) => {
  const isDisabled = selectedCount === 0 || isActioning;

  const ActionButton: React.FC<{
    icon: React.ReactNode;
    actionType: BulkActionType;
    label: string;
  }> = ({ icon, actionType, label }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onAction(actionType)}
      disabled={isDisabled}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '52px',
        height: '52px',
        backgroundColor: '#F5F5F5',
        border: 'none',
        borderRadius: '50%',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: selectedCount === 0 ? 0.5 : 1,
        padding: 0,
      }}
    >
      {icon}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E4E4E7',
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
      }}
    >
      {/* LEFT - Cancel Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onCancel}
        aria-label="Batal"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          backgroundColor: '#F5F5F5',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <X size={20} weight="regular" color="#757575" />
      </motion.button>

      {/* CENTER - Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <ActionButton
          icon={<Drop size={20} weight="regular" color="#757575" />}
          actionType="siram"
          label="Siram tanaman"
        />
        <ActionButton
          icon={<Leaf size={20} weight="regular" color="#757575" />}
          actionType="pupuk"
          label="Pupuk tanaman"
        />
        <ActionButton
          icon={<Scissors size={20} weight="regular" color="#757575" />}
          actionType="pangkas"
          label="Pangkas tanaman"
        />
        <ActionButton
          icon={<DotsThree size={20} weight="bold" color="#757575" />}
          actionType="lainnya"
          label="Aksi lainnya"
        />
      </div>

      {/* RIGHT - Delete Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onDelete}
        disabled={isDisabled}
        aria-label="Hapus tanaman"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          backgroundColor: selectedCount > 0 ? '#FEE2E2' : '#F5F5F5',
          border: 'none',
          borderRadius: '50%',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: selectedCount === 0 ? 0.5 : 1,
          padding: 0,
        }}
      >
        <Trash size={20} weight="regular" color={selectedCount > 0 ? '#EF4444' : '#757575'} />
      </motion.button>
    </motion.div>
  );
};

export default MultiSelectBar;
