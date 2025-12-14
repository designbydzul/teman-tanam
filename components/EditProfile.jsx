import React, { useState, useRef } from 'react';
import { ArrowLeft, UploadSimple } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const EditProfile = ({ onBack, userName, userEmail, userPhoto, onSave, onProfileUpdated }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [photoPreview, setPhotoPreview] = useState(userPhoto || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let photoUrl = photoPreview;

      // Upload photo to Supabase Storage if there's a new file
      if (photoFile && user) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        // Upload to avatars bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, photoFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          // Continue with base64 photo if upload fails
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      // Update profile in Supabase
      const result = await updateProfile({
        displayName: name.trim(),
        photoUrl: photoUrl,
      });

      if (!result.success) {
        console.error('Failed to update profile:', result.error);
        // Still update localStorage as fallback
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
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
            <ArrowLeft size={16} weight="bold" color="#2D5016" />
          </button>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-caveat), Caveat, cursive',
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
              color: '#666666',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Foto profile kamu
          </label>

          <div
            style={{
              border: '2px dashed #E0E0E0',
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
            {photoPreview ? (
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '24px',
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
              style={{ display: 'none' }}
            />

            <button
              onClick={handleUploadClick}
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
                color: '#666666',
              }}
            >
              <UploadSimple size={20} weight="bold" />
              {photoPreview ? 'Ganti Foto' : 'Upload Foto'}
            </button>
          </div>
        </div>

        {/* Email Field */}
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
              color: '#666666',
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
            backgroundColor: isValid && !isSaving ? '#7CB342' : '#CCCCCC',
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
