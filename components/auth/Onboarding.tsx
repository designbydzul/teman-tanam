'use client';

/**
 * Onboarding / Profile Setup Screen
 *
 * Collects user's name and planting locations
 * before allowing access to main app
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useLocations } from '@/hooks/useLocations';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('Onboarding');

interface OnboardingData {
  name: string;
  locations: string[];
}

interface OnboardingProps {
  onComplete?: (data: OnboardingData) => Promise<void> | void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add location modal state
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Get locations from Supabase via useLocations hook
  const { locations: supabaseLocations, addLocation, refetch: refetchLocations } = useLocations();
  // Extract location names (exclude "Semua" option, filter out any undefined)
  // Extract location names (exclude "Semua" option, filter out any undefined)
  const predefinedLocations = ['Balkon', 'Teras'];
  const customLocations = supabaseLocations
    .map((loc: { name: string }) => loc.name)
    .filter((name: string) => name && name !== 'Semua' && !predefinedLocations.includes(name));

  const locationOptions = [...predefinedLocations, ...customLocations];

  const toggleLocation = (location: string) => {
    if (location === 'Tambah Lokasi') {
      // Open add location modal
      setShowAddLocationModal(true);
      return;
    }

    if (isSubmitting) return;
    debug.log('toggleLocation called:', { location, current: locations });
    setLocations((prev) => {
      const newLocations = prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location];
      return newLocations;
    });
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

  // Check for duplicate location name
  const checkDuplicateLocation = (name: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return supabaseLocations.some((loc: { name: string }) => loc.name.toLowerCase() === trimmedName);
  };

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
      setLocations((prev) => [...prev, newLocationName.trim()]);
    } else {
      setLocationError(result.error || 'Gagal menambahkan lokasi');
    }

    setIsAddingLocation(false);
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      debug.log('Already submitting, ignoring click');
      return;
    }

    debug.log('handleSubmit TRIGGERED', { name, isValid: name.trim().length >= 2, locations });

    if (name.trim().length < 2) {
      debug.log('Name too short, returning early');
      return;
    }

    setIsSubmitting(true);

    // Save to localStorage for now (later: save to Supabase)
    localStorage.setItem('userName', name);
    localStorage.setItem('userLocations', JSON.stringify(locations));

    // Call completion callback
    if (onComplete) {
      debug.log('Calling onComplete with:', { name, locations });
      try {
        await onComplete({ name, locations });
      } catch (err) {
        debug.error('onComplete error:', err);
        setIsSubmitting(false);
      }
    } else {
      debug.warn('onComplete callback is not defined!');
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim().length >= 2 && !isSubmitting;

  return (
    <div
      style={{
        height: '100vh',
        // @ts-expect-error - 100dvh is valid but TypeScript doesn't recognize it
        height: '100dvh', // Dynamic viewport height - accounts for mobile browser UI
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable content area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px 24px 24px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '2.5rem',
            fontWeight: 600,
            color: '#2D5016', // Green Forest
            textAlign: 'center',
            margin: 0,
          }}
        >
          Halo Teman,
        </h1>
        <h2
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '1.75rem',
            fontWeight: 500,
            color: '#2D5016',
            textAlign: 'center',
            marginTop: '8px',
            lineHeight: 1.4,
          }}
        >
          isi ini dulu yuk sebelum lanjut
        </h2>

        {/* Form */}
        <div style={{ marginTop: '32px' }}>
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                color: '#757575', // Gray 600
                marginBottom: '8px',
              }}
            >
              Nama Kamu
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beri nama biar kece"
              autoFocus
              style={{
                width: '100%',
                backgroundColor: '#FAFAFA',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                border: `2px solid ${name.trim() ? '#7CB342' : 'transparent'
                  }`,
                outline: 'none',
                transition: 'border-color 200ms',
                color: '#2C2C2C',
              }}
            />
            {/* Error validation under input */}
            {name.trim().length > 0 && name.trim().length < 2 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: '#DC2626',
                  marginTop: '8px',
                  marginBottom: 0,
                }}
              >
                Nama minimal 2 karakter ya!
              </motion.p>
            )}
          </div>

          {/* Location Selection */}
          <div style={{ marginTop: '24px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                color: '#757575',
                marginBottom: '16px',
              }}
            >
              Kamu bakal nanam dimana aja?
            </label>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {[...locationOptions, 'Tambah Lokasi'].map((location) => {
                const isSelected = locations.includes(location);
                return (
                  <motion.button
                    key={location}
                    onClick={() => toggleLocation(location)}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    style={{
                      padding: '12px 32px',
                      borderRadius: '9999px', // Pill shape
                      border: `2px solid ${isSelected ? '#7CB342' : '#E0E0E0'
                        }`,
                      backgroundColor: isSelected
                        ? 'rgba(124, 179, 66, 0.1)'
                        : '#FFFFFF',
                      color: isSelected ? '#7CB342' : '#757575',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: isSelected ? 500 : 400,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.target as HTMLButtonElement).style.borderColor = '#BDBDBD';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.target as HTMLButtonElement).style.borderColor = '#E0E0E0';
                      }
                    }}
                  >
                    {location}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Submit Button - Fixed at bottom */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 24px 24px 24px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F0F0F0',
        }}
      >
        <motion.button
          type="button"
          onClick={() => {
            debug.log('Button clicked!', { isValid, name, locations });
            handleSubmit();
          }}
          disabled={!isValid}
          whileTap={isValid ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: isValid ? '#7CB342' : '#E0E0E0',
            color: '#FFFFFF',
            fontSize: '1.125rem',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: isValid ? 'pointer' : 'not-allowed',
            opacity: isValid ? 1 : 0.5,
            transition: 'opacity 200ms, transform 200ms',
            boxShadow: isValid
              ? '0 4px 12px rgba(124, 179, 66, 0.3)'
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (isValid) {
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.target as HTMLButtonElement).style.boxShadow =
                '0 6px 16px rgba(124, 179, 66, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (isValid) {
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.target as HTMLButtonElement).style.boxShadow =
                '0 4px 12px rgba(124, 179, 66, 0.3)';
            }
          }}
        >
          {isSubmitting ? 'Menyimpan...' : 'Selanjutnya'}
        </motion.button>
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddLocationModal && (
          <>
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isAddingLocation && setShowAddLocationModal(false)}
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
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newLocationName.trim().length >= 2) {
                      handleAddLocation();
                    }
                  }}
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
                      : isInputFocused
                        ? '2px solid #7CB342'
                        : '2px solid transparent',
                    borderRadius: '12px',
                    outline: 'none',
                    marginBottom: locationError ? '8px' : '16px',
                    boxSizing: 'border-box',
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isAddingLocation ? (
                    <>
                      <style>{`
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ animation: 'spin 1s linear infinite' }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="31.4 31.4"
                        />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Onboarding;
