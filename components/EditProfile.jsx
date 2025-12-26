import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, UploadSimple, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

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

const EditProfile = ({ onBack, userName, userEmail, userPhoto, onSave, onProfileUpdated }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [photoPreview, setPhotoPreview] = useState(userPhoto || null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  // Compress and resize image for profile photo
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

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

  const handlePhotoChange = async (e) => {
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
      console.error('Error processing photo:', err);
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
      let photoUrl = userPhoto; // Keep existing photo URL by default

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
          console.error('Error uploading avatar:', uploadError);
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
        photoUrl: photoUrl,
      });

      if (!result.success) {
        console.error('Failed to update profile:', result.error);
        setPhotoError('Gagal menyimpan profil. Coba lagi.');
        setIsSaving(false);
        return;
      }

      // Save profile data to localStorage as backup
      const profileData = {
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
      console.error('Error saving profile:', err);
      setPhotoError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <div
      className="ios-fixed-container"
      style={{
        height: '100vh',
        height: '100dvh', // Dynamic viewport height - adjusts when keyboard appears
        backgroundColor: '#FFFFFF',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Spin animation styles */}
      <style>{spinStyle}</style>

      {/* Header */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
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
    </div>
  );
};

export default EditProfile;
