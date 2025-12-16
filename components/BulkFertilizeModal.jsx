import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CircleNotch, Leaf } from '@phosphor-icons/react';

// Spin animation style
const spinStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const BulkFertilizeModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  alreadyFertilizedToday = [],
  isProcessing = false,
}) => {
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsLoadingPhoto(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setPhotoFile(file);
    } catch (err) {
      console.error('Error processing photo:', err);
    } finally {
      setIsLoadingPhoto(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handleSubmit = () => {
    onSubmit({
      notes: notes.trim(),
      photoFile,
    });
  };

  const handleClose = () => {
    // Cleanup
    handleRemovePhoto();
    setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{spinStyle}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 5000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              zIndex: 5001,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Leaf size={24} weight="fill" color="#16A34A" />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#2C2C2C',
                      margin: 0,
                    }}
                  >
                    Beri Pupuk
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#666666',
                      margin: 0,
                    }}
                  >
                    {selectedCount} tanaman dipilih
                  </p>
                </div>
              </div>

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
                <X size={20} weight="bold" color="#666666" />
              </button>
            </div>

            {/* Warning for plants already fertilized today */}
            {alreadyFertilizedToday.length > 0 && (
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#B45309',
                    margin: '0 0 4px 0',
                  }}
                >
                  {alreadyFertilizedToday.length} tanaman sudah dipupuk hari ini:
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#92400E',
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  {alreadyFertilizedToday.map(p => p.name).join(', ')}
                </p>
              </div>
            )}

            {/* Photo Upload Section */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#666666',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Foto (opsional)
              </label>

              <div
                style={{
                  border: '2px dashed #E0E0E0',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FAFAFA',
                  minHeight: '120px',
                }}
              >
                {isLoadingPhoto ? (
                  <CircleNotch
                    size={32}
                    weight="bold"
                    color="#16A34A"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                ) : photoPreview ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                    <button
                      onClick={handleRemovePhoto}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={16} weight="bold" color="#FFFFFF" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '16px 24px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E0E0E0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#666666',
                    }}
                  >
                    <Camera size={24} weight="bold" color="#16A34A" />
                    Tambah Foto
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#666666',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Catatan (opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pupuk NPK 15-15-15, 1 sendok per tanaman..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid transparent',
                  borderRadius: '12px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 200ms',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#16A34A';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#666666',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#16A34A',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  opacity: isProcessing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isProcessing ? (
                  <>
                    <CircleNotch
                      size={20}
                      weight="bold"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Memproses...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BulkFertilizeModal;
