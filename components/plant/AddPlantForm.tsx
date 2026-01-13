'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, DiceFive } from '@phosphor-icons/react';
import { LocationSettings } from '@/components/modals';
import { GlobalOfflineBanner } from '@/components/shared';
import { compressImage } from '@/lib/imageUtils';
import { useLocations } from '@/hooks/useLocations';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { generatePlantName } from '@/lib/plantNameGenerator';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('AddPlantForm');

interface PlantSpecies {
  id: string;
  name: string;
  scientific: string;
  category?: string;
  imageUrl?: string | null;
  emoji?: string;
}

interface FormData {
  customName: string;
  location: string;
  customLocation: string;
  startedDate: string;
  customDate: string;
  notes: string;
  photo: File | null;
  compressedPhoto: Blob | File | null;
}

interface SubmitData extends FormData {
  species: PlantSpecies;
  id: string;
  createdAt: Date;
  photoBlob: Blob | File | null;
}

interface AddPlantFormProps {
  species: PlantSpecies;
  onClose: () => void;
  onSubmit: (data: SubmitData) => Promise<void>;
  existingPlantCount?: number;
}

const AddPlantForm: React.FC<AddPlantFormProps> = ({ species, onClose, onSubmit, existingPlantCount = 0 }) => {
  const { isOnline } = useOnlineStatus();
  const [formData, setFormData] = useState<FormData>({
    customName: '',
    location: '',
    customLocation: '',
    startedDate: 'Hari ini',
    customDate: '',
    notes: '',
    photo: null,
    compressedPhoto: null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressionWarning, setCompressionWarning] = useState<string | null>(null);
  const [dateError, setDateError] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Get locations from Supabase via useLocations hook
  const { locations: supabaseLocations, refetch: refetchLocations, addLocation } = useLocations();
  // Extract location names (exclude "Semua" option, filter out any undefined)
  const locationOptions = supabaseLocations
    .map((loc: { name: string }) => loc.name)
    .filter((name: string) => name && name !== 'Semua');

  // Name is optional now, location is required
  const isValid = formData.location;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      setCompressionWarning(null);
      setFormData({ ...formData, photo: file, compressedPhoto: null });

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // Compress image in the background (max 200KB for storage optimization)
        debug.log(`Original file size: ${(file.size / 1024).toFixed(1)}KB`);
        const compressedBlob = await compressImage(file, 200, 1200, 1200);
        debug.log(`Compressed to: ${(compressedBlob.size / 1024).toFixed(1)}KB`);

        setFormData(prev => ({ ...prev, compressedPhoto: compressedBlob }));
      } catch (error) {
        debug.error('Compression error:', error);
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

  const handleLocationSelect = (location: string) => {
    if (location === 'Tambah Tempat') {
      // Open simple add location modal
      setShowAddLocationModal(true);
    } else {
      setShowLocationInput(false);
      setFormData({ ...formData, location, customLocation: '' });
    }
  };

  // Check for duplicate location name
  const checkDuplicateLocation = (name: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return supabaseLocations.some((loc: { name: string }) => loc.name.toLowerCase() === trimmedName);
  };

  // Auto-focus location input when modal opens
  useEffect(() => {
    if (showAddLocationModal && locationInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        locationInputRef.current?.focus();
      }, 100);
    }
  }, [showAddLocationModal]);

  // Handle adding new location
  const handleAddLocation = async () => {
    if (newLocationName.trim().length < 2) {
      setLocationError('Nama lokasi minimal 2 karakter');
      return;
    }

    if (checkDuplicateLocation(newLocationName)) {
      setLocationError('Nama lokasi sudah ada');
      return;
    }

    setIsAddingLocation(true);
    const result = await addLocation(newLocationName.trim(), '📍');

    if (result.success) {
      // Refetch locations to get the new one
      await refetchLocations();
      // Close modal and reset state
      setShowAddLocationModal(false);
      setNewLocationName('');
      setLocationError('');
      // Auto-select the newly added location
      setFormData({ ...formData, location: newLocationName.trim() });
    } else {
      setLocationError(result.error || 'Gagal menambahkan lokasi');
    }

    setIsAddingLocation(false);
  };

  // Handle back from LocationSettings - refetch locations and return to form
  const handleLocationSettingsBack = () => {
    setShowLocationSettings(false);
    refetchLocations();
  };

  const handleDateSelect = (date: string) => {
    // Only used for "Hari ini" button now
    setFormData({ ...formData, startedDate: date, customDate: '' });
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      // Validate: no future dates allowed
      const today = new Date().toISOString().split('T')[0];
      if (selectedDate > today) {
        setDateError('Tanggal tidak boleh di masa depan');
        // Reset to today
        const todayObj = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const formattedToday = `${todayObj.getDate()} ${months[todayObj.getMonth()]} ${todayObj.getFullYear()}`;
        setFormData({ ...formData, startedDate: formattedToday, customDate: today });
        // Clear error after 3 seconds
        setTimeout(() => setDateError(''), 3000);
        return;
      }

      setDateError('');
      // Format the date for display (e.g., "11 Des 2025")
      const dateObj = new Date(selectedDate);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      setFormData({ ...formData, startedDate: formattedDate, customDate: selectedDate });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        debug.error('Submit error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Use instant animations when offline for snappier feel
  const instantTransition = !isOnline;

  return (
    <AnimatePresence>
      <motion.div
        key="add-plant-form-backdrop"
        className="ios-fixed-container"
        initial={instantTransition ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: instantTransition ? 0 : 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <motion.div
          initial={instantTransition ? false : { y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={instantTransition ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxHeight: '95vh',
            // @ts-expect-error - 95dvh is valid CSS
            maxHeight: '95dvh',
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
              <X size={20} weight="regular" color="#757575" />
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
                  color: '#757575',
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
                    color: '#757575',
                    marginBottom: '8px',
                  }}
                >
                  Siapa namanya?
                </label>
                <div style={{ position: 'relative' }}>
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
                      paddingRight: '56px',
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
                  <button
                    type="button"
                    onClick={() => {
                      if (species?.name) {
                        const newName = generatePlantName(species.name, existingPlantCount);
                        setFormData({ ...formData, customName: newName });
                      }
                    }}
                    title="Generate random nickname"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '8px',
                      backgroundColor: '#F1F8E9',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 200ms',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DCEDC8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F1F8E9'}
                  >
                    <DiceFive size={20} weight="regular" color="#7CB342" />
                  </button>
                </div>
              </div>

              {/* Location Pills */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
                    marginBottom: '12px',
                  }}
                >
                  Dirawat dimana?
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
                        color: formData.location === location ? '#2D5016' : '#757575',
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

              {/* Started Date Pills */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
                    marginBottom: '12px',
                  }}
                >
                  Mulai dirawat kapan?
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
                      color: formData.startedDate === 'Hari ini' ? '#2D5016' : '#757575',
                      backgroundColor: formData.startedDate === 'Hari ini' ? '#F1F8E9' : 'transparent',
                      border: formData.startedDate === 'Hari ini' ? '2px solid #7CB342' : '2px solid #E0E0E0',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Hari ini
                  </button>

                  {/* Pilih Tanggal / Selected Date - use label wrapping input for iOS compatibility */}
                  <label
                    style={{
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      color: formData.customDate ? '#2D5016' : '#757575',
                      backgroundColor: formData.customDate ? '#F1F8E9' : 'transparent',
                      border: formData.customDate ? '2px solid #7CB342' : '2px solid #E0E0E0',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-block',
                      position: 'relative',
                    }}
                  >
                    {formData.customDate ? formData.startedDate : 'Pilih Tanggal'}
                    {/* Native date input - visible but transparent, overlays the label */}
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={formData.customDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={handleCustomDateChange}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                      }}
                    />
                  </label>
                </div>

                {/* Date error message */}
                {dateError && (
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#DC2626',
                      margin: '8px 0 0 0',
                    }}
                  >
                    {dateError}
                  </p>
                )}
              </div>

              {/* Notes (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
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
                    color: '#757575',
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
                backgroundColor: (isValid && !isSubmitting && !isCompressing) ? '#7CB342' : '#E0E0E0',
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
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </motion.div>
      </motion.div>

      {/* Add Location Modal */}
      {showAddLocationModal && (
        <>
          <motion.div
            className="ios-fixed-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isAddingLocation && setShowAddLocationModal(false)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 5000,
            }}
          />

          {/* Modal Container - for centering */}
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
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px 12px 0 0',
                padding: '24px',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isAddingLocation && setShowAddLocationModal(false)}
                disabled={isAddingLocation}
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
                  cursor: isAddingLocation ? 'not-allowed' : 'pointer',
                  opacity: isAddingLocation ? 0.5 : 1,
                }}
              >
                <X size={20} weight="regular" color="#757575" />
              </button>

              {/* Modal Title */}
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 16px 0',
                }}
              >
                Tambah Lokasi Baru
              </h2>

              {/* Input */}
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Nama lokasi (min. 2 karakter)"
                value={newLocationName}
                onChange={(e) => {
                  setNewLocationName(e.target.value);
                  if (locationError) setLocationError('');
                }}
                onFocus={() => setFocusedInput('newLocation')}
                onBlur={() => setFocusedInput(null)}
                disabled={isAddingLocation}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: locationError
                    ? '2px solid #EF4444'
                    : focusedInput === 'newLocation'
                      ? '2px solid #7CB342'
                      : '2px solid transparent',
                  borderRadius: '12px',
                  outline: 'none',
                  marginBottom: locationError ? '8px' : '16px',
                  transition: 'border-color 200ms',
                  opacity: isAddingLocation ? 0.5 : 1,
                }}
              />
              {locationError && (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#EF4444',
                    margin: '0 0 16px 0',
                  }}
                >
                  {locationError}
                </p>
              )}

              {/* Submit Button */}
              <button
                onClick={handleAddLocation}
                disabled={newLocationName.trim().length < 2 || isAddingLocation}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: newLocationName.trim().length >= 2 && !isAddingLocation ? '#7CB342' : '#E0E0E0',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: newLocationName.trim().length >= 2 && !isAddingLocation ? 'pointer' : 'not-allowed',
                }}
              >
                {isAddingLocation ? 'Menyimpan...' : 'Simpan'}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddPlantForm;
