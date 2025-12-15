/**
 * Onboarding / Profile Setup Screen
 *
 * Collects user's name and planting locations
 * before allowing access to main app
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Onboarding = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationOptions = ['Balkon', 'Teras'];

  const toggleLocation = (location) => {
    if (isSubmitting) return;
    console.log('[Onboarding] toggleLocation called:', location, 'current:', locations);
    setLocations((prev) => {
      const newLocations = prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location];
      console.log('[Onboarding] locations updated:', newLocations);
      return newLocations;
    });
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('[Onboarding] Already submitting, ignoring click');
      return;
    }

    console.log('[Onboarding] handleSubmit TRIGGERED, name:', name, 'isValid:', name.trim().length >= 2, 'locations:', locations);

    if (name.trim().length < 2) {
      console.log('[Onboarding] Name too short, returning early');
      return;
    }

    setIsSubmitting(true);
    console.log('[Onboarding] handleSubmit called:', { name, locations });

    // Save to localStorage for now (later: save to Supabase)
    localStorage.setItem('userName', name);
    localStorage.setItem('userLocations', JSON.stringify(locations));

    // Call completion callback
    if (onComplete) {
      console.log('[Onboarding] Calling onComplete with:', { name, locations });
      try {
        await onComplete({ name, locations });
      } catch (err) {
        console.error('[Onboarding] onComplete error:', err);
        setIsSubmitting(false);
      }
    } else {
      console.warn('[Onboarding] onComplete callback is not defined!');
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim().length >= 2 && !isSubmitting;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ flex: 1 }}
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
        <div style={{ marginTop: '48px' }}>
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
                border: `2px solid ${
                  name.trim() ? '#7CB342' : 'transparent'
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
                  color: '#F44336',
                  marginTop: '8px',
                  marginBottom: 0,
                }}
              >
                Nama minimal 2 karakter ya!
              </motion.p>
            )}
          </div>

          {/* Location Selection */}
          <div style={{ marginTop: '32px' }}>
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
              {locationOptions.map((location) => {
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
                      border: `2px solid ${
                        isSelected ? '#7CB342' : '#E0E0E0'
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
                        e.target.style.borderColor = '#BDBDBD';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = '#E0E0E0';
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
      <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
        <motion.button
          type="button"
          onClick={() => {
            console.log('[Onboarding] Button clicked! isValid:', isValid, 'name:', name, 'locations:', locations);
            handleSubmit();
          }}
          disabled={!isValid}
          whileTap={isValid ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '16px',
            border: 'none',
            background: isValid
              ? 'linear-gradient(to right, #7CB342, #689F38)'
              : '#7CB342',
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
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow =
                '0 6px 16px rgba(124, 179, 66, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (isValid) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow =
                '0 4px 12px rgba(124, 179, 66, 0.3)';
            }
          }}
        >
          {isSubmitting ? 'Menyimpan...' : 'Selanjutnya'}
        </motion.button>
      </div>

    </div>
  );
};

export default Onboarding;
