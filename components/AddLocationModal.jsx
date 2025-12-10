import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

const AddLocationModal = ({ isOpen, onClose, plants, onSave }) => {
  const [locationName, setLocationName] = useState('');
  const [selectedPlantIds, setSelectedPlantIds] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);

  // Get plants that don't have a specific location (location is 'Semua' or empty)
  const uncategorizedPlants = plants.filter(
    (plant) => !plant.location || plant.location === 'Semua'
  );

  const handlePlantToggle = (plantId) => {
    setSelectedPlantIds((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId]
    );
  };

  const handleSave = () => {
    if (locationName.trim().length < 2) return;

    // Save the new location
    onSave({
      name: locationName.trim(),
      selectedPlantIds,
    });

    // Reset form
    setLocationName('');
    setSelectedPlantIds([]);
    onClose();
  };

  const isValid = locationName.trim().length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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
              zIndex: 2000,
            }}
          />

          {/* Modal Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px 12px 0 0',
              height: '95vh',
              zIndex: 2001,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px 24px 16px',
                borderBottom: '1px solid #F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-caveat), Caveat, cursive',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#2D5016',
                  margin: 0,
                }}
              >
                Tambah Lokasi
              </h2>

              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={24} weight="bold" color="#2C2C2C" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              {/* Location Name Input */}
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
                  Dimana lagi?
                </label>
                <input
                  type="text"
                  placeholder="Masukan nama lokasi"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: inputFocused || locationName.length >= 2 ? '2px solid #7CB342' : '2px solid transparent',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 200ms',
                  }}
                />
              </div>

              {/* Plant Selection */}
              {uncategorizedPlants.length > 0 && (
                <div>
                  <label
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#666666',
                      display: 'block',
                      marginBottom: '16px',
                    }}
                  >
                    Pilih tanaman yang mau dimasukan
                  </label>

                  {/* Plant Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                    }}
                  >
                    {uncategorizedPlants.map((plant) => {
                      const isSelected = selectedPlantIds.includes(plant.id);
                      return (
                        <div
                          key={plant.id}
                          onClick={() => handlePlantToggle(plant.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          {/* Plant Image with Selection Ring */}
                          <div
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              marginBottom: '8px',
                              border: isSelected ? '3px solid #7CB342' : '3px solid transparent',
                              transition: 'border-color 0.2s ease',
                            }}
                          >
                            <img
                              src={plant.image}
                              alt={plant.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </div>

                          {/* Plant Name */}
                          <p
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '14px',
                              fontWeight: isSelected ? 600 : 500,
                              color: isSelected ? '#2D5016' : '#2C2C2C',
                              margin: '0 0 2px 0',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                          >
                            {plant.name}
                          </p>

                          {/* Plant Status */}
                          <p
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '12px',
                              fontWeight: 400,
                              color: '#666666',
                              margin: 0,
                              textAlign: 'center',
                            }}
                          >
                            {plant.status}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Save Button - Fixed at bottom */}
            <div
              style={{
                padding: '16px 24px 24px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #F5F5F5',
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleSave}
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
        </>
      )}
    </AnimatePresence>
  );
};

export default AddLocationModal;
