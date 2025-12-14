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
  DotsThreeVertical,
  X,
  ChatCircleDots,
} from '@phosphor-icons/react';
import AddPlant from './AddPlant';
import AddPlantForm from './AddPlantForm';
import AddPlantSuccess from './AddPlantSuccess';
import PlantDetail from './PlantDetail';
import ProfileModal from './ProfileModal';
import LocationSettings from './LocationSettings';
import EditProfile from './EditProfile';
import EditPlant from './EditPlant';
import TanyaTanam from './TanyaTanam';
import OfflineIndicator from './OfflineIndicator';
import { usePlants } from '@/hooks/usePlants';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';

const Home = ({ userName }) => {
  // Auth hook - get profile from Supabase
  const { user, profile } = useAuth();

  // Data hooks - fetch real data from Supabase
  const {
    plants: supabasePlants,
    loading: plantsLoading,
    error: plantsError,
    refetch: refetchPlants,
    addPlant: addSupabasePlant,
    deletePlant: deleteSupabasePlant,
    recordAction,
    // Offline support
    isOnline,
    syncStatus,
    pendingCount,
    syncNow,
  } = usePlants();

  const {
    locationNames: supabaseLocationNames,
    locations: supabaseLocations,
    loading: locationsLoading,
    addLocation: addSupabaseLocation,
    refetch: refetchLocations,
  } = useLocations();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Semua');

  // Use Supabase data if available, otherwise fall back to empty array
  const plants = supabasePlants || [];
  // Note: Plant updates are done via usePlants hook (addSupabasePlant, deleteSupabasePlant, etc.)

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
  const [userEmail, setUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState(userName || '');
  const [userPhoto, setUserPhoto] = useState(null);


  // Long press and menu state
  const [menuPlant, setMenuPlant] = useState(null);
  const longPressTimer = useRef(null);

  // Multi-select state for bulk actions
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState(new Set());
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null); // 'siram' | 'pupuk'
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Edit plant from menu
  const [showEditPlantModal, setShowEditPlantModal] = useState(false);

  // Tanya Tanam from menu
  const [showTanyaTanamModal, setShowTanyaTanamModal] = useState(false);

  // Delete confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState(null);
  const [plantsToDelete, setPlantsToDelete] = useState([]); // For bulk delete

  // Network status state
  const [networkStatus, setNetworkStatus] = useState('online'); // 'online' | 'offline' | 'reconnecting'
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const reconnectingTimer = useRef(null);

  // Track failed plant images to show fallback
  const [failedImages, setFailedImages] = useState(new Set());

  // Action toast state (for watering, fertilizing, plant actions, etc.)
  const [showActionToast, setShowActionToast] = useState(false);
  const [actionToastMessage, setActionToastMessage] = useState('');
  const actionToastTimer = useRef(null);

  // Helper function to show action toast
  const showActionToastWithMessage = (message) => {
    // Clear any existing timer to prevent memory leaks
    if (actionToastTimer.current) {
      clearTimeout(actionToastTimer.current);
    }
    setActionToastMessage(message);
    setShowActionToast(true);
    actionToastTimer.current = setTimeout(() => setShowActionToast(false), 3000);
  };

  // Cleanup action toast timer on unmount
  useEffect(() => {
    return () => {
      if (actionToastTimer.current) {
        clearTimeout(actionToastTimer.current);
      }
    };
  }, []);

  // Load user profile from Supabase profile or localStorage fallback
  useEffect(() => {
    // Always try to get email from user object first (most reliable source)
    if (user?.email) {
      setUserEmail(user.email);
    }

    // Priority: Supabase profile > localStorage for other fields
    if (profile) {
      if (profile.display_name) setCurrentUserName(profile.display_name);
      if (profile.avatar_url) setUserPhoto(profile.avatar_url);
    } else {
      // Fallback to localStorage
      const savedName = localStorage.getItem('temanTanamUserName');
      const savedEmail = localStorage.getItem('temanTanamUserEmail');
      const savedPhoto = localStorage.getItem('temanTanamUserPhoto');
      if (savedName) setCurrentUserName(savedName);
      if (savedEmail && !user?.email) setUserEmail(savedEmail);
      if (savedPhoto) setUserPhoto(savedPhoto);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.display_name, profile?.avatar_url, user?.email]);

  // Use locations from Supabase hook
  // supabaseLocationNames already includes "Semua" as the first option
  const locations = supabaseLocationNames;

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
    // Refetch locations from Supabase
    refetchLocations();
    // Reset to 'Semua' if current selection was deleted
    if (!supabaseLocationNames.includes(selectedLocation)) {
      setSelectedLocation('Semua');
    }
  };

  // Filter plants based on search and location
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const showEmptyState = filteredPlants.length === 0;
  const hasNoPlants = plants.length === 0;
  const isSearching = searchQuery.trim().length > 0;
  const isFilteringLocation = selectedLocation !== 'Semua';

  // Multi-select handlers
  const togglePlantSelection = (plantId) => {
    setSelectedPlantIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(plantId)) {
        newSet.delete(plantId);
      } else {
        newSet.add(plantId);
      }
      // Exit multi-select mode if no plants selected
      if (newSet.size === 0) {
        setIsMultiSelectMode(false);
      }
      return newSet;
    });
  };

  const selectAllPlants = () => {
    setSelectedPlantIds(new Set(filteredPlants.map(p => p.id)));
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedPlantIds(new Set());
  };

  // Show confirmation modal before bulk action
  const showBulkActionConfirmation = (actionType) => {
    if (selectedPlantIds.size === 0) {
      showActionToastWithMessage('Pilih tanaman terlebih dahulu');
      return;
    }
    setBulkActionType(actionType);
    setShowBulkActionConfirm(true);
  };

  // Execute bulk action after confirmation
  const executeBulkAction = async () => {
    if (selectedPlantIds.size === 0 || !bulkActionType) return;

    setShowBulkActionConfirm(false);
    setIsBulkActioning(true);

    // Record action for each selected plant
    let successCount = 0;
    let failCount = 0;

    for (const plantId of selectedPlantIds) {
      const result = await recordAction(plantId, bulkActionType);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkActioning(false);

    // Show result toast
    const actionLabel = bulkActionType === 'siram' ? 'disiram' : 'dipupuk';
    const emoji = bulkActionType === 'siram' ? '💧' : '🌿';
    if (failCount === 0) {
      showActionToastWithMessage(`${successCount} tanaman sudah ${actionLabel}! ${emoji}`);
    } else {
      showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal ${actionLabel}`);
    }

    // Exit multi-select mode
    setBulkActionType(null);
    exitMultiSelectMode();
  };

  const cancelBulkAction = () => {
    setShowBulkActionConfirm(false);
    setBulkActionType(null);
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
    // We pass speciesName and speciesEmoji for display purposes
    const supabaseData = {
      customName: plantData.customName,
      name: plantData.customName || plantData.species?.name || 'Tanaman',
      speciesId: null, // Set to null - local species IDs are not valid UUIDs
      speciesName: plantData.species?.name || null, // Store species name for emoji lookup
      speciesEmoji: plantData.species?.emoji || '🌱', // Store emoji directly
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
        plantedDate: newPlantData.plantedDate || new Date(),
        image: newPlantData.photoPreview || null,
        photoUrl: newPlantData.photoPreview || null,
        notes: newPlantData.notes || '',
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
    // Don't start long press timer if already in multi-select mode
    if (isMultiSelectMode) return;

    // Store initial touch position
    if (e.touches) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStartPos.current = { x: e.clientX, y: e.clientY };
    }
    isLongPressValid.current = true;

    longPressTimer.current = setTimeout(() => {
      if (isLongPressValid.current) {
        // Enter multi-select mode and select this plant
        setIsMultiSelectMode(true);
        setSelectedPlantIds(new Set([plant.id]));
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

  // Handle confirmed delete from modal
  const handleConfirmDelete = async () => {
    // Bulk delete
    if (plantsToDelete.length > 0) {
      let successCount = 0;
      let failCount = 0;

      for (const plant of plantsToDelete) {
        const result = await deleteSupabasePlant(plant.id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setShowDeleteConfirmModal(false);
      setPlantsToDelete([]);
      exitMultiSelectMode();

      if (failCount === 0) {
        showActionToastWithMessage(`${successCount} tanaman sudah dihapus`);
      } else {
        showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal dihapus`);
      }
      return;
    }

    // Single delete
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
    // In multi-select mode, toggle selection
    if (isMultiSelectMode) {
      togglePlantSelection(plant.id);
      return;
    }

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
    // Close plant detail and open edit modal
    setShowPlantDetail(false);
    setMenuPlant(plant);
    setShowEditPlantModal(true);
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


  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FAFAFA',
        visibility: showTanyaTanamModal ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Offline Status Indicator */}
      <OfflineIndicator
        isOnline={isOnline}
        syncStatus={syncStatus}
        pendingCount={pendingCount}
        syncNow={syncNow}
      />

      {/* Header */}
      <div
        style={{
          paddingTop: '20px',
          backgroundColor: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        {/* Top Bar with Greeting and Icons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingLeft: '24px',
            paddingRight: '24px',
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
            paddingLeft: '24px',
            paddingRight: '24px',
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
            paddingRight: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid #F0F0F0',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flex: 1,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '4px',
              paddingLeft: '24px',
            }}
            className="hide-scrollbar"
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

          {/* Add Location Button - navigates to Location Settings */}
          <button
            onClick={() => setShowLocationSettings(true)}
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

        {/* Multi-Select Info Bar - below location tabs, inside header */}
        <AnimatePresence>
          {isMultiSelectMode && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                overflow: 'hidden',
                paddingLeft: '24px',
                paddingRight: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Cancel Button - Red pill style */}
                <button
                  onClick={exitMultiSelectMode}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#FEE2E2',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#DC2626',
                  }}
                >
                  Batal
                </button>

                {/* Selection Count */}
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#2C2C2C',
                  }}
                >
                  {selectedPlantIds.size} dipilih
                </span>

                {/* Select All Button - Gray pill style */}
                <button
                  onClick={selectedPlantIds.size === filteredPlants.length ? () => setSelectedPlantIds(new Set()) : selectAllPlants}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#666666',
                  }}
                >
                  {selectedPlantIds.size === filteredPlants.length ? 'Batal pilih' : 'Semua'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plant Grid or Empty State - Scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          backgroundColor: '#FFFFFF',
          paddingBottom: isMultiSelectMode ? '80px' : 0,
        }}
      >
        <div
          className="plant-grid"
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
                backgroundColor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              {isSearching || isFilteringLocation ? (
                // Search/Filter icon for no results
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="26" cy="26" r="14" stroke="#999999" strokeWidth="4" />
                  <path d="M36 36L48 48" stroke="#999999" strokeWidth="4" strokeLinecap="round" />
                  <path d="M20 26H32" stroke="#999999" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                // Plant icon for no plants added
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path
                    d="M30 52.5C30 52.5 12 42 12 27C12 20.3726 17.3726 15 24 15C26.8328 15 29.4134 15.9876 31.5 17.6459C33.5866 15.9876 36.1672 15 39 15C45.6274 15 51 20.3726 51 27C51 42 33 52.5 30 52.5Z"
                    fill="#CCCCCC"
                  />
                  <path
                    d="M30 17.6459V52.5"
                    stroke="#999999"
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
                onContextMenu={(e) => e.preventDefault()}
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
                {/* Plant Image with Selection Overlay */}
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
                    position: 'relative',
                    border: isMultiSelectMode && selectedPlantIds.has(plant.id) ? '3px solid #7CB342' : '3px solid transparent',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {plant.image && !failedImages.has(plant.id) ? (
                    <img
                      src={plant.image}
                      alt={plant.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={() => {
                        setFailedImages(prev => new Set(prev).add(plant.id));
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>
                      {plant.species?.emoji || '🌱'}
                    </span>
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

      {/* Multi-Select Action Bar - Bottom */}
      <AnimatePresence>
        {isMultiSelectMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E5E5E5',
              padding: '16px 24px',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 100,
            }}
          >
            {/* Water Button - Outlined */}
            <button
              onClick={() => showBulkActionConfirmation('siram')}
              disabled={selectedPlantIds.size === 0 || isBulkActioning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E5E5E5',
                borderRadius: '28px',
                cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                fontWeight: 500,
                color: selectedPlantIds.size > 0 ? '#2C2C2C' : '#AAAAAA',
                flex: 1,
                justifyContent: 'center',
                opacity: selectedPlantIds.size === 0 ? 0.6 : 1,
              }}
            >
              <Drop
                size={20}
                weight="regular"
                color={selectedPlantIds.size > 0 ? '#3B82F6' : '#AAAAAA'}
              />
              Siram
            </button>

            {/* Fertilize Button - Outlined */}
            <button
              onClick={() => showBulkActionConfirmation('pupuk')}
              disabled={selectedPlantIds.size === 0 || isBulkActioning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E5E5E5',
                borderRadius: '28px',
                cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                fontWeight: 500,
                color: selectedPlantIds.size > 0 ? '#2C2C2C' : '#AAAAAA',
                flex: 1,
                justifyContent: 'center',
                opacity: selectedPlantIds.size === 0 ? 0.6 : 1,
              }}
            >
              <Leaf
                size={20}
                weight="regular"
                color={selectedPlantIds.size > 0 ? '#16A34A' : '#AAAAAA'}
              />
              Pupuk
            </button>

            {/* More Button */}
            <button
              onClick={() => setShowMoreMenu(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E5E5E5',
                borderRadius: '50%',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <DotsThreeVertical size={24} weight="bold" color="#666666" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button - Add Plant (hide in multi-select mode) */}
      <AnimatePresence>
        {!isMultiSelectMode && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
            }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
          onPlantsUpdated={() => {
            // Refetch plants from Supabase after location changes
            refetchPlants();
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

      {/* Edit Plant Modal from menu */}
      {showEditPlantModal && menuPlant && (
        <EditPlant
          plant={menuPlant}
          onClose={() => {
            setShowEditPlantModal(false);
            setMenuPlant(null);
          }}
          onSave={(updatedPlant) => {
            // Refetch plants from Supabase after edit
            refetchPlants();
            setShowEditPlantModal(false);
            setMenuPlant(null);
            showActionToastWithMessage(`${updatedPlant.name || updatedPlant.customName} sudah diperbarui`);
          }}
        />
      )}

      {/* Tanya Tanam Modal from menu - rendered via portal to avoid z-index issues */}
      {showTanyaTanamModal && menuPlant && typeof document !== 'undefined' && createPortal(
        <TanyaTanam
          plant={menuPlant}
          onBack={() => {
            setShowTanyaTanamModal(false);
            setMenuPlant(null);
          }}
        />,
        document.body
      )}

      {/* Bulk Action Confirmation Modal */}
      <AnimatePresence>
        {showBulkActionConfirm && bulkActionType && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelBulkAction}
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

            {/* Modal Container - for centering */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4001,
                padding: '24px',
              }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '32px',
                  width: '100%',
                  maxWidth: '360px',
                  textAlign: 'center',
                }}
              >
              {/* Icon */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: bulkActionType === 'siram' ? '#EFF6FF' : '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                {bulkActionType === 'siram' ? (
                  <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 17.5c-2.761 0-5-1.959-5-4.375 0-2.5 5-8.125 5-8.125s5 5.625 5 8.125c0 2.416-2.239 4.375-5 4.375z"
                      fill="#3B82F6"
                    />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17 8C15.5 9.5 14 12 14 14c0 2.5 2 4 4 4s4-1.5 4-4c0-2-1.5-4.5-3-6l-1-1.5L17 8z"
                      fill="#16A34A"
                    />
                    <path
                      d="M5 14c-1.5 1.5-3 3.5-3 5.5C2 21.5 3.5 23 5 23s3-1.5 3-3.5c0-2-1.5-4-3-5.5z"
                      fill="#16A34A"
                      opacity="0.6"
                    />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 12px 0',
                }}
              >
                {bulkActionType === 'siram' ? 'Siram Tanaman?' : 'Beri Pupuk?'}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  margin: '0 0 28px 0',
                  lineHeight: '1.5',
                }}
              >
                {bulkActionType === 'siram'
                  ? `${selectedPlantIds.size} tanaman akan dicatat sudah disiram hari ini.`
                  : `${selectedPlantIds.size} tanaman akan dicatat sudah diberi pupuk hari ini.`}
              </p>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <button
                  onClick={cancelBulkAction}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#666666',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={executeBulkAction}
                  disabled={isBulkActioning}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    backgroundColor: bulkActionType === 'siram' ? '#3B82F6' : '#16A34A',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isBulkActioning ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    opacity: isBulkActioning ? 0.7 : 1,
                  }}
                >
                  {isBulkActioning ? 'Memproses...' : bulkActionType === 'siram' ? 'Siram' : 'Pupuk'}
                </button>
              </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* More Menu Drawer */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
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

            {/* Drawer */}
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
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                zIndex: 5001,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '28px',
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Pilihan
                </h2>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={24} weight="bold" color="#666666" />
                </button>
              </div>

              {/* AKSI Section */}
              <div style={{ marginBottom: '24px' }}>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#999999',
                    margin: '0 0 12px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Aksi
                </p>

                {/* Siram Tanaman */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    showBulkActionConfirmation('siram');
                  }}
                  disabled={selectedPlantIds.size === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: selectedPlantIds.size > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  <Drop size={24} weight="regular" color="#3B82F6" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Siram Tanaman
                  </span>
                </button>

                {/* Beri Pupuk */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    showBulkActionConfirmation('pupuk');
                  }}
                  disabled={selectedPlantIds.size === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: selectedPlantIds.size > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  <Leaf size={24} weight="regular" color="#16A34A" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Beri Pupuk
                  </span>
                </button>

              </div>

              {/* ZONA BERBAHAYA Section */}
              <div>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#999999',
                    margin: '0 0 12px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Zona Berbahaya
                </p>

                {/* Hapus Tanaman */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (selectedPlantIds.size === 1) {
                      // Single delete
                      const plantId = Array.from(selectedPlantIds)[0];
                      const plant = plants.find(p => p.id === plantId);
                      if (plant) {
                        setPlantToDelete(plant);
                        setShowDeleteConfirmModal(true);
                      }
                    } else if (selectedPlantIds.size > 1) {
                      // Bulk delete
                      const plantsForDelete = plants.filter(p => selectedPlantIds.has(p.id));
                      setPlantsToDelete(plantsForDelete);
                      setShowDeleteConfirmModal(true);
                    }
                  }}
                  disabled={selectedPlantIds.size === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#FEF2F2',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash size={24} weight="regular" color="#DC2626" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#DC2626',
                    }}
                  >
                    Hapus Tanaman
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && (plantToDelete || plantsToDelete.length > 0) && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setPlantToDelete(null);
                setPlantsToDelete([]);
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

            {/* Modal Container - for centering */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4001,
                padding: '24px',
              }}
            >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '320px',
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
                {plantsToDelete.length > 0
                  ? `Kamu yakin mau hapus ${plantsToDelete.length} tanaman? Aksi ini tidak bisa dibatalkan.`
                  : <>Kamu yakin mau hapus <strong>{plantToDelete?.name}</strong>? Aksi ini tidak bisa dibatalkan.</>
                }
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setPlantToDelete(null);
                    setPlantsToDelete([]);
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
