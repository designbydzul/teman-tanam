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
  Plus,
  CaretDown,
  GearSix,
  Check,
  Basket,
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
import BulkFertilizeModal from './BulkFertilizeModal';
import { usePlants } from '@/hooks/usePlants';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, typography } from '@/styles/theme';

const Home = ({ userName }) => {
  // Auth hook - get profile from Supabase
  const { user, profile, updateShowStatistics } = useAuth();

  // Data hooks - fetch real data from Supabase
  const {
    plants: supabasePlants,
    loading: plantsLoading,
    error: plantsError,
    refetch: refetchPlants,
    addPlant: addSupabasePlant,
    deletePlant: deleteSupabasePlant,
    updatePlant: updateSupabasePlant,
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
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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

  // Stats visibility preference (synced with database, localStorage as fallback)
  const [showHomeStats, setShowHomeStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showHomeStats');
      return saved !== null ? JSON.parse(saved) : true; // Default: show stats
    }
    return true;
  });

  // Sync showHomeStats with profile from database when it loads
  useEffect(() => {
    if (profile?.show_statistics !== undefined) {
      setShowHomeStats(profile.show_statistics);
      // Also update localStorage to keep it in sync
      localStorage.setItem('showHomeStats', JSON.stringify(profile.show_statistics));
    }
  }, [profile?.show_statistics]);

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
  const [alreadyWateredToday, setAlreadyWateredToday] = useState([]); // Plants already watered today
  const [alreadyFertilizedToday, setAlreadyFertilizedToday] = useState([]); // Plants already fertilized today
  const [showBulkFertilizeModal, setShowBulkFertilizeModal] = useState(false); // Fertilize modal with photo/notes

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

  // Status filter options
  const statusOptions = [
    { value: 'Semua', label: 'Semua Status' },
    { value: 'Perlu disiram', label: 'Perlu disiram' },
    { value: 'Perlu dipupuk', label: 'Perlu dipupuk' },
    { value: 'Terawat', label: 'Terawat' },
    { value: 'Siap dipanen', label: 'Siap dipanen' },
  ];

  // Filter plants based on search, location, and status
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;

    // Status filter logic
    let matchesStatus = true;
    if (selectedStatus !== 'Semua') {
      // Match status text (plant.status contains "Perlu disiram", "Perlu dipupuk", "Terawat", etc.)
      if (selectedStatus === 'Terawat') {
        // "Terawat" also includes "Baik Baik Saja"
        matchesStatus = plant.status === 'Terawat' || plant.status === 'Baik Baik Saja';
      } else {
        matchesStatus = plant.status === selectedStatus;
      }
    }

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const showEmptyState = filteredPlants.length === 0;
  const hasNoPlants = plants.length === 0;
  const isSearching = searchQuery.trim().length > 0;
  const isFilteringLocation = selectedLocation !== 'Semua';
  const isFilteringStatus = selectedStatus !== 'Semua';

  // Search expand state
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Calculate urgent status counts for summary line
  const urgentStatusCounts = React.useMemo(() => {
    const counts = {
      perluDisiram: 0,
      perluDipupuk: 0,
      siapDipanen: 0,
    };

    plants.forEach(plant => {
      if (plant.status === 'Perlu disiram') {
        counts.perluDisiram++;
      } else if (plant.status === 'Perlu dipupuk') {
        counts.perluDipupuk++;
      } else if (plant.status === 'Siap dipanen') {
        counts.siapDipanen++;
      }
    });

    return counts;
  }, [plants]);

  // Get most urgent status message (priority order: disiram > dipupuk > dipanen)
  const urgentSummary = React.useMemo(() => {
    if (urgentStatusCounts.perluDisiram > 0) {
      return {
        text: `${urgentStatusCounts.perluDisiram} tanaman perlu disiram`,
        color: '#FF9800', // Orange warning
      };
    }
    if (urgentStatusCounts.perluDipupuk > 0) {
      return {
        text: `${urgentStatusCounts.perluDipupuk} tanaman perlu dipupuk`,
        color: '#FF9800', // Orange warning
      };
    }
    if (urgentStatusCounts.siapDipanen > 0) {
      return {
        text: `${urgentStatusCounts.siapDipanen} tanaman siap dipanen`,
        color: '#4CAF50', // Green
      };
    }
    return null; // No urgent status, hide the line
  }, [urgentStatusCounts]);

  // Stats cards calculation
  const statsData = React.useMemo(() => {
    const totalPlants = plants.length;
    const needsWatering = urgentStatusCounts.perluDisiram;
    const needsFertilizing = urgentStatusCounts.perluDipupuk;
    const readyToHarvest = urgentStatusCounts.siapDipanen;

    return [
      { label: 'Tanaman', value: totalPlants, Icon: Plant },
      { label: 'Penyiraman', value: needsWatering, Icon: Drop },
      { label: 'Pemupukan', value: needsFertilizing, Icon: Leaf },
      { label: 'Siap Panen', value: readyToHarvest, Icon: Basket },
    ];
  }, [plants.length, urgentStatusCounts]);

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

  // Helper to check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const checkDate = new Date(date);
    return today.getFullYear() === checkDate.getFullYear() &&
           today.getMonth() === checkDate.getMonth() &&
           today.getDate() === checkDate.getDate();
  };

  // Show confirmation modal before bulk action
  const showBulkActionConfirmation = (actionType) => {
    if (selectedPlantIds.size === 0) {
      showActionToastWithMessage('Pilih tanaman terlebih dahulu');
      return;
    }

    // Get selected plants
    const selectedPlants = plants.filter(p => selectedPlantIds.has(p.id));

    if (actionType === 'siram') {
      // Check for plants already watered today
      const wateredToday = selectedPlants.filter(p => isToday(p.lastWatered));
      setAlreadyWateredToday(wateredToday);
      setBulkActionType(actionType);
      setShowBulkActionConfirm(true);
    } else if (actionType === 'pupuk') {
      // Check for plants already fertilized today
      const fertilizedToday = selectedPlants.filter(p => isToday(p.lastFertilized));
      setAlreadyFertilizedToday(fertilizedToday);
      // Open fertilize modal instead of confirmation
      setBulkActionType(actionType);
      setShowBulkFertilizeModal(true);
    }
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
    setShowBulkFertilizeModal(false);
    setBulkActionType(null);
    setAlreadyWateredToday([]);
    setAlreadyFertilizedToday([]);
  };

  // Execute bulk fertilize with notes and photo
  const executeBulkFertilize = async ({ notes, photoFile }) => {
    if (selectedPlantIds.size === 0) return;

    setIsBulkActioning(true);

    let successCount = 0;
    let failCount = 0;

    for (const plantId of selectedPlantIds) {
      // Only pass photo for first plant to avoid duplicate uploads
      const result = await recordAction(plantId, 'pupuk', notes || null, successCount === 0 ? photoFile : null);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkActioning(false);
    setShowBulkFertilizeModal(false);

    // Show result toast
    if (failCount === 0) {
      showActionToastWithMessage(`${successCount} tanaman sudah dipupuk!`);
    } else {
      showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal dipupuk`);
    }

    // Exit multi-select mode and cleanup
    setBulkActionType(null);
    setAlreadyFertilizedToday([]);
    exitMultiSelectMode();
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

  // Handle stats toggle from ProfileModal - save to database and localStorage
  const handleToggleStats = async (value) => {
    // Update local state immediately for responsive UI
    setShowHomeStats(value);

    // Save to database (also updates localStorage as fallback)
    await updateShowStatistics(value);
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
      className="ios-fixed-container"
      style={{
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
                width: '52px',
                height: '52px',
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12a9 9 0 11-3-6.71"
                    stroke="#FF9800"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 3v6h-6"
                    stroke="#FF9800"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                // Offline - Red WiFi off icon with slash
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#F5F5F5',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#757575" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#757575" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#757575" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="#757575" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Cards Row */}
        {!plantsLoading && showHomeStats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              paddingLeft: '24px',
              paddingRight: '24px',
              marginBottom: '16px',
            }}
          >
            {statsData.map((stat, index) => (
              <div
                key={stat.label}
                style={{
                  padding: '10px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: radius.lg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: '11px',
                    fontWeight: typography.fontWeight.normal,
                    color: colors.gray600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {stat.label}
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: typography.fontFamily,
                      fontSize: typography.fontSize['2xl'],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.gray800,
                    }}
                  >
                    {stat.value}
                  </span>
                  <stat.Icon size={20} weight="regular" color={colors.gray400} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Dropdowns with Search Icon */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            paddingBottom: '20px',
            paddingLeft: '24px',
            paddingRight: '24px',
            borderBottom: '1px solid #F0F0F0',
          }}
        >
          {/* Location Dropdown Button */}
          <button
            onClick={() => setShowLocationDropdown(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 16px',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily,
              fontWeight: typography.fontWeight.medium,
              color: isFilteringLocation ? colors.greenForest : colors.gray800,
              backgroundColor: isFilteringLocation ? colors.greenLight : colors.white,
              border: `1px solid ${isFilteringLocation ? colors.greenFresh : colors.gray200}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{selectedLocation === 'Semua' ? 'Semua Lokasi' : selectedLocation}</span>
            <CaretDown size={14} weight="bold" />
          </button>

          {/* Status Dropdown Button */}
          <button
            onClick={() => setShowStatusDropdown(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 16px',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily,
              fontWeight: typography.fontWeight.medium,
              color: isFilteringStatus ? colors.greenForest : colors.gray800,
              backgroundColor: isFilteringStatus ? colors.greenLight : colors.white,
              border: `1px solid ${isFilteringStatus ? colors.greenFresh : colors.gray200}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{selectedStatus === 'Semua' ? 'Semua Status' : selectedStatus}</span>
            <CaretDown size={14} weight="bold" />
          </button>

          {/* Spacer to push search to right */}
          <div style={{ flex: 1 }} />

          {/* Search Icon Button - Toggle search input */}
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: radius.lg,
              backgroundColor: showSearchInput || isSearching ? colors.greenLight : colors.white,
              border: `1px solid ${showSearchInput || isSearching ? colors.greenFresh : colors.gray200}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke={showSearchInput || isSearching ? colors.greenForest : colors.gray600} strokeWidth="2.5" />
              <path d="M20 20l-3.5-3.5" stroke={showSearchInput || isSearching ? colors.greenForest : colors.gray600} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Expandable Search Bar */}
        <AnimatePresence>
          {showSearchInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: '16px 24px',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                <input
                  type="text"
                  placeholder="Cari tanaman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 80px 14px 16px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    color: '#2C2C2C',
                    backgroundColor: '#FAFAFA',
                    border: searchFocused || searchQuery ? '2px solid #7CB342' : '2px solid #E0E0E0',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 200ms',
                  }}
                />
                {/* Single X button - clears text if present, closes search if empty */}
                <button
                  onClick={() => {
                    if (searchQuery) {
                      setSearchQuery('');
                    } else {
                      setShowSearchInput(false);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: '36px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: colors.gray200,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M11 3L3 11M3 3l8 8" stroke={colors.gray600} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                {/* Cancel Button - Red style */}
                <button
                  onClick={exitMultiSelectMode}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#FEE2E2',
                    border: 'none',
                    borderRadius: radius.md,
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

                {/* Select All Button - Gray style */}
                <button
                  onClick={selectedPlantIds.size === filteredPlants.length ? () => setSelectedPlantIds(new Set()) : selectAllPlants}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    borderRadius: radius.md,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#757575',
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
            gap: '16px 12px',
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
                    borderRadius: radius.xl,
                    backgroundColor: colors.gray100,
                    marginBottom: '8px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                {/* Skeleton Name */}
                <div
                  style={{
                    width: '80%',
                    height: '16px',
                    borderRadius: radius.md,
                    backgroundColor: colors.gray200,
                    marginBottom: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                {/* Skeleton Status */}
                <div
                  style={{
                    width: '60%',
                    height: '14px',
                    borderRadius: radius.md,
                    backgroundColor: colors.gray100,
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
              {isSearching ? (
                // Search icon for no search results
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="26" cy="26" r="14" stroke="#999999" strokeWidth="4" />
                  <path d="M36 36L48 48" stroke="#999999" strokeWidth="4" strokeLinecap="round" />
                  <path d="M20 26H32" stroke="#999999" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                // Plant icon for no plants (either empty or filtered by location)
                <Plant size={60} weight="duotone" color="#999999" />
              )}
            </div>

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
              {isSearching ? (
                <>
                  Tidak ada hasil untuk
                  <br />
                  &quot;{searchQuery}&quot;
                </>
              ) : hasNoPlants ? (
                'Belum ada tanaman'
              ) : (
                'Tidak ada tanaman yang cocok'
              )}
            </p>

            {/* Subtext based on context */}
            <p
              style={{
                marginTop: '8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#757575',
                textAlign: 'center',
                margin: 0,
                marginTop: '8px',
              }}
            >
              {hasNoPlants && !isSearching
                ? 'Ketuk + untuk menambah tanaman pertamamu'
                : 'Coba ubah filter atau tambah tanaman baru'}
            </p>

            {/* Reset Filter button - only show when filtering and plants exist */}
            {!hasNoPlants && (isFilteringLocation || isFilteringStatus || isSearching) && (
              <button
                onClick={() => {
                  setSelectedLocation('Semua');
                  setSelectedStatus('Semua');
                  setSearchQuery('');
                  setShowSearchInput(false);
                }}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: radius.md,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#757575',
                }}
              >
                Reset Filter
              </button>
            )}
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
                    borderRadius: radius.xl,
                    overflow: 'hidden',
                    marginBottom: '8px',
                    backgroundColor: colors.gray100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: isMultiSelectMode && selectedPlantIds.has(plant.id) ? `3px solid ${colors.greenFresh}` : '3px solid transparent',
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
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    lineHeight: typography.lineHeight.normal,
                    color: colors.greenForest,
                    margin: '0 0 2px 0',
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

                {/* Plant Status - Dynamic based on care schedule */}
                <p
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.normal,
                    lineHeight: typography.lineHeight.normal,
                    color: plant.statusColor || colors.gray600,
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
                borderRadius: radius.md,
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
                borderRadius: radius.md,
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
              <DotsThreeVertical size={24} weight="regular" color="#757575" />
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
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              zIndex: 100,
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
          onSavePlant={async (updatedPlant) => {
            // Find location_id from location name
            const locationObj = supabaseLocations.find(loc => loc.name === updatedPlant.location);
            const locationId = locationObj?.id;

            // Build update object
            const updates = {
              customName: updatedPlant.customName || updatedPlant.name,
              notes: updatedPlant.notes,
              photoUrl: updatedPlant.photoUrl,
            };

            if (locationId) {
              updates.locationId = locationId;
            }

            // Save to Supabase
            const result = await updateSupabasePlant(selectedPlant.id, updates);
            return result;
          }}
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
        showStats={showHomeStats}
        onToggleStats={handleToggleStats}
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
          onSave={async (updatedPlant) => {
            // Find location_id from location name
            const locationObj = supabaseLocations.find(loc => loc.name === updatedPlant.location);
            const locationId = locationObj?.id;

            // Build update object
            const updates = {
              customName: updatedPlant.customName || updatedPlant.name,
              notes: updatedPlant.notes,
              photoUrl: updatedPlant.photoUrl,
            };

            // Only include locationId if we found a valid one
            if (locationId) {
              updates.locationId = locationId;
            }

            // Save to Supabase
            const result = await updateSupabasePlant(menuPlant.id, updates);

            if (result.success) {
              setShowEditPlantModal(false);
              setMenuPlant(null);
              showActionToastWithMessage(`${updatedPlant.name || updatedPlant.customName} sudah diperbarui`);
            } else {
              console.error('[Home] Failed to update plant:', result.error);
              showActionToastWithMessage('Gagal menyimpan perubahan');
            }
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
                  color: '#757575',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5',
                }}
              >
                {bulkActionType === 'siram'
                  ? `${selectedPlantIds.size} tanaman akan dicatat sudah disiram hari ini.`
                  : `${selectedPlantIds.size} tanaman akan dicatat sudah diberi pupuk hari ini.`}
              </p>

              {/* Warning for plants already watered today */}
              {bulkActionType === 'siram' && alreadyWateredToday.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FF9800',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    margin: '0 0 20px 0',
                    textAlign: 'left',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#B45309',
                      margin: '0 0 4px 0',
                    }}
                  >
                    ⚠️ {alreadyWateredToday.length} tanaman sudah disiram hari ini:
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      color: '#92400E',
                      margin: 0,
                      lineHeight: '1.4',
                    }}
                  >
                    {alreadyWateredToday.map(p => p.name).join(', ')}
                  </p>
                </div>
              )}

              {/* Spacer when no warning */}
              {!(bulkActionType === 'siram' && alreadyWateredToday.length > 0) && (
                <div style={{ marginBottom: '16px' }} />
              )}

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
                    color: '#757575',
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

      {/* Bulk Fertilize Modal with photo/notes */}
      <BulkFertilizeModal
        isOpen={showBulkFertilizeModal}
        onClose={cancelBulkAction}
        onSubmit={executeBulkFertilize}
        selectedCount={selectedPlantIds.size}
        alreadyFertilizedToday={alreadyFertilizedToday}
        isProcessing={isBulkActioning}
      />

      {/* More Menu Drawer */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 5000,
              }}
            />

            {/* Drawer Container - for centering */}
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
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5l10 10"
                      stroke="#757575"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
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
                    gap: '12px',
                    width: '100%',
                    padding: '12px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: selectedPlantIds.size > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#F0F0F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Drop size={20} weight="regular" color="#757575" />
                  </div>
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
                    gap: '12px',
                    width: '100%',
                    padding: '12px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: selectedPlantIds.size > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#F0F0F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Leaf size={20} weight="regular" color="#757575" />
                  </div>
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

                {/* Pangkas Tanaman */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    showBulkActionConfirmation('pangkas');
                  }}
                  disabled={selectedPlantIds.size === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: selectedPlantIds.size > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#F0F0F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Scissors size={20} weight="regular" color="#757575" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Pangkas Tanaman
                  </span>
                </button>

                {/* Aksi Lainnya */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    showBulkActionConfirmation('lainnya');
                  }}
                  disabled={selectedPlantIds.size === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: selectedPlantIds.size > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#F0F0F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DotsThree size={20} weight="regular" color="#757575" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Aksi Lainnya
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
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#FEF2F2',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash size={20} weight="regular" color="#DC2626" />
                  </div>
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
            </div>
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
                  fontFamily: "'Caveat', cursive",
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
                  color: '#757575',
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
                    color: '#757575',
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
                  color: '#757575',
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
                  stroke="#757575"
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
                  stroke="#757575"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Filter Bottom Sheet */}
      <AnimatePresence>
        {showLocationDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationDropdown(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 5000,
              }}
            />
            {/* Bottom Sheet Container - for centering */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                maxHeight: '70vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '4px',
                    backgroundColor: '#E0E0E0',
                    borderRadius: '2px',
                  }}
                />
              </div>

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#2C2C2C',
                    margin: 0,
                  }}
                >
                  Pilih Lokasi
                </h3>
                <button
                  onClick={() => setShowLocationDropdown(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5l10 10"
                      stroke="#757575"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Options List */}
              <div
                style={{
                  overflowY: 'auto',
                  padding: '8px 0',
                  flex: 1,
                }}
              >
                {/* Semua Lokasi option */}
                <button
                  onClick={() => {
                    setSelectedLocation('Semua');
                    setShowLocationDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    backgroundColor: selectedLocation === 'Semua' ? '#F1F8E9' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: selectedLocation === 'Semua' ? 600 : 400,
                      color: selectedLocation === 'Semua' ? '#2D5016' : '#2C2C2C',
                    }}
                  >
                    Semua Lokasi
                  </span>
                  {selectedLocation === 'Semua' && (
                    <Check size={20} weight="bold" color="#7CB342" />
                  )}
                </button>

                {/* User's locations */}
                {locations.filter(loc => loc !== 'Semua').map((location, index) => (
                  <button
                    key={`loc-option-${index}-${location}`}
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      backgroundColor: selectedLocation === location ? '#F1F8E9' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: selectedLocation === location ? 600 : 400,
                        color: selectedLocation === location ? '#2D5016' : '#2C2C2C',
                      }}
                    >
                      {location}
                    </span>
                    {selectedLocation === location && (
                      <Check size={20} weight="bold" color="#7CB342" />
                    )}
                  </button>
                ))}
              </div>

              {/* Kelola Lokasi Button - Fixed at bottom */}
              <div
                style={{
                  padding: '16px 24px',
                  paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))',
                  borderTop: '1px solid #F0F0F0',
                }}
              >
                <button
                  onClick={() => {
                    setShowLocationDropdown(false);
                    setShowLocationSettings(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: colors.greenFresh,
                    backgroundColor: colors.white,
                    border: `2px solid ${colors.greenFresh}`,
                    borderRadius: radius.lg,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Atur Lokasi Tanam
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Status Filter Bottom Sheet */}
      <AnimatePresence>
        {showStatusDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusDropdown(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 5000,
              }}
            />
            {/* Bottom Sheet Container - for centering */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                maxHeight: '70vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '4px',
                    backgroundColor: '#E0E0E0',
                    borderRadius: '2px',
                  }}
                />
              </div>

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#2C2C2C',
                    margin: 0,
                  }}
                >
                  Pilih Status
                </h3>
                <button
                  onClick={() => setShowStatusDropdown(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5l10 10"
                      stroke="#757575"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Options List */}
              <div
                style={{
                  overflowY: 'auto',
                  padding: '8px 0',
                  paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 16px))',
                }}
              >
                {statusOptions.map((option, index) => (
                  <button
                    key={`status-option-${index}`}
                    onClick={() => {
                      setSelectedStatus(option.value);
                      setShowStatusDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      backgroundColor: selectedStatus === option.value ? '#F1F8E9' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: selectedStatus === option.value ? 600 : 400,
                        color: selectedStatus === option.value ? '#2D5016' : '#2C2C2C',
                      }}
                    >
                      {option.label}
                    </span>
                    {selectedStatus === option.value && (
                      <Check size={20} weight="bold" color="#7CB342" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
