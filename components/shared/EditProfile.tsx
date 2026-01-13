'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UploadSimple, CircleNotch, Trash } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { GlobalOfflineBanner } from '@/components/shared';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('EditProfile');

// Add spin animation style
const spinStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Constants for image compression
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_IMAGE_DIMENSION = 400; // 400x400px max for avatar

interface ProfileData {
  name: string;
  email: string;
  photo: string | null;
}

interface EditProfileProps {
  onBack: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string | null;
  onSave?: (data: ProfileData) => void;
  onProfileUpdated?: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({
  onBack,
  userName,
  userEmail,
  userPhoto,
  onSave,
  onProfileUpdated,
}) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(userPhoto || null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteInputFocused, setDeleteInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and resize image for profile photo
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Calculate new dimensions - make it square and smaller
        const maxDim = MAX_IMAGE_DIMENSION;

        // Crop to square (center crop)
        const minDim = Math.min(width, height);
        const scale = maxDim / minDim;

        // If image is larger than max, scale down
        if (minDim > maxDim) {
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        // Set canvas to target square size
        canvas.width = maxDim;
        canvas.height = maxDim;

        // Calculate crop position (center)
        const cropX = (width - maxDim) / 2;
        const cropY = (height - maxDim) / 2;

        // Draw scaled and cropped image
        ctx.drawImage(
          img,
          cropX < 0 ? 0 : cropX / (width / img.width),
          cropY < 0 ? 0 : cropY / (height / img.height),
          minDim,
          minDim,
          0,
          0,
          maxDim,
          maxDim
        );

        // Convert to blob with quality reduction
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Gagal memproses gambar'));
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Gagal memuat gambar'));
      };

      img.src = objectUrl;
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('File harus berupa gambar');
      return;
    }

    setIsProcessingPhoto(true);
    setPhotoError(null);

    try {
      // Compress image
      const compressedBlob = await compressImage(file);

      // Check if compressed size is still too large
      if (compressedBlob.size > MAX_FILE_SIZE) {
        setPhotoError('Foto terlalu besar. Coba foto dengan resolusi lebih kecil.');
        setIsProcessingPhoto(false);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedBlob);
      setPhotoPreview(previewUrl);
      setPhotoBlob(compressedBlob);
    } catch (err) {
      debug.error('Error processing photo:', err);
      setPhotoError('Gagal memproses foto. Coba lagi.');
    } finally {
      setIsProcessingPhoto(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setPhotoError(null);

    try {
      let photoUrl = userPhoto || null; // Keep existing photo URL by default

      // Upload photo to Supabase Storage if there's a new compressed blob
      if (photoBlob && user) {
        const fileName = `${user.id}/avatar.jpg`;

        // Upload compressed blob to avatars bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, photoBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (uploadError) {
          debug.error('Error uploading avatar:', uploadError);
          setPhotoError('Gagal mengupload foto. Coba lagi.');
          setIsSaving(false);
          return;
        }

        // Get public URL with cache buster
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Add timestamp to bust cache
        photoUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Update profile in Supabase
      const result = await updateProfile({
        displayName: name.trim(),
        photoUrl: photoUrl ?? undefined,
      });

      if (!result.success) {
        debug.error('Failed to update profile:', result.error);
        setPhotoError('Gagal menyimpan profil. Coba lagi.');
        setIsSaving(false);
        return;
      }

      // Save profile data to localStorage as backup
      const profileData: ProfileData = {
        name: name.trim(),
        email: email.trim(),
        photo: photoUrl,
      };

      localStorage.setItem('temanTanamUserName', profileData.name);
      localStorage.setItem('temanTanamUserEmail', profileData.email);
      if (photoUrl) {
        localStorage.setItem('temanTanamUserPhoto', photoUrl);
      }

      // Call onSave callback to update parent state
      if (onSave) {
        onSave(profileData);
      }

      // Callback to show toast
      if (onProfileUpdated) {
        onProfileUpdated();
      }

      // Close after saving
      onBack();
    } catch (err) {
      debug.error('Error saving profile:', err);
      setPhotoError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Validate name matches
    if (deleteConfirmName.trim() !== name.trim()) {
      setDeleteError('Nama tidak sesuai');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (!user?.id) {
        setDeleteError('User not authenticated');
        setIsDeleting(false);
        return;
      }

      // Delete user's avatar from storage
      if (userPhoto) {
        const fileName = `${user.id}/avatar.jpg`;
        await supabase.storage.from('avatars').remove([fileName]);
      }

      // Delete all user data from tables
      // Plants
      await supabase.from('plants').delete().eq('user_id', user.id);

      // Locations
      await supabase.from('locations').delete().eq('user_id', user.id);

      // Notification settings
      await supabase.from('notification_settings').delete().eq('user_id', user.id);

      // Notification logs
      await supabase.from('notification_logs').delete().eq('user_id', user.id);

      // User profile
      await supabase.from('user_profiles').delete().eq('user_id', user.id);

      // Sign out and clear local storage
      await supabase.auth.signOut();
      localStorage.clear();

      // Redirect to home
      window.location.href = '/';
    } catch (err) {
      debug.error('Error deleting account:', err);
      setDeleteError('Terjadi kesalahan. Coba lagi.');
      setIsDeleting(false);
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <div
      className="ios-fixed-container"
      style={{
        height: '100vh',
        // @ts-expect-error - 100dvh is valid CSS but not in TypeScript types
        height: '100dvh', // Dynamic viewport height - adjusts when keyboard appears
        backgroundColor: '#FFFFFF',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Global Offline Banner */}
      <GlobalOfflineBanner />
      {/* Spin animation styles */}
      <style>{spinStyle}</style>

      {/* Header */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F5F5F5',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Back Button */}
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              left: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
          </button>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
            }}
          >
            Edit Profil
          </h1>

          {/* Delete Account Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              position: 'absolute',
              right: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Trash size={20} weight="bold" color="#DC2626" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
        }}
      >
        {/* Photo Upload Section */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#757575',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Foto profile kamu
          </label>

          <div
            style={{
              border: photoError ? '2px dashed #DC2626' : '2px dashed #E0E0E0',
              borderRadius: '12px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FAFAFA',
              minHeight: '160px',
            }}
          >
            {isProcessingPhoto ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <CircleNotch
                  size={32}
                  weight="bold"
                  color="#7CB342"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
                  }}
                >
                  Memproses foto...
                </span>
              </div>
            ) : photoPreview ? (
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                }}
              >
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={isProcessingPhoto}
              style={{ display: 'none' }}
            />

            {!isProcessingPhoto && (
              <button
                onClick={handleUploadClick}
                disabled={isProcessingPhoto}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#757575',
                }}
              >
                <UploadSimple size={20} weight="bold" />
                {photoPreview ? 'Ganti Foto' : 'Upload Foto'}
              </button>
            )}
          </div>

