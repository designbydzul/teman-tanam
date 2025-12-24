import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from '@phosphor-icons/react';
import LocationSettings from './LocationSettings';
import { compressImage } from '@/lib/imageUtils';
import { useLocations } from '@/hooks/useLocations';

const AddPlantForm = ({ species, onClose, onSubmit, existingPlantCount = 0 }) => {
  const [formData, setFormData] = useState({
    customName: '',
    location: '',
    customLocation: '',
    plantedDate: 'Hari ini',
    customDate: '',
    notes: '',
    photo: null,
    compressedPhoto: null, // Compressed blob for upload
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressionWarning, setCompressionWarning] = useState(null);
  const dateInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get locations from Supabase via useLocations hook
  const { locations: supabaseLocations, refetch: refetchLocations } = useLocations();
  // Extract location names (exclude "Semua" option, filter out any undefined)
  const locationOptions = supabaseLocations
    .map(loc => loc.name)
    .filter(name => name && name !== 'Semua');

  // Name is optional now, location is required
  const isValid = formData.location;

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsCompressing(true);
      setCompressionWarning(null);
      setFormData({ ...formData, photo: file, compressedPhoto: null });

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        // Compress image in the background (max 1MB)
        console.log(`[AddPlantForm] Original file size: ${(file.size / 1024).toFixed(1)}KB`);
        const compressedBlob = await compressImage(file, 1024, 1200, 1200);
        console.log(`[AddPlantForm] Compressed to: ${(compressedBlob.size / 1024).toFixed(1)}KB`);

        setFormData(prev => ({ ...prev, compressedPhoto: compressedBlob }));
      } catch (error) {
        console.error('[AddPlantForm] Compression error:', error);
        // Fall back to original file if compression fails
        setFormData(prev => ({ ...prev, compressedPhoto: file }));

        // Warn user if original file is large (over 5MB may fail to upload)
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 5) {
          setCompressionWarning(`Foto terlalu besar (${fileSizeMB.toFixed(1)}MB). Mungkin gagal upload, coba pilih foto lain.`);
        } else {
          setCompressionWarning('Kompresi gagal, menggunakan foto asli.');
        }
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleLocationSelect = (location) => {
    if (location === 'Tambah Tempat') {
      // Open LocationSettings page instead of inline input
      setShowLocationSettings(true);
    } else {
      setShowLocationInput(false);
      setFormData({ ...formData, location, customLocation: '' });
    }
  };

  // Handle back from LocationSettings - refetch locations and return to form
  const handleLocationSettingsBack = () => {
    setShowLocationSettings(false);
    refetchLocations(); // Refetch locations from Supabase to get newly added ones
  };

  const handleDateSelect = (date) => {
    if (date === 'Pilih Tanggal') {
      // Trigger native date picker
      dateInputRef.current?.showPicker?.();
      dateInputRef.current?.click();
    } else {
      setFormData({ ...formData, plantedDate: date, customDate: '' });
    }
  };

  const handleCustomDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      // Format the date for display (e.g., "11 Des 2025")
      const dateObj = new Date(selectedDate);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      setFormData({ ...formData, plantedDate: formattedDate, customDate: selectedDate });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValid && !isSubmitting && !isCompressing) {
      setIsSubmitting(true);

      // Auto-generate name if empty
      const finalName = formData.customName.trim() || `${species.name} ${existingPlantCount + 1}`;
      const finalLocation = formData.location;

      try {
        await onSubmit({
          ...formData,
          customName: finalName,
          location: finalLocation,
          species,
          id: Date.now().toString(),
          createdAt: new Date(),
          // Use compressed photo if available, otherwise original
          photoBlob: formData.compressedPhoto || formData.photo,
        });
      } catch (error) {
        console.error('[AddPlantForm] Submit error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="add-plant-form-backdrop"
        className="ios-fixed-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '95vh',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflowX: 'hidden',
          }}
        >
          {/* Sticky Header with Close Button */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              padding: '24px 24px 16px 24px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F5F5F5',
              borderRadius: '12px 12px 0 0',
              zIndex: 10,
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Tutup"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
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

            {/* Header */}
            <div>
              <h2
                className="font-accent"
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#2D5016',
                  margin: 0,
                }}
              >
                {species.name}
              </h2>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  margin: '4px 0 0 0',
                }}
              >
                {species.scientific}
              </p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '24px', paddingBottom: '100px' }}>

            {/* Form */}
            <form onSubmit={handleSubmit} id="add-plant-form">
              {/* Name Input (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '8px',
                  }}
                >
                  Siapa namanya?
                </label>
                <input
                  type="text"
                  placeholder="Beri nama biar kece"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
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

              {/* Location Pills */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '12px',
                  }}
                >
                  Ditanam dimana?
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[...locationOptions, 'Tambah Tempat'].map((location, index) => (
                    <button
                      key={`location-${index}-${location}`}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: formData.location === location ? '#2D5016' : '#666666',
                        backgroundColor: formData.location === location ? '#F1F8E9' : 'transparent',
                        border: formData.location === location ? '2px solid #7CB342' : '2px solid #E0E0E0',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>

              {/* Planted Date Pills */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '12px',
                  }}
                >
                  Ditanam kapan?
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Hari ini button */}
                  <button
                    type="button"
                    onClick={() => handleDateSelect('Hari ini')}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      color: formData.plantedDate === 'Hari ini' ? '#2D5016' : '#666666',
                      backgroundColor: formData.plantedDate === 'Hari ini' ? '#F1F8E9' : 'transparent',
                      border: formData.plantedDate === 'Hari ini' ? '2px solid #7CB342' : '2px solid #E0E0E0',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Hari ini
                  </button>

                  {/* Pilih Tanggal / Selected Date button */}
                  <button
                    type="button"
                    onClick={() => handleDateSelect('Pilih Tanggal')}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      color: formData.customDate ? '#2D5016' : '#666666',
                      backgroundColor: formData.customDate ? '#F1F8E9' : 'transparent',
                      border: formData.customDate ? '2px solid #7CB342' : '2px solid #E0E0E0',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {formData.customDate ? formData.plantedDate : 'Pilih Tanggal'}
                  </button>
                </div>

                {/* Hidden Date Input */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={formData.customDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={handleCustomDateChange}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: 0,
                    height: 0,
                  }}
                />
              </div>

              {/* Notes (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '8px',
                  }}
                >
                  Catatan (Optional)
                </label>
                <textarea
                  placeholder="Tulis apa aja: lokasi, asal benih, dll"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  onFocus={() => setFocusedInput('notes')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    minHeight: '96px',
                    padding: '16px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: focusedInput === 'notes' ? '2px solid #7CB342' : '2px solid transparent',
                    borderRadius: '12px',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 200ms',
                  }}
                />
              </div>

              {/* Photo Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '12px',
                  }}
                >
                  Kasih gambar biar kalcer
                </label>

                {photoPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                      }}
                    />
                    {/* Compression overlay */}
                    {isCompressing && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                        </svg>
                        <span style={{ color: '#FFFFFF', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
                          Mengompres...
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setCompressionWarning(null);
                        setFormData({ ...formData, photo: null, compressedPhoto: null });
                      }}
                      disabled={isCompressing}
                      aria-label="Hapus foto"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: 'none',
                        cursor: isCompressing ? 'not-allowed' : 'pointer',
                        opacity: isCompressing ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M15 5L5 15M5 5l10 10"
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      border: '2px dashed #E0E0E0',
                      borderRadius: '12px',
                      backgroundColor: '#FAFAFA',
                      cursor: 'pointer',
                    }}
                  >
                    <Camera size={48} weight="regular" color="#7CB342" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#7CB342',
                        marginTop: '12px',
                      }}
                    >
                      Upload Foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {/* Compression warning */}
                {compressionWarning && (
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      color: '#DC2626',
                      textAlign: 'center',
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '8px',
                    }}
                  >
                    {compressionWarning}
                  </p>
                )}

                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#999999',
                    textAlign: 'center',
                    marginTop: '12px',
                  }}
                >
                  atau skip dulu, nanti bisa ditambah nanti
                </p>
              </div>
            </form>
          </div>

          {/* Sticky Submit Button */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 24px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #F5F5F5',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <button
              type="submit"
              form="add-plant-form"
              disabled={!isValid || isSubmitting || isCompressing}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: (isValid && !isSubmitting && !isCompressing) ? '#7CB342' : '#CCCCCC',
                border: 'none',
                borderRadius: '12px',
                cursor: (isValid && !isSubmitting && !isCompressing) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  Menyimpan...
                </>
              ) : isCompressing ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  Mengompres foto...
                </>
              ) : (
                'Simpan'
              )}
            </button>
            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </motion.div>
      </motion.div>

      {/* LocationSettings Modal */}
      {showLocationSettings && (
        <LocationSettings
          key="location-settings-modal"
          onBack={handleLocationSettingsBack}
          onLocationAdded={(locationName) => {
            // Location added, will be loaded when going back
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default AddPlantForm;
