'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MagnifyingGlass, X } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { SPECIES_EMOJI_MAP } from '@/lib/constants';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('AddPlant');

// Species data for the add plant flow (simplified from full PlantSpecies)
export interface AddPlantSpecies {
  id: string;
  name: string;
  scientific: string;
  category: string;
  imageUrl: string | null;
  emoji: string;
}

interface AddPlantProps {
  onClose: () => void;
  onSelectSpecies: (species: AddPlantSpecies) => void;
}

// Category options matching database values
const CATEGORIES = [
  { id: 'semua', label: 'Semua' },
  { id: 'Sayuran', label: 'Sayuran' },
  { id: 'Rempah', label: 'Rempah' },
  { id: 'Bunga', label: 'Bunga' },
  { id: 'Tanaman Hias', label: 'Tanaman Hias' },
];

const AddPlant: React.FC<AddPlantProps> = ({ onClose, onSelectSpecies }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesList, setSpeciesList] = useState<AddPlantSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          debug.error('Error fetching species:', error);
          return;
        }

        // Transform to component format
        const transformed: AddPlantSpecies[] = (data || []).map(s => ({
          id: s.id,
          name: s.common_name,
          scientific: s.latin_name,
          category: s.category,
          imageUrl: s.image_url,
          emoji: SPECIES_EMOJI_MAP[s.common_name.toLowerCase()] || '🌱',
        }));

        debug.log('Fetched species:', transformed.length);
        setSpeciesList(transformed);
      } catch (err) {
        debug.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Filter plants by category and search query
  const filteredPlants = speciesList.filter((plant) => {
    // Category filter
    const categoryMatch = selectedCategory === 'semua' || plant.category === selectedCategory;

    // Search filter
    const query = searchQuery.toLowerCase();
    const searchMatch = !searchQuery ||
      plant.name.toLowerCase().includes(query) ||
      plant.scientific.toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  const handleSearchToggle = () => {
    if (isSearchExpanded) {
      setSearchQuery('');
      setIsSearchExpanded(false);
    } else {
      setIsSearchExpanded(true);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  };

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
      {/* Sticky Header - Same styling as Tanya Tanam */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Navigation Row with bottom border */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            position: 'relative',
            borderBottom: '1px solid #E0E0E0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Back Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label="Kembali"
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
            <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
          </motion.button>

          {/* Title - Centered */}
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            Tambah Teman Baru
          </h1>

          {/* Search Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSearchToggle}
            aria-label="Cari tanaman"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isSearchExpanded ? '#F0F7E6' : '#FFFFFF',
              border: isSearchExpanded ? '1px solid #7CB342' : '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <MagnifyingGlass size={20} weight="regular" color={isSearchExpanded ? '#7CB342' : '#2C2C2C'} />
          </motion.button>
        </div>

        {/* Category Tabs - Below header line */}
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '8px',
            padding: '16px 24px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CATEGORIES.map((category) => (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                flexShrink: 0,
                padding: '10px 20px',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                color: selectedCategory === category.id ? '#FFFFFF' : '#757575',
                backgroundColor: selectedCategory === category.id ? '#7CB342' : 'transparent',
                border: selectedCategory === category.id ? 'none' : '1px solid #E0E0E0',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {category.label}
            </motion.button>
          ))}
        </div>

        {/* Expandable Search Bar - Below Category Tabs */}
        <AnimatePresence>
          {isSearchExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 24px 16px 24px' }}>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FAFAFA',
                    border: '2px solid #7CB342',
                    borderRadius: '12px',
                    padding: '0 8px 0 16px',
                  }}
                >
                  {/* Search Icon */}
                  <MagnifyingGlass size={20} weight="regular" color="#757575" style={{ flexShrink: 0 }} />

                  {/* Input */}
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Cari tanaman..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '14px 8px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      color: '#2C2C2C',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                  />

                  {/* Clear Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearchClear}
                    style={{
                      flexShrink: 0,
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
                    <X size={16} weight="bold" color="#757575" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Plant Grid */}
      <div
        style={{
          position: 'absolute',
          top: isSearchExpanded ? '220px' : '160px',
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          padding: '16px 24px 100px 24px',
          transition: 'top 0.2s ease',
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
              minHeight: 'calc(100vh - 400px)',
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
                fontSize: '1rem',
                fontWeight: 500,
                color: '#757575',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {searchQuery ? (
                <>
                  Tidak ada hasil untuk
                  <br />
                  &quot;{searchQuery}&quot;
                </>
              ) : (
                <>
                  Tidak ada tanaman dalam
                  <br />
                  kategori ini
                </>
              )}
            </p>
          </motion.div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default AddPlant;
