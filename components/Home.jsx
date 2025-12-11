import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drop,
  Leaf,
  FirstAidKit,
  PencilSimple,
  Trash,
  Plant,
} from '@phosphor-icons/react';
import AddPlant from './AddPlant';
import AddPlantForm from './AddPlantForm';
import AddPlantSuccess from './AddPlantSuccess';
import PlantDetail from './PlantDetail';
import ProfileModal from './ProfileModal';
import LocationSettings from './LocationSettings';
import EditProfile from './EditProfile';
import AddLocationModal from './AddLocationModal';
import EditPlant from './EditPlant';
import DiagnosaHama from './DiagnosaHama';
import { useLocalStorage, STORAGE_KEYS } from '../hooks/useLocalStorage';

// Extracted styles to prevent new object creation on every render
const styles = {
  // Main container
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFAFA',
  },
  // Header section
  header: {
    padding: '20px 24px',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    zIndex: 10,
  },
  headerTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  greeting: {
    fontFamily: 'var(--font-caveat), Caveat, cursive',
    fontSize: '2rem',
    fontWeight: 600,
    color: '#2D5016',
    margin: 0,
    flex: 1,
    minWidth: 0,
  },
  iconButtonContainer: {
    display: 'flex',
    gap: '12px',
  },
  // Search input
  searchContainer: {
    position: 'relative',
    marginBottom: '20px',
  },
  // Location filter
  locationFilterContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationFilterScroll: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flex: 1,
    overflowX: 'auto',
  },
  // Plant grid
  plantGridContainer: {
    position: 'absolute',
    top: '250px',
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#FFFFFF',
  },
  plantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px 16px',
    padding: '16px 24px',
    paddingBottom: '100px',
  },
  // Plant card
  plantCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTouchCallout: 'none',
  },
  plantImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  plantImageContainer: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '24px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  plantName: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '150%',
    color: '#2C2C2C',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  plantStatus: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '150%',
    color: '#666666',
    margin: 0,
    textAlign: 'center',
  },
  // Floating action buttons
  fabContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  // Toast styles
  toast: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    right: '24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    zIndex: 4000,
  },
};

