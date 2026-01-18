'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CheckCircle,
  ArrowCounterClockwise,
  X,
} from '@phosphor-icons/react';
import type { ActionDrawerProps } from './types';

/**
 * ActionDrawer Component
 * A reusable drawer component for recording plant care actions.
 * Used for fertilizing, pruning, and other custom actions.
 */
const ActionDrawer: React.FC<ActionDrawerProps> = ({
  isOpen,
  onClose,
  title,
  notes,
  setNotes,
  photo,
  photoPreview,
  onPhotoSelect,
  onRemovePhoto,
  onSubmit,
  isSubmitting,
  photoInputRef,
  notesPlaceholder = 'Tambahkan catatan (opsional)...',
  submitLabel = 'Simpan',
  showStatus = false,
  statusDoneToday = false,
  statusLabel = '',
  onUndo,
}) => {
  const handleClose = () => {
    onClose();
  };

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
            onClick={handleClose}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 5000,
            }}
          />

          {/* Drawer Container - for centering */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 'var(--app-max-width)',
              zIndex: 5001,
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px 16px 0 0',
                padding: '24px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
                <button
                  onClick={handleClose}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} weight="regular" color="#757575" />
                </button>
              </div>

              {/* Status indicator - shown when action already done today */}
              {showStatus && statusDoneToday && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#F0FDF4',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <CheckCircle size={24} weight="regular" color="#7CB342" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#7CB342',
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
              )}

              {/* Photo Upload */}
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={onPhotoSelect}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: photoPreview ? '200px' : '120px',
                  border: '2px dashed #E0E0E0',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#FAFAFA',
                  position: 'relative',
                }}
              >
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Remove photo button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePhoto();
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={16} weight="regular" color="#FFFFFF" />
                    </button>
                  </>
                ) : (
                  <>
                    <Camera size={32} weight="regular" color="#757575" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#757575',
                      }}
                    >
                      Tambah foto (opsional)
                    </span>
                  </>
                )}
              </div>

              {/* Notes Textarea */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={notesPlaceholder}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid transparent',
                  borderRadius: '8px',
                  resize: 'vertical',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '2px solid #7CB342'}
                onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '2px solid transparent'}
              />

              {/* Submit Button */}
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isSubmitting ? '#A5D6A7' : '#7CB342',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmitting ? 'default' : 'pointer',
                  marginBottom: (showStatus && statusDoneToday && onUndo) ? '12px' : '0',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {isSubmitting ? 'Menyimpan...' : submitLabel}
                </span>
              </button>

              {/* Undo button - only show if already done today and onUndo provided */}
              {showStatus && statusDoneToday && onUndo && (
                <button
                  onClick={onUndo}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowCounterClockwise size={20} weight="regular" color="#757575" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#DC2626',
                    }}
                  >
                    Batalkan
                  </span>
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ActionDrawer;