          {/* Photo Error Message */}
          {photoError && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#DC2626',
                margin: '8px 0 0 0',
                textAlign: 'center',
              }}
            >
              {photoError}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#757575',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Email Kamu
          </label>
          <input
            type="email"
            placeholder="emailkamu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            disabled
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              color: '#999999',
              backgroundColor: '#F5F5F5',
              border: '2px solid transparent',
              borderRadius: '12px',
              outline: 'none',
              cursor: 'not-allowed',
            }}
          />
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: '#999999',
              margin: '8px 0 0 0',
            }}
          >
            Email tidak bisa diubah
          </p>
        </div>

        {/* Name Field */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#757575',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Nama Kamu
          </label>
          <input
            type="text"
            placeholder="Beri nama biar kece"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              color: '#2C2C2C',
              backgroundColor: '#FAFAFA',
              border: focusedInput === 'name' ? '2px solid #7CB342' : '2px solid transparent',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 200ms',
            }}
          />
        </div>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div
        style={{
          padding: '24px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F5F5F5',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: '#FFFFFF',
            backgroundColor: isValid && !isSaving ? '#7CB342' : '#E0E0E0',
            border: 'none',
            borderRadius: '12px',
            cursor: isValid && !isSaving ? 'pointer' : 'not-allowed',
          }}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4000,
              }}
            />

            {/* Modal Container */}
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 48px)',
                maxWidth: '400px',
                zIndex: 4001,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                  }}
                >
                  <Trash size={32} weight="fill" color="#DC2626" />
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#2D5016',
                    textAlign: 'center',
                    margin: '0 0 12px 0',
                  }}
                >
                  Hapus Akun?
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9375rem',
                    color: '#757575',
                    textAlign: 'center',
                    margin: '0 0 24px 0',
                    lineHeight: 1.6,
                  }}
                >
                  Semua data kamu akan dihapus permanen dan tidak bisa dikembalikan. Ketik nama kamu untuk konfirmasi.
                </p>

                {/* Name Confirmation Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.875rem',
                      color: '#757575',
                      marginBottom: '8px',
                    }}
                  >
                    Nama Kamu: <strong>{name}</strong>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => {
                      setDeleteConfirmName(e.target.value);
                      setDeleteError(null);
                    }}
                    onFocus={() => setDeleteInputFocused(true)}
                    onBlur={() => setDeleteInputFocused(false)}
                    placeholder="Ketik nama kamu"
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '0.9375rem',
                      fontFamily: "'Inter', sans-serif",
                      color: '#2C2C2C',
                      backgroundColor: '#FAFAFA',
                      border: deleteError
                        ? '2px solid #DC2626'
                        : deleteInputFocused
                          ? '2px solid #7CB342'
                          : '2px solid transparent',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'border-color 200ms',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  />
                  {deleteError && (
                    <p
                      style={{
                        margin: '8px 0 0 0',
                        fontSize: '0.75rem',
                        color: '#DC2626',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {deleteError}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isDeleting ? '#E0E0E0' : '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun Saya'}
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmName('');
                      setDeleteError(null);
                      setDeleteInputFocused(false);
                    }}
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'transparent',
                      border: 'none',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9375rem',
                      color: '#757575',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;