// Mock plant data
const MOCK_PLANTS = [
  { id: 1, name: 'Labuh', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1605027990121-cbae9d3c0a39?w=300' },
  { id: 2, name: 'Kentang', status: 'Siap dipanen', location: 'Semua', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 3, name: 'Labuh 01', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1605027990121-cbae9d3c0a39?w=300' },
  { id: 4, name: 'Kentang Ubi', status: 'Perlu disiram', location: 'Teras', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 5, name: 'Kentang Sakit', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 6, name: 'Kentang Hama', status: 'Baik Baik Saja', location: 'Semua', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 7, name: 'Bawang Merah', status: 'Perlu disiram', location: 'Teras', image: 'https://images.unsplash.com/photo-1587411768078-af8b0b9c8f78?w=300' },
  { id: 8, name: 'Bayam', status: 'Baik Baik Saja', location: 'Teras', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
  { id: 9, name: 'Kembang Kol', status: 'Baik Baik Saja', location: 'Balkon', image: 'https://images.unsplash.com/photo-1568584711271-e57ccf2f3679?w=300' },
  { id: 10, name: 'Bayam Awal', status: 'Baik Baik Saja', location: 'Semua', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
  { id: 11, name: 'Bayam Jokowi', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
  { id: 12, name: 'Bayam Akhir', status: 'Baik Baik Saja', location: 'Semua', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
];

const Home = ({ userName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Semua');
  const [plants, setPlants] = useState(MOCK_PLANTS);

  // Add Plant flow state
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddPlantForm, setShowAddPlantForm] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newPlantData, setNewPlantData] = useState(null);

  // Plant Detail state
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showPlantDetail, setShowPlantDetail] = useState(false);

  // Profile Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Location Settings state
  const [showLocationSettings, setShowLocationSettings] = useState(false);

  // Edit Profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  // Use centralized localStorage hook for user profile - eliminates redundant JSON.parse
  const [storedProfile, setStoredProfile] = useLocalStorage('temanTanamUserProfile', {
    name: userName || 'Dzul',
    email: 'designbydzul@gmail.com',
    photo: null,
  });
  // Derive individual values from stored profile for compatibility
  const currentUserName = storedProfile.name;
  const userEmail = storedProfile.email;
  const userPhoto = storedProfile.photo;

  // Add Location Modal state
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  // Long press menu state
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [menuPlant, setMenuPlant] = useState(null);
  const longPressTimer = useRef(null);

  // Edit plant from menu
  const [showEditPlantModal, setShowEditPlantModal] = useState(false);

  // Diagnosa Hama from menu
  const [showDiagnosaHamaModal, setShowDiagnosaHamaModal] = useState(false);

  // Network status state
  const [networkStatus, setNetworkStatus] = useState('online'); // 'online' | 'offline' | 'reconnecting'
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const reconnectingTimer = useRef(null);

  // Action toast state (for watering, fertilizing, plant actions, etc.)
  const [showActionToast, setShowActionToast] = useState(false);
  const [actionToastMessage, setActionToastMessage] = useState('');
  const actionToastTimer = useRef(null);

  // Helper function to show action toast - memoized with proper cleanup
  const showActionToastWithMessage = useCallback((message) => {
    // Clear any existing timeout to prevent memory leaks
    if (actionToastTimer.current) {
      clearTimeout(actionToastTimer.current);
    }
    setActionToastMessage(message);
    setShowActionToast(true);
    actionToastTimer.current = setTimeout(() => setShowActionToast(false), 3000);
  }, []);

  // Cleanup action toast timer on unmount
  useEffect(() => {
    return () => {
      if (actionToastTimer.current) {
        clearTimeout(actionToastTimer.current);
      }
    };
  }, []);

  // Use centralized localStorage hook for locations - auto-syncs across components
  const DEFAULT_LOCATIONS = [
    { id: '1', name: 'Teras', plantCount: 0 },
    { id: '2', name: 'Balkon', plantCount: 0 },
  ];
  const [storedLocations, setStoredLocations] = useLocalStorage('temanTanamLocations', DEFAULT_LOCATIONS);

  // Derive location names array from stored locations
  const locations = useMemo(() => {
    const names = storedLocations.map((loc) => loc.name);
    return ['Semua', ...names];
  }, [storedLocations]);

  // Network status detection
  useEffect(() => {
    const showToast = (title, message) => {
      setToastMessage({ title, message });
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 3000);
    };

    const handleOnline = () => {
      // Clear any reconnecting timer
      if (reconnectingTimer.current) {
        clearTimeout(reconnectingTimer.current);
        reconnectingTimer.current = null;
      }
      setNetworkStatus('online');
      showToast('Kembali online', 'Yeay! Koneksi kamu udah balik~');
    };

    const handleOffline = () => {
      // First show reconnecting state
      setNetworkStatus('reconnecting');
      showToast('Reconnecting......', 'Tunggu sebentar, data kamu lagi sync');

      // After 5 seconds, if still offline, show offline state
      reconnectingTimer.current = setTimeout(() => {
        if (!navigator.onLine) {
          setNetworkStatus('offline');
          showToast('Koneksi hilang', 'Gak papa! Kamu tetep bisa care tanaman seperti biasa~');
        }
      }, 5000);
    };

    // Initial check
    if (!navigator.onLine) {
      setNetworkStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectingTimer.current) {
        clearTimeout(reconnectingTimer.current);
      }
    };
  }, []);

  // Close LocationSettings - locations auto-sync via useLocalStorage hook
  const handleLocationSettingsClose = useCallback(() => {
    setShowLocationSettings(false);
    // Reset to 'Semua' if current selection was deleted
    if (!locations.includes(selectedLocation)) {
      setSelectedLocation('Semua');
    }
  }, [locations, selectedLocation]);

  // Filter plants based on search and location - memoized to prevent recalculation on every render
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
  }, [plants, searchQuery, selectedLocation]);

  const hasFilteredPlants = selectedLocation !== 'Semua';
  const showEmptyState = filteredPlants.length === 0;

  const handleBulkWater = useCallback(() => {
    console.log('Bulk watering plants in:', selectedLocation);
    // TODO: Implement bulk watering logic
  }, [selectedLocation]);

  // Add Plant flow handlers - memoized to prevent child re-renders
  const handleAddPlantClick = useCallback(() => {
    setShowAddPlant(true);
  }, []);

  const handleSelectSpecies = useCallback((species) => {
    setSelectedSpecies(species);
    setShowAddPlantForm(true);
    // Keep showAddPlant true so it stays visible behind the form modal
  }, []);

  const handleFormSubmit = (plantData) => {
    // Add photo preview to plant data
    const dataWithPhoto = {
      ...plantData,
      photoPreview: plantData.photo ? URL.createObjectURL(plantData.photo) : null,
    };

    setNewPlantData(dataWithPhoto);
    setShowAddPlantForm(false);
    setShowSuccess(true);

    // Add to plants list
    const newPlant = {
      id: Date.now(),
      name: plantData.customName,
      status: 'Baru ditambahkan',
      location: plantData.location,
      image: dataWithPhoto.photoPreview || 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=300',
    };
    setPlants([newPlant, ...plants]);

    // Add custom location to locations list if it doesn't exist
    if (plantData.location && !locations.includes(plantData.location) && plantData.location !== 'Semua') {
      // This would be handled in a real app by updating global state or localStorage
      console.log('New location added:', plantData.location);
    }
  };

  const handleViewDetails = useCallback(() => {
    // Find the newly created plant and show its details
    if (newPlantData) {
      // Create a plant object that matches what PlantDetail expects
      const plantForDetail = {
        id: newPlantData.id,
        name: newPlantData.customName,
        customName: newPlantData.customName,
        species: newPlantData.species,
        location: newPlantData.location,
        plantedDate: newPlantData.plantedDate,
        image: newPlantData.photoPreview || null,
        photoUrl: newPlantData.photoPreview || null,
        status: 'Baik Baik Saja',
      };
      setSelectedPlant(plantForDetail);
      setShowPlantDetail(true);
    }
    setShowSuccess(false);
    setShowAddPlant(false);
    setSelectedSpecies(null);
    setNewPlantData(null);
  }, [newPlantData]);

  const handleAddNew = useCallback(() => {
    setShowSuccess(false);
    setShowAddPlant(true);
    setSelectedSpecies(null);
    setNewPlantData(null);
  }, []);

  const handleBackHome = useCallback(() => {
    setShowSuccess(false);
    setShowAddPlant(false);
    setSelectedSpecies(null);
    setNewPlantData(null);
  }, []);

  // Long press handlers for plant cards - memoized to prevent child re-renders
  const handleLongPressStart = useCallback((plant, e) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      setMenuPlant(plant);
      setShowPlantMenu(true);
    }, 500); // 500ms for long press
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePlantMenuAction = useCallback((action) => {
    setShowPlantMenu(false);
    switch (action) {
      case 'detail':
        if (menuPlant) {
          setSelectedPlant(menuPlant);
          setShowPlantDetail(true);
        }
        break;
      case 'water':
        if (menuPlant) {
          showActionToastWithMessage(`Penyiraman ${menuPlant.name} sudah dicatat`);
        }
        break;
      case 'fertilize':
        if (menuPlant) {
          showActionToastWithMessage(`Pemupukan ${menuPlant.name} sudah dicatat`);
        }
        break;
      case 'diagnose':
        if (menuPlant) {
          setShowDiagnosaHamaModal(true);
        }
        break;
      case 'edit':
        if (menuPlant) {
          setShowEditPlantModal(true);
        }
        break;
      case 'delete':
        if (menuPlant && window.confirm('Apakah Anda yakin ingin menghapus tanaman ini?')) {
          const plantName = menuPlant.name;
          setPlants((prevPlants) => prevPlants.filter((p) => p.id !== menuPlant.id));
          setMenuPlant(null);
          showActionToastWithMessage(`${plantName} sudah dihapus`);
        }
        break;
      default:
        break;
    }
  }, [menuPlant, showActionToastWithMessage]);

  // Plant Detail handlers - memoized to prevent unnecessary re-renders
  const handlePlantClick = useCallback((plant) => {
    // Only navigate if not in long press
    if (!longPressTimer.current) {
      setSelectedPlant(plant);
      setShowPlantDetail(true);
    }
  }, []);

  const handlePlantDetailBack = useCallback(() => {
    setShowPlantDetail(false);
    setSelectedPlant(null);
  }, []);

  const handlePlantEdit = useCallback((plant) => {
    console.log('Edit plant:', plant);
    // TODO: Implement plant editing
  }, []);

  const handlePlantDelete = useCallback((plantId) => {
    setPlants((prevPlants) => {
      const plantToDelete = prevPlants.find((p) => p.id === plantId);
      const plantName = plantToDelete?.name || plantToDelete?.customName || 'Tanaman';
      // Show toast after state update
      setTimeout(() => showActionToastWithMessage(`${plantName} sudah dihapus`), 0);
      return prevPlants.filter((p) => p.id !== plantId);
    });
    setShowPlantDetail(false);
    setSelectedPlant(null);
  }, [showActionToastWithMessage]);

  // Handle navigation from ProfileModal - memoized
  const handleProfileNavigation = useCallback((action) => {
    if (action === 'location-settings') {
      setShowLocationSettings(true);
    } else if (action === 'edit-profile') {
      setShowEditProfile(true);
    }
    // TODO: Add other navigation actions (help-community, tutorial, logout)
  }, []);

  // Handle profile save - uses centralized localStorage hook
  const handleProfileSave = useCallback((profileData) => {
    setStoredProfile((prev) => ({
      ...prev,
      name: profileData.name,
      email: profileData.email,
      // Update photo if provided, otherwise keep existing
      photo: profileData.photo || prev.photo,
    }));
  }, [setStoredProfile]);

  // Handle add location save - uses centralized localStorage hook
  const handleAddLocationSave = useCallback(({ name, selectedPlantIds }) => {
    // Add new location using the hook (auto-syncs to localStorage)
    const newLocation = {
      id: Date.now().toString(),
      name,
      plantCount: selectedPlantIds.length,
    };
    setStoredLocations((prev) => [...prev, newLocation]);

    // Update selected plants' locations
    if (selectedPlantIds.length > 0) {
      setPlants((prevPlants) =>
        prevPlants.map((plant) =>
          selectedPlantIds.includes(plant.id)
            ? { ...plant, location: name }
            : plant
        )
      );
    }

    // Show toast
    showActionToastWithMessage(`Lokasi ${name} sudah ditambahkan`);
  }, [setStoredLocations, showActionToastWithMessage]);

  return (
    <div style={styles.container}>
      {/* Header - Sticky */}
      <div style={styles.header}>
        {/* Top Bar with Greeting and Icons */}
        <div style={styles.headerTopBar}>
          <h1 style={styles.greeting}>
            Halo {currentUserName}
          </h1>

          <div style={styles.iconButtonContainer}>
            {/* WiFi Icon Button - Dynamic based on network status */}
            <button
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: networkStatus === 'online' ? '#F1F8E9' : networkStatus === 'reconnecting' ? '#FEF3C7' : '#FEE2E2',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {networkStatus === 'online' ? (
                // Online - Green WiFi icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.55a11 11 0 0114.08 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                    stroke="#2D5016"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : networkStatus === 'reconnecting' ? (
                // Reconnecting - Orange sync/refresh icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12a9 9 0 11-3-6.71"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 3v6h-6"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                // Offline - Red WiFi off icon with slash
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.55a11 11 0 0114.08 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 2l20 20"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Grid Icon Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#F5F5F5',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#666" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#666" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#666" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="#666" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            marginBottom: '20px',
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
              color: '#666666',
              backgroundColor: '#FAFAFA',
              border: searchFocused || searchQuery ? '2px solid #7CB342' : '2px solid transparent',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 200ms',
            }}
          />
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <circle cx="11" cy="11" r="8" stroke="#666666" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="#666666" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Location Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flex: 1,
              overflowX: 'auto',
            }}
          >
            {locations.map((location) => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  color: selectedLocation === location ? '#2D5016' : '#666666',
                  backgroundColor: selectedLocation === location ? '#F1F8E9' : 'transparent',
                  border: 'none',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {location}
              </button>
            ))}
          </div>

          {/* Add Location Button */}
          <button
            onClick={() => setShowAddLocationModal(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.5rem',
              color: '#666666',
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Plant Grid or Empty State - Scrollable */}
      <div style={styles.plantGridContainer}>
        <div style={styles.plantGrid}>
        {showEmptyState ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {/* Plant Icon */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#F1F8E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path
                  d="M30 52.5C30 52.5 12 42 12 27C12 20.3726 17.3726 15 24 15C26.8328 15 29.4134 15.9876 31.5 17.6459C33.5866 15.9876 36.1672 15 39 15C45.6274 15 51 20.3726 51 27C51 42 33 52.5 30 52.5Z"
                  fill="#7CB342"
                />
                <path
                  d="M30 17.6459V52.5"
                  stroke="#2D5016"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.125rem',
                fontWeight: 500,
                color: '#666666',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Belum ada tanaman
              <br />
              ditambahkan
            </p>
          </motion.div>
        ) : (
          /* Plant Grid */
          <>
            {filteredPlants.map((plant) => (
              <motion.div
                key={plant.id}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlantClick(plant)}
                onTouchStart={(e) => handleLongPressStart(plant, e)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onMouseDown={(e) => handleLongPressStart(plant, e)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuPlant(plant);
                  setShowPlantMenu(true);
                }}
                style={styles.plantCard}
              >
                {/* Plant Image */}
                <div style={styles.plantImageContainer}>
                  <img
                    src={plant.image}
                    alt={plant.name}
                    loading="lazy"
                    decoding="async"
                    style={styles.plantImage}
                  />
                </div>

                {/* Plant Name */}
                <h3 style={styles.plantName}>
                  {plant.name}
                </h3>

                {/* Plant Status */}
                <p style={styles.plantStatus}>
                  {plant.status}
                </p>
              </motion.div>
            ))}
          </>
        )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div style={styles.fabContainer}>
        {/* Bulk Water Button (only show when filtered) */}
        <AnimatePresence>
          {hasFilteredPlants && selectedLocation !== 'Semua' && !showEmptyState && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={handleBulkWater}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '2px solid #7CB342',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 28c-4.418 0-8-3.134-8-7 0-4 8-13 8-13s8 9 8 13c0 3.866-3.582 7-8 7z"
                  fill="#7CB342"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Add Plant Button */}
        <button
          onClick={handleAddPlantClick}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#7CB342',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="8" x2="16" y2="24" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="8" y1="16" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Add Plant Flow Modals */}
      <AnimatePresence>
        {showAddPlant && (
          <AddPlant
            onClose={() => setShowAddPlant(false)}
            onSelectSpecies={handleSelectSpecies}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddPlantForm && selectedSpecies && (
          <AddPlantForm
            species={selectedSpecies}
            existingPlantCount={plants.length}
            onClose={() => setShowAddPlantForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && newPlantData && (
          <AddPlantSuccess
            plantData={newPlantData}
            onViewDetails={handleViewDetails}
            onAddNew={handleAddNew}
            onBackHome={handleBackHome}
          />
        )}
      </AnimatePresence>

      {/* Plant Detail */}
      {showPlantDetail && selectedPlant && (
        <PlantDetail
          plant={selectedPlant}
          onBack={handlePlantDetailBack}
          onEdit={handlePlantEdit}
          onDelete={handlePlantDelete}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userName={currentUserName}
        userEmail={userEmail}
        userPhoto={userPhoto}
        onNavigate={handleProfileNavigation}
      />

      {/* Location Settings */}
      {showLocationSettings && (
        <LocationSettings
          onBack={handleLocationSettingsClose}
          onLocationDeleted={(locationName) => {
            showActionToastWithMessage(`Lokasi ${locationName} sudah dihapus`);
          }}
          onLocationAdded={(locationName) => {
            showActionToastWithMessage(`Lokasi ${locationName} sudah ditambahkan`);
          }}
        />
      )}

      {/* Edit Profile */}
      {showEditProfile && (
        <EditProfile
          onBack={() => setShowEditProfile(false)}
          userName={currentUserName}
          userEmail={userEmail}
          userPhoto={userPhoto}
          onSave={handleProfileSave}
          onProfileUpdated={() => {
            showActionToastWithMessage('Profil sudah diperbarui');
          }}
        />
      )}

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        plants={plants}
        onSave={handleAddLocationSave}
      />

      {/* Plant Long Press Menu Modal */}
      <AnimatePresence>
        {showPlantMenu && menuPlant && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlantMenu(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 3000,
              }}
            />

            {/* Menu Sheet */}
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
                padding: '24px',
                maxHeight: '70vh',
                overflowY: 'auto',
                zIndex: 3001,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
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
                  Pilihan
                </h2>
                <button
                  onClick={() => setShowPlantMenu(false)}
                  style={{
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
              </div>

              {/* Aksi Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#666666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Aksi
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {/* Lihat Detail */}
                <button
                  onClick={() => handlePlantMenuAction('detail')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Plant size={24} weight="duotone" color="#2D5016" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Lihat Detail
                  </span>
                </button>

                {/* Lakukan Penyiraman */}
                <button
                  onClick={() => handlePlantMenuAction('water')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Drop size={24} weight="duotone" color="#3B82F6" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Lakukan Penyiraman
                  </span>
                </button>

                {/* Beri Pupuk */}
                <button
                  onClick={() => handlePlantMenuAction('fertilize')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Leaf size={24} weight="duotone" color="#16A34A" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Beri Pupuk
                  </span>
                </button>

                {/* Diagnosa Hama */}
                <button
                  onClick={() => handlePlantMenuAction('diagnose')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <FirstAidKit size={24} weight="duotone" color="#EF4444" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Diagnosa Hama
                  </span>
                </button>
              </div>

              {/* Konfigurasi Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#666666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Konfigurasi
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <button
                  onClick={() => handlePlantMenuAction('edit')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <PencilSimple size={24} weight="bold" color="#4B5563" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Edit Tanaman
                  </span>
                </button>
              </div>

              {/* Zona Berbahaya Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#666666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Zona Berbahaya
              </p>

              <button
                onClick={() => handlePlantMenuAction('delete')}
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Trash size={24} weight="bold" color="#DC2626" />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#DC2626',
                  }}
                >
                  Hapus Tanaman
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Plant Modal from menu */}
      {showEditPlantModal && menuPlant && (
        <EditPlant
          plant={menuPlant}
          onClose={() => {
            setShowEditPlantModal(false);
            setMenuPlant(null);
          }}
          onSave={(updatedPlant) => {
            setPlants(plants.map((p) => (p.id === updatedPlant.id ? { ...p, ...updatedPlant } : p)));
            setShowEditPlantModal(false);
            setMenuPlant(null);
            showActionToastWithMessage(`${updatedPlant.name || updatedPlant.customName} sudah diperbarui`);
          }}
        />
      )}

      {/* Diagnosa Hama Modal from menu */}
      {showDiagnosaHamaModal && menuPlant && (
        <DiagnosaHama
          plant={menuPlant}
          onBack={() => {
            setShowDiagnosaHamaModal(false);
            setMenuPlant(null);
          }}
        />
      )}

      {/* Network Status Toast */}
      <AnimatePresence>
        {showNetworkToast && (
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
              zIndex: 4000,
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
                {toastMessage.title}
              </h4>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#666666',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {toastMessage.message}
              </p>
            </div>
            <button
              onClick={() => setShowNetworkToast(false)}
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Toast (Watering, Fertilizing, etc.) */}
      <AnimatePresence>
        {showActionToast && (
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
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              zIndex: 4000,
            }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                color: '#2C2C2C',
                margin: 0,
                flex: 1,
              }}
            >
              {actionToastMessage}
            </p>
            <button
              onClick={() => setShowActionToast(false)}
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
