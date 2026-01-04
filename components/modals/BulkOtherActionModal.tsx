'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CircleNotch } from '@phosphor-icons/react';

const spinStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

interface Plant {
  id: string;
  name: string;
}

interface SubmitData {
  actionName: string;
  notes: string;
  photoFile: File | null;
}

interface BulkOtherActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitData) => void;
  selectedPlants?: Plant[];
  isProcessing?: boolean;
}

const BulkOtherActionModal: React.FC<BulkOtherActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlants = [],
  isProcessing = false,
}) => {
  const formatPlantNames = (plants: Plant[]) => {
    if (plants.length <= 5) {
      return plants.map(p => p.name).join(', ');
    }
    const firstFive = plants.slice(0, 5).map(p => p.name).join(', ');
    const remaining = plants.length - 5;
    return `${firstFive}, dan ${remaining} lainnya`;
  };

  const [actionName, setActionName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsLoadingPhoto(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setPhotoFile(file);
    } catch (err) {
      console.error('Error processing photo:', err);
    } finally {
      setIsLoadingPhoto(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handleSubmit = () => {
    if (!actionName.trim()) return;
    onSubmit({ actionName: actionName.trim(), notes: notes.trim(), photoFile });
  };

  const handleClose = () => {
    handleRemovePhoto();
    setActionName('');
    setNotes('');
    onClose();
  };

  const isValid = actionName.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{spinStyle}</style>
          <motion.div
            className="ios-fixed-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 5000 }}
          />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--app-max-width)', zIndex: 5001 }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ backgroundColor: '#FFFFFF', borderRadius: '12px 12px 0 0', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: '1.75rem', fontWeight: 600, color: '#2D5016', margin: 0 }}>Catat Aktivitas Lain</h2>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleClose} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="#757575" strokeWidth="2" strokeLinecap="round" /></svg>
                </motion.button>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: '#F0FDF4', borderRadius: '12px', marginBottom: '20px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#16A34A', margin: '0 0 4px 0' }}>{selectedPlants.length} tanaman dipilih:</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 400, color: '#16A34A', margin: 0, lineHeight: '1.4' }}>{formatPlantNames(selectedPlants)}</p>
              </div>

              {/* Action Name Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#2C2C2C', display: 'block', marginBottom: '8px' }}>Nama Aktivitas *</label>
                <input
                  type="text"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder="Contoh: Repotting, Panen, dll."
                  style={{ width: '100%', padding: '16px', fontSize: '1rem', fontFamily: "'Inter', sans-serif", color: '#2C2C2C', backgroundColor: '#FAFAFA', border: '2px solid transparent', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.border = '2px solid #7CB342'; }}
                  onBlur={(e) => { e.target.style.border = '2px solid transparent'; }}
                />
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              <div onClick={() => !isLoadingPhoto && !photoPreview && fileInputRef.current?.click()} style={{ width: '100%', height: photoPreview ? '200px' : '120px', border: '2px dashed #E0E0E0', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: photoPreview ? 'default' : 'pointer', marginBottom: '16px', overflow: 'hidden', backgroundColor: '#FAFAFA', position: 'relative' }}>
                {isLoadingPhoto ? (
                  <CircleNotch size={32} weight="bold" color="#7CB342" style={{ animation: 'spin 1s linear infinite' }} />
                ) : photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }} style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" /></svg>
                    </motion.button>
                  </>
                ) : (
                  <>
                    <Camera size={32} weight="duotone" color="#999999" />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#999999' }}>Tambah foto (opsional)</span>
                  </>
                )}
              </div>

              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)..." style={{ width: '100%', minHeight: '100px', padding: '16px', fontSize: '1rem', fontFamily: "'Inter', sans-serif", color: '#2C2C2C', backgroundColor: '#FAFAFA', border: '2px solid transparent', borderRadius: '12px', resize: 'vertical', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.border = '2px solid #7CB342'; }} onBlur={(e) => { e.target.style.border = '2px solid transparent'; }} />

              <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={isProcessing || !isValid} style={{ width: '100%', padding: '16px', backgroundColor: isProcessing || !isValid ? '#A5D6A7' : '#7CB342', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isProcessing || !isValid ? 'default' : 'pointer' }}>
                {isProcessing && <CircleNotch size={20} weight="bold" color="#FFFFFF" style={{ animation: 'spin 1s linear infinite' }} />}
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>{isProcessing ? 'Menyimpan...' : 'Simpan'}</span>
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BulkOtherActionModal;
