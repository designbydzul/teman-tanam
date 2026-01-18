'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash } from '@phosphor-icons/react';
import { colors, radius, typography } from '@/styles/theme';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  plantName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

/**
 * DeleteConfirmModal Component
 *
 * Confirmation modal for deleting a plant.
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  plantName,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="ios-fixed-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 6000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: radius.xl,
                padding: '32px 24px',
                maxWidth: '320px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Trash size={32} weight="regular" color="#DC2626" />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray800,
                  margin: '0 0 12px 0',
                }}
              >
                Hapus Tanaman?
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize.sm,
                  color: colors.gray600,
                  margin: '0 0 24px 0',
                  lineHeight: 1.5,
                }}
              >
                Kamu yakin mau hapus <strong>{plantName}</strong>? Semua data perawatan juga akan hilang.
              </p>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                {/* Cancel */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: radius.lg,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.gray800,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  Batal
                </motion.button>

                {/* Confirm */}
                <motion.button
                  whileTap={{ scale: isDeleting ? 1 : 0.95 }}
                  onClick={onConfirm}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#F44336',
                    border: 'none',
                    borderRadius: radius.lg,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: '#FFFFFF',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
