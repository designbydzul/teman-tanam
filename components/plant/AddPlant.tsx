'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MagnifyingGlass, X } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { GlobalOfflineBanner } from '@/components/shared';
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

const SPECIES_CACHE_KEY = 'teman-tanam-species-cache';

const AddPlant: React.FC<AddPlantProps> = ({ onClose, onSelectSpecies }) => {
  const { isOnline } = useOnlineStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesList, setSpeciesList] = useState<AddPlantSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isContentReady, setIsContentReady] = useState(false);

  // Plant request feature
  const { user } = useAuth();
  const [requestedPlants, setRequestedPlants] = useState<Set<string>>(new Set());
  const [isRequesting, setIsRequesting] = useState(false);
  const [showToastState, setShowToastState] = useState(false);
  const [toastContent, setToastContent] = useState<{ title: string; message: string }>({ title: '', message: '' });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load species from cache
  const loadFromCache = (): AddPlantSpecies[] | null => {
    try {
      const cached = localStorage.getItem(SPECIES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        debug.log('Loaded species from cache:', parsed.length);
        return parsed;
      }
    } catch (err) {
      debug.error('Error loading cache:', err);
    }
    return null;
  };

  // Save species to cache
  const saveToCache = (species: AddPlantSpecies[]) => {
    try {
      localStorage.setItem(SPECIES_CACHE_KEY, JSON.stringify(species));
      debug.log('Saved species to cache:', species.length);
    } catch (err) {
      debug.error('Error saving cache:', err);
    }
  };

  // Fetch species from Supabase on mount
  useEffect(() => {
    const fetchSpecies = async () => {
      setLoading(true);
      setIsOffline(false);

      // Check if offline first - load from cache immediately
      if (!navigator.onLine) {
        debug.log('Offline - loading species from cache');
        const cached = loadFromCache();
        if (cached && cached.length > 0) {
          setSpeciesList(cached);
          debug.log(`Loaded ${cached.length} species from cache`);
        }
        setIsOffline(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('plant_species')
          .select('id, common_name, latin_name, category, image_url')
          .order('common_name', { ascending: true });

        if (error) {
          throw error;
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
        saveToCache(transformed);
      } catch (err) {
        // Only log as error if not a network issue
        if (navigator.onLine) {
          debug.error('Error fetching species:', err);
        } else {
          debug.log('Network error while offline');
        }

        // Try to load from cache when offline/error
        const cached = loadFromCache();
        if (cached && cached.length > 0) {
          setSpeciesList(cached);
          setIsOffline(true);
          debug.log('Using cached species (offline mode)');
        } else {
          setIsOffline(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  // Mark content as ready once data is loaded (for smooth animation)
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => setIsContentReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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

  // Toast helper
  const showToast = (title: string, message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastContent({ title, message });
    setShowToastState(true);
    toastTimerRef.current = setTimeout(() => setShowToastState(false), 3000);
  };

  // Request plant handler
  const handleRequestPlant = async () => {
    if (!user?.id || !searchQuery.trim()) return;

    const normalizedName = searchQuery.trim().toLowerCase();

    if (requestedPlants.has(normalizedName)) {
      showToast('Sudah direquest', 'Kamu udah request ini sebelumnya');
      return;
    }

    setIsRequesting(true);

    try {
      const { error } = await supabase
        .from('plant_requests')
        .insert({
          user_id: user.id,
          plant_name: normalizedName,
        });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation = already requested
          setRequestedPlants(prev => new Set([...prev, normalizedName]));
          showToast('Sudah direquest', 'Kamu udah request ini sebelumnya');
        } else {
          throw error;
        }
      } else {
        setRequestedPlants(prev => new Set([...prev, normalizedName]));
        showToast('Request diterima', 'Makasih! Kami catet ya');
      }
    } catch (err) {
      debug.error('Error requesting plant:', err);
      showToast('Gagal', 'Gagal mengirim request. Coba lagi ya.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Use instant animations when offline for snappier feel
  // Also skip animation if content is already ready (from cache)
  const instantTransition = !isOnline;

  return (
    <motion.div
      className="ios-fixed-container"
      initial={instantTransition ? false : { opacity: 0 }}
      animate={isContentReady || instantTransition ? { opacity: 1 } : { opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: instantTransition ? 0 : 0.15 }}
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 1000,
      }}
    >
      {/* Global Offline Banner */}
      <GlobalOfflineBanner />

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
          // Add 42px for offline banner height when offline
          top: isSearchExpanded
            ? (isOnline ? '220px' : '262px')
            : (isOnline ? '160px' : '202px'),
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
              initial={instantTransition ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={instantTransition ? { duration: 0 } : undefined}
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
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {plant.imageUrl && !failedImages.has(plant.id) ? (
                  <>
                    {/* Placeholder emoji while loading */}
                    {!loadedImages.has(plant.id) && (
                      <span style={{ position: 'absolute', opacity: 0.5 }}>
                        {plant.emoji}
                      </span>
                    )}
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: loadedImages.has(plant.id) ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                      }}
                      onLoad={() => {
                        setLoadedImages(prev => new Set([...prev, plant.id]));
                      }}
                      onError={() => {
                        setFailedImages(prev => new Set([...prev, plant.id]));
                      }}
                    />
                  </>
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
            initial={instantTransition ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={instantTransition ? { duration: 0 } : undefined}
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
              {isOffline && speciesList.length === 0 ? (
                <>
                  Kamu perlu online dulu
                  <br />
                  untuk memuat daftar tanaman
                </>
              ) : searchQuery ? (
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

            {/* Request Plant Button - only show when online or has cached species */}
            {searchQuery && user && !(isOffline && speciesList.length === 0) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRequestPlant}
                disabled={isRequesting || requestedPlants.has(searchQuery.toLowerCase())}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  border: '1.5px solid #7CB342',
                  borderRadius: '24px',
                  backgroundColor: requestedPlants.has(searchQuery.toLowerCase()) ? '#F0F7E6' : 'transparent',
                  color: '#7CB342',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: requestedPlants.has(searchQuery.toLowerCase()) ? 'default' : 'pointer',
                  opacity: isRequesting ? 0.6 : 1,
                }}
              >
                {requestedPlants.has(searchQuery.toLowerCase())
                  ? 'Sudah direquest ✓'
                  : 'Request tanaman ini'}
              </motion.button>
            )}

            {/* Login prompt for unauthenticated users - only show when online or has cached species */}
            {searchQuery && !user && !(isOffline && speciesList.length === 0) && (
              <p
                style={{
                  marginTop: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: '#999999',
                }}
              >
                Login untuk request tanaman baru
              </p>
            )}
          </motion.div>
        )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToastState && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              right: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              zIndex: 10001,
            }}
          >
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 4px 0',
                }}
              >
                {toastContent.title}
              </h4>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#757575',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {toastContent.message}
              </p>
            </div>
            <button
              onClick={() => setShowToastState(false)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={20} weight="bold" color="#757575" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddPlant;
