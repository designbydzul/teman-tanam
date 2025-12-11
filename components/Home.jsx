import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { usePlants } from '@/hooks/usePlants';
import { useLocations } from '@/hooks/useLocations';

const Home = ({ userName }) => {
  // Data hooks - fetch real data from Supabase
  const {
    plants: supabasePlants,
    loading: plantsLoading,
    error: plantsError,
    refetch: refetchPlants,
    addPlant: addSupabasePlant,
    deletePlant: deleteSupabasePlant,
    recordAction,
  } = usePlants();

  const {
    locationNames: supabaseLocationNames,
    locations: supabaseLocations,
    loading: locationsLoading,
    addLocation: addSupabaseLocation,
  } = useLocations();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Semua');

  // Use Supabase data if available, otherwise fall back to empty array
  const plants = supabasePlants || [];
  const setPlants = () => {}; // Placeholder - updates are done via hooks

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
  const [userEmail, setUserEmail] = useState('designbydzul@gmail.com');
  const [currentUserName, setCurrentUserName] = useState(userName || 'Dzul');
  const [userPhoto, setUserPhoto] = useState(null);

  // Add Location Modal state
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  // Long press menu state
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [menuPlant, setMenuPlant] = useState(null);
  const longPressTimer = useRef(null);

  // Edit plant from menu
  const [showEditPlantModal, setShowEditPlantModal] = useState(false);

  // Tanya Tanam from menu
  const [showDiagnosaHamaModal, setShowDiagnosaHamaModal] = useState(false);

  // Delete confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState(null);

  // Network status state
  const [networkStatus, setNetworkStatus] = useState('online'); // 'online' | 'offline' | 'reconnecting'
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const reconnectingTimer = useRef(null);

  // Action toast state (for watering, fertilizing, plant actions, etc.)
  const [showActionToast, setShowActionToast] = useState(false);
  const [actionToastMessage, setActionToastMessage] = useState('');

  // Helper function to show action toast
  const showActionToastWithMessage = (message) => {
    setActionToastMessage(message);
    setShowActionToast(true);
    setTimeout(() => setShowActionToast(false), 3000);
  };

  // Load user profile from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('temanTanamUserName');
    const savedEmail = localStorage.getItem('temanTanamUserEmail');
    const savedPhoto = localStorage.getItem('temanTanamUserPhoto');
    if (savedName) setCurrentUserName(savedName);
    if (savedEmail) setUserEmail(savedEmail);
    if (savedPhoto) setUserPhoto(savedPhoto);
  }, []);

  // Use locations from Supabase hook, with fallback to localStorage
  const [localLocations, setLocalLocations] = useState(['Semua', 'Teras', 'Balkon']);

  // Load locations from localStorage as fallback
  useEffect(() => {
    const loadLocations = () => {
      const savedLocations = localStorage.getItem('temanTanamLocations');
      if (savedLocations) {
        const parsed = JSON.parse(savedLocations);
        const locationNames = parsed.map((loc) => loc.name);
        const uniqueLocations = [...new Set(locationNames)];
        setLocalLocations(['Semua', ...uniqueLocations]);
      }
    };

    loadLocations();
    window.addEventListener('storage', loadLocations);
    return () => window.removeEventListener('storage', loadLocations);
  }, []);

  // Use Supabase locations if available, otherwise fallback to localStorage
  const locations = supabaseLocationNames?.length > 1 ? supabaseLocationNames : localLocations;
  const setLocations = setLocalLocations;

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

  // Reload locations when returning from LocationSettings
  const handleLocationSettingsClose = () => {
    setShowLocationSettings(false);
    // Reload locations from localStorage
    const savedLocations = localStorage.getItem('temanTanamLocations');
    if (savedLocations) {
      const parsed = JSON.parse(savedLocations);
      const locationNames = parsed.map((loc) => loc.name);
      // Remove duplicates using Set
      const uniqueLocations = [...new Set(locationNames)];
      setLocations(['Semua', ...uniqueLocations]);
      // Reset to 'Semua' if current selection was deleted
      if (!['Semua', ...uniqueLocations].includes(selectedLocation)) {
        setSelectedLocation('Semua');
      }
    }
  };

  // Filter plants based on search and location
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const hasFilteredPlants = selectedLocation !== 'Semua';
  const showEmptyState = filteredPlants.length === 0;
  const hasNoPlants = plants.length === 0;
  const isSearching = searchQuery.trim().length > 0;
  const isFilteringLocation = selectedLocation !== 'Semua';

  const handleBulkWater = () => {
    console.log('Bulk watering plants in:', selectedLocation);
    // TODO: Implement bulk watering logic
  };

  // Add Plant flow handlers
  const handleAddPlantClick = () => {
    setShowAddPlant(true);
  };

  const handleSelectSpecies = (species) => {
    setSelectedSpecies(species);
    setShowAddPlantForm(true);
    // Keep showAddPlant true so it stays visible behind the form modal
  };

  const handleFormSubmit = async (plantData) => {
    console.log('[Home] handleFormSubmit called with:', plantData);

    // Add photo preview to plant data
    const dataWithPhoto = {
      ...plantData,
      photoPreview: plantData.photo ? URL.createObjectURL(plantData.photo) : null,
    };

    // Find location ID from supabase locations
    const locationObj = supabaseLocations?.find(
      loc => loc.name.toLowerCase() === plantData.location.toLowerCase()
    );
    const locationId = locationObj?.id || null;

    console.log('[Home] Location lookup:', {
      locationName: plantData.location,
      locationObj,
      locationId,
      availableLocations: supabaseLocations
    });

    // Prepare data for Supabase
    // NOTE: species_id is set to null because we're using local species data (not Supabase UUIDs)
    // The plant name already contains the species info. We can add species lookup later.
    const supabaseData = {
      customName: plantData.customName,
      name: plantData.customName || plantData.species?.name || 'Tanaman',
      speciesId: null, // Set to null - local species IDs are not valid UUIDs
      locationId: locationId,
      notes: plantData.notes || '',
      plantedDate: plantData.customDate || new Date().toISOString(),
      photoBlob: plantData.photoBlob || null, // Compressed photo blob for upload
    };

    console.log('[Home] Calling addSupabasePlant with:', {
      ...supabaseData,
      photoBlob: supabaseData.photoBlob ? `Blob(${(supabaseData.photoBlob.size / 1024).toFixed(1)}KB)` : null
    });

    // Save to Supabase
    const result = await addSupabasePlant(supabaseData);

    console.log('[Home] addSupabasePlant result:', result);

    if (result.success) {
      setNewPlantData(dataWithPhoto);
      setShowAddPlantForm(false);
      setShowSuccess(true);
    } else {
      // Show error toast or alert
      console.error('[Home] Failed to add plant:', result.error);
      alert(`Gagal menambah tanaman: ${result.error}`);
    }
  };

  const handleViewDetails = () => {
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
  };

  const handleAddNew = () => {
    setShowSuccess(false);
    setShowAddPlant(true);
    setSelectedSpecies(null);
    setNewPlantData(null);
  };

  const handleBackHome = () => {
    setShowSuccess(false);
    setShowAddPlant(false);
    setSelectedSpecies(null);
    setNewPlantData(null);
  };

  // Long press handlers for plant cards
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isLongPressValid = useRef(true);

  const handleLongPressStart = (plant, e) => {
    // Store initial touch position
    if (e.touches) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStartPos.current = { x: e.clientX, y: e.clientY };
    }
    isLongPressValid.current = true;

    longPressTimer.current = setTimeout(() => {
      if (isLongPressValid.current) {
        setMenuPlant(plant);
        setShowPlantMenu(true);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e) => {
    if (!longPressTimer.current) return;

    // Check if user moved more than 10px (scrolling)
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    if (deltaX > 10 || deltaY > 10) {
      // User is scrolling, cancel long press
      isLongPressValid.current = false;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPressValid.current = false;
  };

  const handlePlantMenuAction = (action) => {
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
          // Record watering action in Supabase
          recordAction(menuPlant.id, 'water').then((result) => {
            if (result.success) {
              showActionToastWithMessage(`Penyiraman ${menuPlant.name} sudah dicatat`);
            } else {
              showActionToastWithMessage(`Gagal mencatat penyiraman: ${result.error}`);
            }
          });
        }
        break;
      case 'fertilize':
        if (menuPlant) {
          // Record fertilizing action in Supabase
          recordAction(menuPlant.id, 'fertilize').then((result) => {
            if (result.success) {
              showActionToastWithMessage(`Pemupukan ${menuPlant.name} sudah dicatat`);
            } else {
              showActionToastWithMessage(`Gagal mencatat pemupukan: ${result.error}`);
            }
          });
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
        if (menuPlant) {
          setPlantToDelete(menuPlant);
          setShowDeleteConfirmModal(true);
        }
        break;
      default:
        break;
    }
  };

  // Handle confirmed delete from modal
  const handleConfirmDelete = async () => {
    if (plantToDelete) {
      const plantName = plantToDelete.name;
      const result = await deleteSupabasePlant(plantToDelete.id);
      setShowDeleteConfirmModal(false);
      setPlantToDelete(null);
      setMenuPlant(null);
      if (result.success) {
        showActionToastWithMessage(`${plantName} sudah dihapus`);
      } else {
        showActionToastWithMessage(`Gagal menghapus: ${result.error}`);
      }
    }
  };

  // Plant Detail handlers
  const handlePlantClick = (plant) => {
    // Only navigate if not in long press
    if (!longPressTimer.current) {
      setSelectedPlant(plant);
      setShowPlantDetail(true);
    }
  };

  const handlePlantDetailBack = () => {
    setShowPlantDetail(false);
    setSelectedPlant(null);
  };

  const handlePlantEdit = (plant) => {
    console.log('Edit plant:', plant);
    // TODO: Implement plant editing
  };

  const handlePlantDelete = async (plantId) => {
    const plantToDeleteItem = plants.find((p) => p.id === plantId);
    const plantName = plantToDeleteItem?.name || plantToDeleteItem?.customName || 'Tanaman';

    // Delete from Supabase
    const result = await deleteSupabasePlant(plantId);

    setShowPlantDetail(false);
    setSelectedPlant(null);

    if (result.success) {
      showActionToastWithMessage(`${plantName} sudah dihapus`);
    } else {
      showActionToastWithMessage(`Gagal menghapus: ${result.error}`);
    }
  };

  // Handle navigation from ProfileModal
  const handleProfileNavigation = (action) => {
    if (action === 'location-settings') {
      setShowLocationSettings(true);
    } else if (action === 'edit-profile') {
      setShowEditProfile(true);
    }
    // TODO: Add other navigation actions (help-community, tutorial, logout)
  };

  // Handle profile save
  const handleProfileSave = (profileData) => {
    console.log('handleProfileSave received:', { name: profileData.name, email: profileData.email, hasPhoto: !!profileData.photo });
    setCurrentUserName(profileData.name);
    setUserEmail(profileData.email);
    // Always update photo (can be null to clear, or base64 string)
    if (profileData.photo) {
      console.log('Setting userPhoto');
      setUserPhoto(profileData.photo);
    }
  };

  // Handle add location save
  const handleAddLocationSave = ({ name, selectedPlantIds }) => {
    // Get existing locations from localStorage
    const savedLocations = localStorage.getItem('temanTanamLocations');
    const existingLocations = savedLocations ? JSON.parse(savedLocations) : [];

    // Add new location
    const newLocation = {
      id: Date.now().toString(),
      name,
      emoji: '📍',
    };
    const updatedLocations = [...existingLocations, newLocation];

    // Save to localStorage
    localStorage.setItem('temanTanamLocations', JSON.stringify(updatedLocations));

    // Update local state - remove duplicates using Set
    const uniqueLocations = [...new Set(updatedLocations.map((loc) => loc.name))];
    setLocations(['Semua', ...uniqueLocations]);

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

    // Show toast with plant count
    const plantCountText = selectedPlantIds.length > 0 ? ` dengan ${selectedPlantIds.length} tanaman` : '';
    showActionToastWithMessage(`Lokasi ${name} sudah ditambahkan${plantCountText}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FAFAFA',
        visibility: showDiagnosaHamaModal ? 'hidden' : 'visible',
      }}
    >
      {/* Header - Sticky */}
      <div
        style={{
          padding: '20px 24px',
          backgroundColor: '#FFFFFF',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Top Bar with Greeting and Icons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '28px',
              color: '#2D5016',
              margin: 0,
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Halo {currentUserName}
          </h1>

          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            {/* WiFi Icon Button - Dynamic based on network status */}
            <button
              onClick={() => {
                const statusMessages = {
                  online: { title: 'Online', message: 'Koneksi internet kamu stabil' },
                  reconnecting: { title: 'Reconnecting...', message: 'Sedang mencoba menghubungkan kembali' },
                  offline: { title: 'Offline', message: 'Tidak ada koneksi internet' },
                };
                const status = statusMessages[networkStatus];
                setToastMessage(status);
                setShowNetworkToast(true);
                setTimeout(() => setShowNetworkToast(false), 3000);
              }}
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
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
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
                <path d="M12 4L4 12M4 4l8 8" stroke="#666666" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
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
          )}
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
            {locations.map((location, index) => (
              <button
                key={`location-${index}-${location}`}
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
      <div
        style={{
          position: 'absolute',
          top: '250px',
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px 16px',
            padding: '16px 24px',
            paddingBottom: '100px',
          }}
        >
        {/* Loading Skeleton */}
        {plantsLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`skeleton-${i}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Skeleton Image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '24px',
                    backgroundColor: '#F1F8E9',
                    marginBottom: '8px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                {/* Skeleton Name */}
                <div
                  style={{
                    width: '80%',
                    height: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#E8F5E9',
                    marginBottom: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                {/* Skeleton Status */}
                <div
                  style={{
                    width: '60%',
                    height: '14px',
                    borderRadius: '7px',
                    backgroundColor: '#F5F5F5',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            ))}
            <style jsx>{`
              @keyframes pulse {
                0%, 100% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.5;
                }
              }
            `}</style>
          </>
        ) : showEmptyState ? (
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
              minHeight: 'calc(100vh - 400px)',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {/* Icon */}
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
              {isSearching || isFilteringLocation ? (
                // Search/Filter icon for no results
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="26" cy="26" r="14" stroke="#7CB342" strokeWidth="4" />
                  <path d="M36 36L48 48" stroke="#7CB342" strokeWidth="4" strokeLinecap="round" />
                  <path d="M20 26H32" stroke="#7CB342" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                // Plant icon for no plants added
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
              )}
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
              {isSearching ? (
                <>
                  Tidak ada hasil untuk
                  <br />
                  "{searchQuery}"
                </>
              ) : isFilteringLocation ? (
                <>
                  Belum ada tanaman
                  <br />
                  di {selectedLocation}
                </>
              ) : (
                <>
                  Belum ada tanaman
                  <br />
                  ditambahkan
                </>
              )}
            </p>
          </motion.div>
        ) : (
          /* Plant Grid */
          <>
            {filteredPlants.map((plant) => (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handlePlantClick(plant)}
                onTouchStart={(e) => handleLongPressStart(plant, e)}
                onTouchMove={handleTouchMove}
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  minWidth: 0,
                  width: '100%',
                }}
              >
                {/* Plant Image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    backgroundColor: '#F1F8E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {plant.image ? (
                    <img
                      src={plant.image}
                      alt={plant.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M24 42C24 42 10 34 10 22C10 17 14 12 19 12C21.5 12 23.8 13 25.5 14.5C27.2 13 29.5 12 32 12C37 12 41 17 41 22C41 34 27 42 24 42Z" fill="#7CB342"/>
                            <path d="M24 14.5V42" stroke="#2D5016" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        `;
                      }}
                    />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M24 42C24 42 10 34 10 22C10 17 14 12 19 12C21.5 12 23.8 13 25.5 14.5C27.2 13 29.5 12 32 12C37 12 41 17 41 22C41 34 27 42 24 42Z" fill="#7CB342"/>
                      <path d="M24 14.5V42" stroke="#2D5016" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>

                {/* Plant Name */}
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: '150%',
                    color: '#2C2C2C',
                    margin: '0 0 4px 0',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {plant.name}
                </h3>

                {/* Plant Status */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '150%',
                    color: '#666666',
                    margin: 0,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {plant.status}
                </p>
              </motion.div>
            ))}
          </>
        )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
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
          onRecordAction={recordAction}
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
          plants={plants}
          onPlantsUpdated={(updatedPlants) => {
            setPlants(updatedPlants);
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
        existingLocations={locations}
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

                {/* Tanya Tanam */}
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
                    Tanya Tanam
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

      {/* Tanya Tanam Modal from menu - rendered via portal to avoid z-index issues */}
      {showDiagnosaHamaModal && menuPlant && typeof document !== 'undefined' && createPortal(
        <DiagnosaHama
          plant={menuPlant}
          onBack={() => {
            setShowDiagnosaHamaModal(false);
            setMenuPlant(null);
          }}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && plantToDelete && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setPlantToDelete(null);
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4000,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                width: 'calc(100% - 48px)',
                maxWidth: '320px',
                zIndex: 4001,
                textAlign: 'center',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Trash size={32} weight="bold" color="#DC2626" />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-caveat), Caveat, cursive',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#2D5016',
                  margin: '0 0 8px 0',
                }}
              >
                Hapus Tanaman?
              </h3>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  margin: '0 0 24px 0',
                  lineHeight: 1.5,
                }}
              >
                Kamu yakin mau hapus <strong>{plantToDelete.name}</strong>? Aksi ini tidak bisa dibatalkan.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setPlantToDelete(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#666666',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1,
                    padding: '14px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
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
          </>
        )}
      </AnimatePresence>

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
