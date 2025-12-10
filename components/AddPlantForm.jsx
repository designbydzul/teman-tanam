import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AddPlantForm = ({ species, onClose, onSubmit, existingPlantCount = 0 }) => {
  const [formData, setFormData] = useState({
    customName: '',
    location: '',
    customLocation: '',
    plantedDate: 'Hari ini',
    customDate: '',
    notes: '',
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Name is optional now, location is required
  const isValid = formData.location || formData.customLocation;

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
    if (location === 'Lainnya') {
      setShowLocationInput(true);
      setFormData({ ...formData, location: '', customLocation: '' });
    } else {
      setShowLocationInput(false);
      setFormData({ ...formData, location, customLocation: '' });
    }
  };

  const handleDateSelect = (date) => {
    if (date === 'Lainnya') {
      setShowDatePicker(true);
      setFormData({ ...formData, plantedDate: '', customDate: '' });
    } else {
      setShowDatePicker(false);
      setFormData({ ...formData, plantedDate: date, customDate: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      // Auto-generate name if empty
      const finalName = formData.customName.trim() || `${species.name} ${existingPlantCount + 1}`;
      const finalLocation = formData.customLocation || formData.location;

      onSubmit({
        ...formData,
        customName: finalName,
        location: finalLocation,
        species,
        id: Date.now().toString(),
        createdAt: new Date(),
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
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
            height: '85vh',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px' }}>

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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: formData.customName.length >= 2 ? '2px solid #7CB342' : 'none',
                    borderRadius: '12px',
                    outline: 'none',
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
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: showLocationInput ? '12px' : 0 }}>
                  {['Balkon', 'Teras', 'Lainnya'].map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: formData.location === location || (location === 'Lainnya' && showLocationInput) ? '#2D5016' : '#666666',
                        backgroundColor: formData.location === location || (location === 'Lainnya' && showLocationInput) ? '#F1F8E9' : 'transparent',
                        border: formData.location === location || (location === 'Lainnya' && showLocationInput) ? '2px solid #7CB342' : '2px solid #E0E0E0',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {location}
                    </button>
                  ))}
                </div>

                {/* Custom Location Input */}
                <AnimatePresence>
                  {showLocationInput && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      type="text"
                      placeholder="Nama Tempat"
                      value={formData.customLocation}
                      onChange={(e) => setFormData({ ...formData, customLocation: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        color: '#2C2C2C',
                        backgroundColor: '#FAFAFA',
                        border: formData.customLocation.length >= 2 ? '2px solid #7CB342' : 'none',
                        borderRadius: '12px',
                        outline: 'none',
                      }}
                    />
                  )}
                </AnimatePresence>
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
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: showDatePicker ? '12px' : 0 }}>
                  {['Hari ini', 'Kemarin', 'Lainnya'].map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: formData.plantedDate === date || (date === 'Lainnya' && showDatePicker) ? '#2D5016' : '#666666',
                        backgroundColor: formData.plantedDate === date || (date === 'Lainnya' && showDatePicker) ? '#F1F8E9' : 'transparent',
                        border: formData.plantedDate === date || (date === 'Lainnya' && showDatePicker) ? '2px solid #7CB342' : '2px solid #E0E0E0',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {date}
                    </button>
                  ))}
                </div>

                {/* Date Picker */}
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      type="date"
                      value={formData.customDate}
                      onChange={(e) => setFormData({ ...formData, customDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        color: '#2C2C2C',
                        backgroundColor: '#FAFAFA',
                        border: formData.customDate ? '2px solid #7CB342' : 'none',
                        borderRadius: '12px',
                        outline: 'none',
                      }}
                    />
                  )}
                </AnimatePresence>
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
                  style={{
                    width: '100%',
                    minHeight: '96px',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: 'none',
                    borderRadius: '12px',
                    outline: 'none',
                    resize: 'vertical',
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
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData({ ...formData, photo: null });
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
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
              disabled={!isValid}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: isValid ? '#7CB342' : '#CCCCCC',
                border: 'none',
                borderRadius: '12px',
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              Simpan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddPlantForm;
