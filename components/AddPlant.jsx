import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { SPECIES_EMOJI_MAP } from '@/lib/constants';

const AddPlant = ({ onClose, onSelectSpecies }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState(new Set());

  // Fetch species from Supabase on mount
  useEffect(() => {
    const fetchSpecies = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('plant_species')
          .select('id, common_name, latin_name, category, image_url')
          .order('common_name', { ascending: true });

        if (error) {
          console.error('[AddPlant] Error fetching species:', error);
          return;
        }

        // Transform to component format
        const transformed = (data || []).map(s => ({
          id: s.id, // Real UUID from Supabase
          name: s.common_name,
          scientific: s.latin_name,
          category: s.category,
          imageUrl: s.image_url,
          emoji: SPECIES_EMOJI_MAP[s.common_name.toLowerCase()] || '🌱',
        }));

        console.log('[AddPlant] Fetched species:', transformed.length);
        setSpeciesList(transformed);
      } catch (err) {
        console.error('[AddPlant] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredPlants = speciesList.filter((plant) => {
    const query = searchQuery.toLowerCase();
    return (
      plant.name.toLowerCase().includes(query) ||
      plant.scientific.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      className="ios-fixed-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 1000,
      }}
    >
      {/* Sticky Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
        }}
      >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #F5F5F5',
        }}
      >
        {/* Back Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          style={{
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
          <ArrowLeft size={20} weight="regular" color="#2D5016" />
        </motion.button>

        {/* Title */}
        <h1
          className="font-accent"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#2D5016',
            margin: 0,
          }}
        >
          Tambah Teman Baru
        </h1>

        <div style={{ width: '40px' }} /> {/* Spacer for centering */}
      </div>

      {/* Sticky Search Bar */}
      <div style={{ padding: '16px 24px' }}>
        <div
          style={{
            position: 'relative',
          }}
        >
          <input
            type="text"
            placeholder="Cari tanaman"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%',
              padding: '16px 50px 16px 20px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              color: '#2C2C2C',
              backgroundColor: '#FAFAFA',
              border: searchFocused || searchQuery ? '2px solid #7CB342' : '2px solid transparent',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 200ms',
            }}
          />
          {/* Icon container - same position for both states, inside the input */}
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {searchQuery ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchQuery('')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#E0E0E0',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.button>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="8" stroke="#757575" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Scrollable Plant Grid */}
      <div
        style={{
          position: 'absolute',
          top: '175px',
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          padding: '0 24px 100px 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px 16px',
          }}
        >
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#757575', fontFamily: "'Inter', sans-serif" }}>Memuat daftar tanaman...</p>
          </div>
        ) : filteredPlants.length > 0 ? (
          filteredPlants.map((plant) => (
            <motion.div
              key={plant.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectSpecies(plant)}
              style={{
                cursor: 'pointer',
                minWidth: 0,
                width: '100%',
              }}
            >
              {/* Plant Image/Emoji */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '24px',
                  backgroundColor: '#F1F8E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  marginBottom: '8px',
                  padding: plant.imageUrl && !failedImages.has(plant.id) ? '12px' : 0,
                }}
              >
                {plant.imageUrl && !failedImages.has(plant.id) ? (
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onError={() => {
                      setFailedImages(prev => new Set([...prev, plant.id]));
                    }}
                  />
                ) : (
                  plant.emoji
                )}
              </div>

              {/* Plant Name */}
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 4px 0',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {plant.name}
              </h3>

              {/* Scientific Name */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#757575',
                  margin: 0,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {plant.scientific}
              </p>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 350px)',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {/* Illustration */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="26" cy="26" r="14" stroke="#999999" strokeWidth="4" />
                <path d="M36 36L48 48" stroke="#999999" strokeWidth="4" strokeLinecap="round" />
                <path d="M20 26H32" stroke="#999999" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            {/* Description */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.125rem',
                fontWeight: 500,
                color: '#757575',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Tidak ada hasil untuk
              <br />
              "{searchQuery}"
            </p>
          </motion.div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default AddPlant;
