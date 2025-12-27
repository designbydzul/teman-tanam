import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationSettings from './LocationSettings';
import { useLocations } from '@/hooks/useLocations';
import { Drop, Leaf, ArrowCounterClockwise, X, Trash } from '@phosphor-icons/react';

const EditPlant = ({ plant, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    customName: '',
    location: '',
    customLocation: '',
    startedDate: '',
    customDate: '',
    notes: '',
    photo: null,
    customWateringDays: '',
    customFertilizingDays: '',
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dateInputRef = useRef(null);

  // Get locations from Supabase via useLocations hook
  const { locations: supabaseLocations, refetch: refetchLocations } = useLocations();
  // Extract location names (exclude "Semua" option, filter out any undefined)
  const locationOptions = supabaseLocations
    .map(loc => loc.name)
    .filter(name => name && name !== 'Semua');

  // Format date for display
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  };

  // Initialize form with plant data
  useEffect(() => {
    if (plant) {
      // Safely parse started date with validation
      let startedDateStr = '';
      if (plant.startedDate) {
        try {
          const date = new Date(plant.startedDate);
          if (!isNaN(date.getTime())) {
            startedDateStr = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('[EditPlant] Invalid started date:', plant.startedDate);
        }
      }

      // Get plant location
      const plantLocation = plant.location || '';

      // Format the date for display if exists
      const formattedDate = startedDateStr ? formatDateForDisplay(startedDateStr) : 'Hari ini';

      setFormData({
        customName: plant.customName || plant.name || '',
        location: plantLocation,
        customLocation: '',
        startedDate: formattedDate,
        customDate: startedDateStr,
        notes: plant.notes || '',
        photo: null,
        customWateringDays: plant.customWateringDays != null ? String(plant.customWateringDays) : '',
        customFertilizingDays: plant.customFertilizingDays != null ? String(plant.customFertilizingDays) : '',
      });

      setPhotoPreview(plant.photoUrl || plant.photoPreview || plant.image || null);
    }
  }, [plant]);

  const isValid = formData.location;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      setFormData({ ...formData, startedDate: date, customDate: '' });
    }
  };

  const handleCustomDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      // Format the date for display (e.g., "11 Des 2025")
      const formattedDate = formatDateForDisplay(selectedDate);
      setFormData({ ...formData, startedDate: formattedDate, customDate: selectedDate });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      const finalLocation = formData.location;

      // Parse custom frequencies (empty string = null = use default)
      const customWateringDays = formData.customWateringDays.trim()
        ? parseInt(formData.customWateringDays, 10)
        : null;
      const customFertilizingDays = formData.customFertilizingDays.trim()
        ? parseInt(formData.customFertilizingDays, 10)
        : null;

      onSave({
        ...plant,
        customName: formData.customName.trim() || plant.customName || plant.name,
        name: formData.customName.trim() || plant.customName || plant.name,
        location: finalLocation,
        startedDate: formData.customDate || (formData.startedDate === 'Hari ini' ? new Date() : plant.startedDate),
        notes: formData.notes,
        photoUrl: photoPreview,
        photoPreview: photoPreview,
        customWateringDays,
        customFertilizingDays,
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="edit-plant-form-backdrop"
        className="ios-fixed-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 3000,
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
            maxHeight: '95vh',
            maxHeight: '95dvh', // Dynamic viewport height - adjusts when keyboard appears
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
                Edit Tanaman
              </h2>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '24px', paddingBottom: '100px' }}>

            {/* Form */}
            <form onSubmit={handleSubmit} id="edit-plant-form">
              {/* Name Input */}
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
                  Nama Tanaman
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
                    color: '#757575',
                    marginBottom: '12px',
                  }}
                >
                  Lokasi
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

              {/* Started Date - Native Date Input */}
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
                  Mulai Dirawat
                </label>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={formData.customDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={handleCustomDateChange}
                  onFocus={() => setFocusedInput('date')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '16px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: focusedInput === 'date' ? '2px solid #7CB342' : '2px solid transparent',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 200ms',
                    WebkitAppearance: 'none',
                    appearance: 'none',
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

              {/* Frekuensi Perawatan Section */}
              <div style={{ marginBottom: '24px' }}>
                {/* Section Title - consistent with other labels */}
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#757575',
                    marginBottom: '8px',
                  }}
                >
                  Frekuensi Perawatan
                </label>

                {/* Watering Frequency Row - Gray background like other form fields */}
                <div
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Left side: Icon + Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Drop size={20} weight="regular" color="#757575" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#2C2C2C',
                      }}
                    >
                      Siram setiap
                    </span>
                  </div>
                  {/* Right side: Value display + Reset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      placeholder={String(plant?.species?.wateringFrequencyDays || 3)}
                      value={formData.customWateringDays}
                      onChange={(e) => setFormData({ ...formData, customWateringDays: e.target.value })}
                      style={{
                        width: '32px',
                        padding: '0',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#2C2C2C',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'right',
                        MozAppearance: 'textfield',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#757575',
                      }}
                    >
                      hari
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customWateringDays: '' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        marginLeft: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowCounterClockwise size={20} weight="regular" color="#757575" />
                    </button>
                  </div>
                </div>

                {/* Fertilizing Frequency Row - Gray background like other form fields */}
                <div
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Left side: Icon + Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Leaf size={20} weight="regular" color="#757575" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#2C2C2C',
                      }}
                    >
                      Pupuk setiap
                    </span>
                  </div>
                  {/* Right side: Value display + Reset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      placeholder={String(plant?.species?.fertilizingFrequencyDays || 14)}
                      value={formData.customFertilizingDays}
                      onChange={(e) => setFormData({ ...formData, customFertilizingDays: e.target.value })}
                      style={{
                        width: '32px',
                        padding: '0',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#2C2C2C',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'right',
                        MozAppearance: 'textfield',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#757575',
                      }}
                    >
                      hari
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customFertilizingDays: '' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        marginLeft: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowCounterClockwise size={20} weight="regular" color="#757575" />
                    </button>
                  </div>
                </div>
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
                  Foto Tanaman
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
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData({ ...formData, photo: null });
                      }}
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
                        cursor: 'pointer',
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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke="#7CB342"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
              </div>

              {/* Delete Plant Button */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    marginTop: '32px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    color: '#DC2626',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Trash size={20} weight="regular" color="#DC2626" />
                  Hapus Tanaman
                </button>
              )}
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
              form="edit-plant-form"
              disabled={!isValid}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: isValid ? '#7CB342' : '#E0E0E0',
                border: 'none',
                borderRadius: '12px',
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              Simpan Perubahan
            </button>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              key="delete-confirm-backdrop"
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Modal */}
              <motion.div
                key="delete-confirm-modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '24px',
                  margin: '24px',
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
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                      stroke="#DC2626"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#2C2C2C',
                    margin: '0 0 8px 0',
                  }}
                >
                  Hapus Tanaman?
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
                    margin: '0 0 24px 0',
                    lineHeight: 1.5,
                  }}
                >
                  Tanaman "{formData.customName || plant?.customName || 'ini'}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      color: '#757575',
                      backgroundColor: '#F5F5F5',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDelete(plant);
                    }}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      color: '#FFFFFF',
                      backgroundColor: '#DC2626',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default EditPlant;
