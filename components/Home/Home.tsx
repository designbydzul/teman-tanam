'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
  DotsThree,
  X,
  ChatCircleDots,
  Plus,
  CaretDown,
  GearSix,
  Check,
  Scissors,
  Icon,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { AddPlant, AddPlantForm, AddPlantSuccess, PlantDetail, EditPlant, type AddPlantSpecies } from '@/components/plant';
import { ProfileModal, LocationSettings, NotificationSettings, BulkWateringModal, BulkFertilizeModal, BulkPruningModal, BulkOtherActionModal, OfflineModal, NotificationReminderModal } from '@/components/modals';
import { EditProfile, OfflineIndicator } from '@/components/shared';
import { TanyaTanam } from '@/components/chat';
import { usePlants } from '@/hooks/usePlants';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, typography } from '@/styles/theme';
import { supabase } from '@/lib/supabase';
import { SPECIES_EMOJI_MAP } from '@/lib/constants';
import { createDebugger } from '@/lib/debug';
import type { Plant as PlantType, PlantSpecies, Location, Profile } from '@/types';

const debug = createDebugger('Home');

// Cache key for species (same as AddPlant)
const SPECIES_CACHE_KEY = 'teman-tanam-species-cache';

// Component Props
interface HomeProps {
  userName?: string;
}

// Status option type
interface StatusOption {
  value: string;
  label: string;
}

// Stats data type
interface StatsData {
  label: string;
  value: number;
  Icon: Icon;
}

// Toast message type
interface ToastMessage {
  title: string;
  message: string;
}

// Network status type
type NetworkStatus = 'online' | 'offline' | 'reconnecting';

// Bulk action type
type BulkActionType = 'siram' | 'pupuk' | 'pangkas' | 'lainnya' | null;

// New plant data type (for add flow)
interface NewPlantData {
  id?: string;
  customName?: string;
  species?: AddPlantSpecies | null;
  location?: string;
  startedDate?: Date | string;
  photoPreview?: string | null;
  notes?: string;
}

const Home: React.FC<HomeProps> = ({ userName }) => {
  // URL search params for toast messages from other pages
  const searchParams = useSearchParams();

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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);

  // Use Supabase data if available, otherwise fall back to empty array
  const plants = supabasePlants || [];
  // Note: Plant updates are done via usePlants hook (addSupabasePlant, deleteSupabasePlant, etc.)

  // Add Plant flow state
  const [showAddPlant, setShowAddPlant] = useState<boolean>(false);
  const [showAddPlantForm, setShowAddPlantForm] = useState<boolean>(false);
  const [selectedSpecies, setSelectedSpecies] = useState<AddPlantSpecies | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [newPlantData, setNewPlantData] = useState<NewPlantData | null>(null);

  // WhatsApp setup state (shown after first plant is added)
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState<boolean>(false);
  const [wasFirstPlant, setWasFirstPlant] = useState<boolean>(false);

  // Plant Detail state
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null);
  const [showPlantDetail, setShowPlantDetail] = useState<boolean>(false);

  // Profile Modal state
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Stats visibility preference (synced with database, localStorage as fallback)
  const [showHomeStats, setShowHomeStats] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showHomeStats');
      return saved !== null ? JSON.parse(saved) : false; // Default: hide stats
    }
    return false;
  });

  // Sync showHomeStats with profile from database when it loads
  useEffect(() => {
    if (profile?.show_statistics !== undefined) {
      setShowHomeStats(profile.show_statistics);
      // Also update localStorage to keep it in sync
      localStorage.setItem('showHomeStats', JSON.stringify(profile.show_statistics));
    }
  }, [profile?.show_statistics]);

  // Helper to safely get timestamp from date (handles both Date objects and strings from cache)
  const getTimestamp = (date: Date | string | null | undefined): number | null => {
    if (!date) return null;
    if (date instanceof Date) return date.getTime();
    // Handle string dates from cache
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  };

  // Sync selectedPlant with plants array when plants update (e.g., after recording an action)
  useEffect(() => {
    if (selectedPlant && plants.length > 0) {
      const updatedPlant = plants.find(p => p.id === selectedPlant.id);
      if (updatedPlant) {
        // Only update if there are actual changes to avoid unnecessary re-renders
        const hasChanges =
          getTimestamp(updatedPlant.lastWatered) !== getTimestamp(selectedPlant.lastWatered) ||
          getTimestamp(updatedPlant.lastFertilized) !== getTimestamp(selectedPlant.lastFertilized) ||
          updatedPlant.wateringStatus?.status !== selectedPlant.wateringStatus?.status ||
          updatedPlant.fertilizingStatus?.status !== selectedPlant.fertilizingStatus?.status;

        if (hasChanges) {
          setSelectedPlant(updatedPlant);
        }
      }
    }
  }, [plants, selectedPlant]);

  // Location Settings state
  const [showLocationSettings, setShowLocationSettings] = useState<boolean>(false);

  // Notification Settings state
  const [showNotificationSettings, setShowNotificationSettings] = useState<boolean>(false);

  // Edit Profile state
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [offlineFeatureName, setOfflineFeatureName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>(userName || '');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);


  // Long press and menu state
  const [menuPlant, setMenuPlant] = useState<PlantType | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Multi-select state for bulk actions
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState<Set<string>>(new Set());
  const [isBulkActioning, setIsBulkActioning] = useState<boolean>(false);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<BulkActionType>(null);
  const [alreadyWateredToday, setAlreadyWateredToday] = useState<PlantType[]>([]); // Plants already watered today
  const [alreadyFertilizedToday, setAlreadyFertilizedToday] = useState<PlantType[]>([]); // Plants already fertilized today
  const [alreadyPrunedToday, setAlreadyPrunedToday] = useState<PlantType[]>([]); // Plants already pruned today
  const [showBulkWateringModal, setShowBulkWateringModal] = useState<boolean>(false); // Watering modal with photo/notes
  const [showBulkFertilizeModal, setShowBulkFertilizeModal] = useState<boolean>(false); // Fertilize modal with photo/notes
  const [showBulkPruningModal, setShowBulkPruningModal] = useState<boolean>(false); // Pruning modal with photo/notes
  const [showBulkOtherActionModal, setShowBulkOtherActionModal] = useState<boolean>(false); // Other action modal

  // Edit plant from menu
  const [showEditPlantModal, setShowEditPlantModal] = useState<boolean>(false);

  // Tanya Tanam from menu
  const [showTanyaTanamModal, setShowTanyaTanamModal] = useState<boolean>(false);

  // Delete confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [plantToDelete, setPlantToDelete] = useState<PlantType | null>(null);
  const [plantsToDelete, setPlantsToDelete] = useState<PlantType[]>([]); // For bulk delete

  // Network status state
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [showNetworkToast, setShowNetworkToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage>({ title: '', message: '' });
  const reconnectingTimer = useRef<NodeJS.Timeout | null>(null);

  // Track failed plant images to show fallback
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  // Track failed species images to show fallback emoji
  const [failedSpeciesImages, setFailedSpeciesImages] = useState<Set<string>>(new Set());

  // Action toast state (for watering, fertilizing, plant actions, etc.)
  const [showActionToast, setShowActionToast] = useState<boolean>(false);
  const [actionToastMessage, setActionToastMessage] = useState<string>('');
  const actionToastTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper function to show action toast
  const showActionToastWithMessage = (message: string): void => {
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
    const showToast = (title: string, message: string): void => {
      setToastMessage({ title, message });
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 3000);
    };

    const handleOnline = (): void => {
      // Clear any reconnecting timer
      if (reconnectingTimer.current) {
        clearTimeout(reconnectingTimer.current);
        reconnectingTimer.current = null;
      }
      setNetworkStatus('online');
      showToast('Kembali online', 'Yeay! Koneksi kamu udah balik~');
    };

    const handleOffline = (): void => {
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

  // Handle toast messages from URL params (e.g., from notifikasi page)
  useEffect(() => {
    const toastParam = searchParams.get('toast');
    if (toastParam === 'notifikasi-saved') {
      // Show success toast for notification settings
      setToastMessage({ title: 'Pengaturan notifikasi berhasil disimpan', message: '' });
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 3000);

      // Clear the URL param without causing a re-render/navigation
      window.history.replaceState({}, '', '/');
    } else if (toastParam === 'lokasi-saved') {
      // Show success toast for location settings
      setToastMessage({ title: 'Lokasi berhasil disimpan', message: '' });
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 3000);

      // Clear the URL param without causing a re-render/navigation
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  // Background cache species data for offline use
  // This runs silently when the app loads so users can add plants offline
  useEffect(() => {
    const cacheSpeciesData = async () => {
      // Only cache if online
      if (!navigator.onLine) return;

      // Check if already cached
      try {
        const cached = localStorage.getItem(SPECIES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            debug.log(`[Cache] Species already cached: ${parsed.length} items`);
            return;
          }
        }
      } catch {
        // Continue to fetch if cache read fails
      }

      // Fetch and cache species data
      try {
        debug.log('[Cache] Fetching species data for offline cache...');
        const { data, error } = await supabase
          .from('plant_species')
          .select('id, common_name, latin_name, category, image_url')
          .order('common_name', { ascending: true });

        if (error) {
          debug.warn('[Cache] Failed to fetch species:', error.message);
          return;
        }

        if (data && data.length > 0) {
          // Transform to same format as AddPlant
          const transformed = data.map(s => ({
            id: s.id,
            name: s.common_name,
            scientific: s.latin_name,
            category: s.category,
            imageUrl: s.image_url,
            emoji: SPECIES_EMOJI_MAP[s.common_name.toLowerCase()] || '🌱',
          }));

          localStorage.setItem(SPECIES_CACHE_KEY, JSON.stringify(transformed));
          debug.log(`[Cache] Species data cached for offline use: ${transformed.length} items`);
        }
      } catch (err) {
        debug.warn('[Cache] Error caching species:', err);
      }
    };

    // Run after a short delay to not block initial render
    const timer = setTimeout(cacheSpeciesData, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Reload locations when returning from LocationSettings
  const handleLocationSettingsClose = (): void => {
    setShowLocationSettings(false);
    // Refetch locations from Supabase
    refetchLocations();
    // Reset to 'Semua' if current selection was deleted
    if (!supabaseLocationNames.includes(selectedLocation)) {
      setSelectedLocation('Semua');
    }
  };

  // Close NotificationSettings
  const handleNotificationSettingsClose = (): void => {
    setShowNotificationSettings(false);
  };

  // Status filter options
  const statusOptions: StatusOption[] = [
    { value: 'Semua', label: 'Semua Status' },
    { value: 'Perlu disiram', label: 'Perlu disiram' },
    { value: 'Perlu dipupuk', label: 'Perlu dipupuk' },
    { value: 'Terawat', label: 'Terawat' },
    { value: 'Siap dipanen', label: 'Siap dipanen' },
  ];

  // Filter plants based on search, location, and status (memoized for performance)
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
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
  }, [plants, searchQuery, selectedLocation, selectedStatus]);

  const showEmptyState = filteredPlants.length === 0;
  const hasNoPlants = plants.length === 0;
  const isSearching = searchQuery.trim().length > 0;
  const isFilteringLocation = selectedLocation !== 'Semua';
  const isFilteringStatus = selectedStatus !== 'Semua';

  // Search expand state
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);

  // Calculate urgent status counts for summary line
  const urgentStatusCounts = useMemo(() => {
    const counts = {
      perluDisiram: 0,
      perluDipupuk: 0,
      terawat: 0,
    };

    plants.forEach(plant => {
      if (plant.status === 'Perlu disiram') {
        counts.perluDisiram++;
      } else if (plant.status === 'Perlu dipupuk') {
        counts.perluDipupuk++;
      } else if (plant.status === 'Terawat' || plant.status === 'Baik Baik Saja') {
        counts.terawat++;
      }
    });

    return counts;
  }, [plants]);

  // Get most urgent status message (priority order: disiram > dipupuk)
  const urgentSummary = useMemo(() => {
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
    return null; // No urgent status, hide the line
  }, [urgentStatusCounts]);

  // Stats cards calculation
  const statsData: StatsData[] = useMemo(() => {
    const totalPlants = plants.length;
    const needsWatering = urgentStatusCounts.perluDisiram;
    const needsFertilizing = urgentStatusCounts.perluDipupuk;
    const terawatCount = urgentStatusCounts.terawat;

    return [
      { label: 'Tanaman', value: totalPlants, Icon: Plant },
      { label: 'Penyiraman', value: needsWatering, Icon: Drop },
      { label: 'Pemupukan', value: needsFertilizing, Icon: Leaf },
      { label: 'Terawat', value: terawatCount, Icon: Check },
    ];
  }, [plants.length, urgentStatusCounts]);

  // Multi-select handlers
  const togglePlantSelection = (plantId: string): void => {
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

  const selectAllPlants = (): void => {
    setSelectedPlantIds(new Set(filteredPlants.map(p => p.id)));
  };

  const exitMultiSelectMode = (): void => {
    setIsMultiSelectMode(false);
    setSelectedPlantIds(new Set());
  };

  // Helper to check if a date is today
  const isToday = (date: Date | string | null | undefined): boolean => {
    if (!date) return false;
    const today = new Date();
    const checkDate = new Date(date);
    return today.getFullYear() === checkDate.getFullYear() &&
           today.getMonth() === checkDate.getMonth() &&
           today.getDate() === checkDate.getDate();
  };

  // Show confirmation modal before bulk action
  const showBulkActionConfirmation = (actionType: BulkActionType): void => {
    if (selectedPlantIds.size === 0 || !actionType) {
      showActionToastWithMessage('Pilih tanaman terlebih dahulu');
      return;
    }

    // Get selected plants
    const selectedPlants = plants.filter(p => selectedPlantIds.has(p.id));

    if (actionType === 'siram') {
      // Check for plants already watered today
      const wateredToday = selectedPlants.filter(p => isToday(p.lastWatered));
      setAlreadyWateredToday(wateredToday);
      // Open watering modal instead of confirmation
      setBulkActionType(actionType);
      setShowBulkWateringModal(true);
    } else if (actionType === 'pupuk') {
      // Check for plants already fertilized today
      const fertilizedToday = selectedPlants.filter(p => isToday(p.lastFertilized));
      setAlreadyFertilizedToday(fertilizedToday);
      // Open fertilize modal instead of confirmation
      setBulkActionType(actionType);
      setShowBulkFertilizeModal(true);
    } else if (actionType === 'pangkas') {
      // Check for plants already pruned today
      const prunedToday = selectedPlants.filter(p => isToday((p as any).lastPruned));
      setAlreadyPrunedToday(prunedToday);
      // Open pruning modal instead of confirmation
      setBulkActionType(actionType);
      setShowBulkPruningModal(true);
    } else if (actionType === 'lainnya') {
      // Open other action modal
      setBulkActionType(actionType);
      setShowBulkOtherActionModal(true);
    }
  };

  // Execute bulk action after confirmation
  const executeBulkAction = async (): Promise<void> => {
    if (selectedPlantIds.size === 0 || !bulkActionType) return;

    setShowBulkActionConfirm(false);
    setIsBulkActioning(true);

    // Record action for each selected plant
    let successCount = 0;
    let failCount = 0;

    for (const plantId of selectedPlantIds) {
      const result = await recordAction(plantId, bulkActionType as 'siram' | 'pupuk' | 'pangkas' | 'lainnya');
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkActioning(false);

    // Show result toast
    const getActionLabel = (): string => {
      switch (bulkActionType) {
        case 'siram': return 'disiram';
        case 'pupuk': return 'dipupuk';
        case 'pangkas': return 'dipangkas';
        default: return 'diproses';
      }
    };
    const getEmoji = (): string => {
      switch (bulkActionType) {
        case 'siram': return '💧';
        case 'pupuk': return '🌿';
        case 'pangkas': return '✂️';
        default: return '✅';
      }
    };
    const actionLabel = getActionLabel();
    const emoji = getEmoji();
    if (failCount === 0) {
      showActionToastWithMessage(`${successCount} tanaman sudah ${actionLabel}! ${emoji}`);
    } else {
      showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal ${actionLabel}`);
    }

    // Exit multi-select mode
    setBulkActionType(null);
    setAlreadyPrunedToday([]);
    exitMultiSelectMode();
  };

  const cancelBulkAction = (): void => {
    setShowBulkActionConfirm(false);
    setShowBulkWateringModal(false);
    setShowBulkFertilizeModal(false);
    setShowBulkPruningModal(false);
    setShowBulkOtherActionModal(false);
    setBulkActionType(null);
    setAlreadyWateredToday([]);
    setAlreadyFertilizedToday([]);
    setAlreadyPrunedToday([]);
  };

  // Execute bulk watering with notes and photo
  const executeBulkWatering = async ({ notes, photoFile }: { notes?: string; photoFile?: File | null }): Promise<void> => {
    if (selectedPlantIds.size === 0) return;

    setIsBulkActioning(true);

    let successCount = 0;
    let failCount = 0;

    for (const plantId of selectedPlantIds) {
      // Only pass photo for first plant to avoid duplicate uploads
      const result = await recordAction(plantId, 'siram', notes || null, successCount === 0 ? photoFile : null);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkActioning(false);
    setShowBulkWateringModal(false);

    // Show result toast
    if (failCount === 0) {
      showActionToastWithMessage(`${successCount} tanaman sudah disiram!`);
    } else {
      showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal disiram`);
    }

    // Exit multi-select mode and cleanup
    setBulkActionType(null);
    setAlreadyWateredToday([]);
    exitMultiSelectMode();
  };

  // Execute bulk fertilize with notes and photo
  const executeBulkFertilize = async ({ notes, photoFile }: { notes?: string; photoFile?: File | null }): Promise<void> => {
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

  // Execute bulk pruning with notes and photo
  const executeBulkPruning = async ({ notes, photoFile }: { notes?: string; photoFile?: File | null }): Promise<void> => {
    if (selectedPlantIds.size === 0) return;

    setIsBulkActioning(true);

    let successCount = 0;
    let failCount = 0;

    for (const plantId of selectedPlantIds) {
      // Only pass photo for first plant to avoid duplicate uploads
      const result = await recordAction(plantId, 'pangkas', notes || null, successCount === 0 ? photoFile : null);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkActioning(false);
    setShowBulkPruningModal(false);

    // Show result toast
    if (failCount === 0) {
      showActionToastWithMessage(`${successCount} tanaman sudah dipangkas!`);
    } else {
      showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal`);
    }

    // Exit multi-select mode and cleanup
    setBulkActionType(null);
    setAlreadyPrunedToday([]);
    exitMultiSelectMode();
  };

  // Execute bulk other action with custom name, notes and photo
  const executeBulkOtherAction = async ({ actionName, notes, photoFile }: { actionName: string; notes?: string; photoFile?: File | null }): Promise<void> => {
    if (selectedPlantIds.size === 0 || !actionName.trim()) return;

    setIsBulkActioning(true);

    let successCount = 0;
    let failCount = 0;

    for (const plantId of selectedPlantIds) {
      // Use the custom action name in notes with [ActionName] format, followed by any additional notes
      const fullNotes = notes ? `[${actionName.trim()}] ${notes}` : `[${actionName.trim()}]`;
      // Only pass photo for first plant to avoid duplicate uploads
      const result = await recordAction(plantId, 'lainnya', fullNotes, successCount === 0 ? photoFile : null);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkActioning(false);
    setShowBulkOtherActionModal(false);

    // Show result toast
    if (failCount === 0) {
      showActionToastWithMessage(`${successCount} tanaman sudah dicatat ${actionName}!`);
    } else {
      showActionToastWithMessage(`${successCount} berhasil, ${failCount} gagal`);
    }

    // Exit multi-select mode and cleanup
    setBulkActionType(null);
    exitMultiSelectMode();
  };

  // Add Plant flow handlers
  const handleAddPlantClick = (): void => {
    setShowAddPlant(true);
  };

  const handleSelectSpecies = (species: AddPlantSpecies): void => {
    setSelectedSpecies(species);
    setShowAddPlantForm(true);
    // Keep showAddPlant true so it stays visible behind the form modal
  };

  const handleFormSubmit = async (plantData: any): Promise<void> => {
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
    // species_id is now the real UUID from Supabase plant_species table
    const supabaseData = {
      customName: plantData.customName,
      name: plantData.customName || plantData.species?.name || 'Tanaman',
      speciesId: plantData.species?.id || null, // Real UUID from Supabase
      speciesName: plantData.species?.name || null, // Store species name for emoji lookup
      speciesEmoji: plantData.species?.emoji || '🌱', // Store emoji directly
      locationId: locationId,
      notes: plantData.notes || '',
      startedDate: plantData.customDate || new Date().toISOString(),
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
      // Track if this was the user's first plant (for WhatsApp setup prompt)
      const isFirstPlant = plants.length === 0;
      setWasFirstPlant(isFirstPlant);

      setNewPlantData(dataWithPhoto);
      setShowAddPlantForm(false);
      setShowSuccess(true);
    } else {
      // Show error toast or alert
      console.error('[Home] Failed to add plant:', result.error);
      alert(`Gagal menambah tanaman: ${result.error}`);
    }
  };

  // Check if should show WhatsApp setup (first plant and not shown/skipped before)
  const shouldShowWhatsAppSetup = (): boolean => {
    if (!wasFirstPlant) return false;
    if (typeof window === 'undefined') return false;

    // Check if user has already seen/skipped WhatsApp setup
    const hasSeenSetup = localStorage.getItem('whatsapp_setup_shown');
    return !hasSeenSetup;
  };

  // Handle closing WhatsApp setup (complete or skip)
  const handleWhatsAppSetupDone = (): void => {
    // Mark as shown so we don't show again
    localStorage.setItem('whatsapp_setup_shown', 'true');
    setShowWhatsAppSetup(false);
    setWasFirstPlant(false);
  };

  const handleViewDetails = (): void => {
    // Find the newly created plant and show its details
    if (newPlantData) {
      // Create a plant object that matches what PlantDetail expects
      const plantForDetail: any = {
        id: newPlantData.id,
        name: newPlantData.customName,
        customName: newPlantData.customName,
        species: newPlantData.species,
        location: newPlantData.location,
        startedDate: newPlantData.startedDate || new Date(),
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

    // Check if should show WhatsApp setup after viewing details
    if (shouldShowWhatsAppSetup()) {
      setShowWhatsAppSetup(true);
    }
  };

  const handleAddNew = (): void => {
    // Check if should show WhatsApp setup before adding another plant
    if (shouldShowWhatsAppSetup()) {
      setShowSuccess(false);
      setShowWhatsAppSetup(true);
    } else {
      setShowSuccess(false);
      setShowAddPlant(true);
      setSelectedSpecies(null);
      setNewPlantData(null);
    }
  };

  const handleBackHome = (): void => {
    // Check if should show WhatsApp setup before going home
    if (shouldShowWhatsAppSetup()) {
      setShowSuccess(false);
      setShowWhatsAppSetup(true);
    } else {
      setShowSuccess(false);
      setShowAddPlant(false);
      setSelectedSpecies(null);
      setNewPlantData(null);
    }
  };

  // Long press handlers for plant cards
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isLongPressValid = useRef(true);
  const longPressTriggered = useRef(false);

  const handleLongPressStart = (plant: PlantType, e: React.TouchEvent | React.MouseEvent): void => {
    // Don't start long press timer if already in multi-select mode
    if (isMultiSelectMode) return;

    // Prevent default to avoid text selection on long press
    if ('cancelable' in e && e.cancelable) {
      e.preventDefault();
    }

    // Store initial touch position
    if ('touches' in e) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStartPos.current = { x: e.clientX, y: e.clientY };
    }
    isLongPressValid.current = true;
    longPressTriggered.current = false;

    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(() => {
      if (isLongPressValid.current) {
        longPressTriggered.current = true;
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        // Enter multi-select mode and select this plant
        setIsMultiSelectMode(true);
        setSelectedPlantIds(new Set([plant.id]));
      }
    }, 400); // 400ms for long press - slightly longer for better reliability
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!longPressTimer.current) return;

    // Check if user moved more than 8px (scrolling) - reduced threshold
    const touch = e.touches?.[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    if (deltaX > 8 || deltaY > 8) {
      // User is scrolling, cancel long press
      isLongPressValid.current = false;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleLongPressEnd = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPressValid.current = false;
  };

  // Check if long press was triggered (to prevent click after long press)
  const wasLongPressTriggered = (): boolean => {
    const triggered = longPressTriggered.current;
    longPressTriggered.current = false;
    return triggered;
  };

  // Handle confirmed delete from modal
  const handleConfirmDelete = async (): Promise<void> => {
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
  const handlePlantClick = (plant: PlantType): void => {
    // In multi-select mode, toggle selection
    if (isMultiSelectMode) {
      togglePlantSelection(plant.id);
      return;
    }

    // Don't navigate if long press was just triggered
    if (wasLongPressTriggered()) {
      return;
    }

    // Only navigate if not in long press
    if (!longPressTimer.current) {
      setSelectedPlant(plant);
      setShowPlantDetail(true);
    }
  };

  const handlePlantDetailBack = (): void => {
    setShowPlantDetail(false);
    setSelectedPlant(null);
  };

  const handlePlantEdit = (plant: PlantType): void => {
    // Close plant detail and open edit modal
    setShowPlantDetail(false);
    setMenuPlant(plant);
    setShowEditPlantModal(true);
  };

  const handlePlantDelete = async (plantId: string): Promise<void> => {
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
  const handleProfileNavigation = (action: string): void => {
    if (action === 'location-settings') {
      setShowLocationSettings(true);
    } else if (action === 'notification-settings') {
      setShowNotificationSettings(true);
    } else if (action === 'edit-profile') {
      // Check if online before allowing edit profile
      if (!isOnline) {
        setOfflineFeatureName('Edit Profil');
        setShowOfflineModal(true);
        return;
      }
      setShowEditProfile(true);
    }
  };

  // Handle stats toggle from ProfileModal - save to database and localStorage
  const handleToggleStats = async (value: boolean): Promise<void> => {
    // Update local state immediately for responsive UI
    setShowHomeStats(value);

    // Save to database (also updates localStorage as fallback)
    await updateShowStatistics(value);
  };

  // Handle profile save
  const handleProfileSave = (profileData: { name: string; email: string; photo?: string | null }): void => {
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
            <motion.button
              whileTap={{ scale: 0.95 }}
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
            </motion.button>

            {/* Profile Menu Button (Grid Icon) - Opens Profile Modal */}
            <motion.button
              whileTap={{ scale: 0.95 }}
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
            </motion.button>
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
            {statsData.map((stat) => (
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
          <motion.button
            whileTap={{ scale: 0.95 }}
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
          </motion.button>

          {/* Status Dropdown Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
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
          </motion.button>

          {/* Spacer to push search to right */}
          <div style={{ flex: 1 }} />

          {/* Search Icon Button - Toggle search input */}
          <motion.button
            whileTap={{ scale: 0.95 }}
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
          </motion.button>
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
              <div style={{ padding: '16px 24px' }}>
                <div
                  style={{
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
                    type="text"
                    placeholder="Cari tanaman..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    autoFocus
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
                    onClick={() => {
                      if (searchQuery) {
                        setSearchQuery('');
                      } else {
                        setShowSearchInput(false);
                      }
                    }}
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
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
                </motion.button>
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
                  className="skeleton-pulse"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: radius.xl,
                    backgroundColor: '#E8E8E8',
                    marginBottom: '8px',
                  }}
                />
                {/* Skeleton Name */}
                <div
                  className="skeleton-pulse"
                  style={{
                    width: '80%',
                    height: '16px',
                    borderRadius: radius.md,
                    backgroundColor: '#E8E8E8',
                    marginBottom: '4px',
                  }}
                />
                {/* Skeleton Status */}
                <div
                  className="skeleton-pulse"
                  style={{
                    width: '60%',
                    height: '14px',
                    borderRadius: radius.md,
                    backgroundColor: '#E8E8E8',
                  }}
                />
              </div>
            ))}
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
              }}
            >
              {hasNoPlants && !isSearching
                ? 'Ketuk + untuk menambah tanaman pertamamu'
                : 'Coba ubah filter atau tambah tanaman baru'}
            </p>

            {/* Reset Filter button - only show when filtering and plants exist */}
            {!hasNoPlants && (isFilteringLocation || isFilteringStatus || isSearching) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
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
                whileTap={{ scale: 0.95 }}
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
                    /* User photo - show only the photo, no species illustration overlay */
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
                  ) : plant.species?.imageUrl && !failedSpeciesImages.has(plant.species.id || '') ? (
                    /* Show species image as main image when no plant photo */
                    <img
                      src={plant.species.imageUrl}
                      alt={plant.species.name || plant.name}
                      style={{
                        width: '70%',
                        height: '70%',
                        objectFit: 'contain',
                      }}
                      onError={() => {
                        setFailedSpeciesImages(prev => new Set(prev).add(plant.species?.id || ''));
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

      {/* Multi-Select Action Bar - Bottom with Batal left, 4 actions center, Hapus right */}
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
              borderTop: '1px solid #E4E4E7',
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 100,
            }}
          >
            {/* LEFT - Batal (Cancel) Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedPlantIds(new Set());
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                backgroundColor: '#F5F5F5',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={20} weight="regular" color="#757575" />
            </motion.button>

            {/* CENTER - 4 Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* Siram (Water) Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => showBulkActionConfirmation('siram')}
                disabled={selectedPlantIds.size === 0 || isBulkActioning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                  opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  padding: 0,
                }}
              >
                <Drop size={20} weight="regular" color="#757575" />
              </motion.button>

              {/* Pupuk (Fertilize) Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => showBulkActionConfirmation('pupuk')}
                disabled={selectedPlantIds.size === 0 || isBulkActioning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                  opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  padding: 0,
                }}
              >
                <Leaf size={20} weight="regular" color="#757575" />
              </motion.button>

              {/* Pangkas (Prune) Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => showBulkActionConfirmation('pangkas')}
                disabled={selectedPlantIds.size === 0 || isBulkActioning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                  opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  padding: 0,
                }}
              >
                <Scissors size={20} weight="regular" color="#757575" />
              </motion.button>

              {/* Lainnya (Other) Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => showBulkActionConfirmation('lainnya')}
                disabled={selectedPlantIds.size === 0 || isBulkActioning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                  opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                  padding: 0,
                }}
              >
                <DotsThree size={20} weight="bold" color="#757575" />
              </motion.button>
            </div>

            {/* RIGHT - Hapus (Delete) Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (selectedPlantIds.size === 0) return;
                // Get selected plants for deletion
                const selectedPlantsList = plants.filter(p => selectedPlantIds.has(p.id));
                setPlantsToDelete(selectedPlantsList);
                setShowDeleteConfirmModal(true);
              }}
              disabled={selectedPlantIds.size === 0 || isBulkActioning}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                backgroundColor: '#FEE2E2',
                border: 'none',
                borderRadius: '50%',
                cursor: selectedPlantIds.size > 0 && !isBulkActioning ? 'pointer' : 'not-allowed',
                opacity: selectedPlantIds.size === 0 ? 0.5 : 1,
                padding: 0,
              }}
            >
              <Trash size={20} weight="regular" color="#DC2626" />
            </motion.button>
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
            <motion.button
              whileTap={{ scale: 0.95 }}
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
            </motion.button>
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
          onSavePlant={async (updatedPlant: any) => {
            // Find location_id from location name
            const locationObj = supabaseLocations.find(loc => loc.name === updatedPlant.location);
            const locationId = locationObj?.id;

            // Build update object
            const updates: any = {
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
          onLocationDeleted={(locationName: string) => {
            showActionToastWithMessage(`Lokasi ${locationName} sudah dihapus`);
          }}
          onLocationAdded={(locationName: string) => {
            showActionToastWithMessage(`Lokasi ${locationName} sudah ditambahkan`);
          }}
          plants={plants}
          onPlantsUpdated={() => {
            // Refetch plants from Supabase after location changes
            refetchPlants();
          }}
        />
      )}

      {/* Notification Settings */}
      {showNotificationSettings && (
        <NotificationSettings
          onBack={handleNotificationSettingsClose}
          onSuccess={(message: string) => {
            showActionToastWithMessage(message);
          }}
        />
      )}

      {/* Notification Reminder Modal (shown after first plant) */}
      <NotificationReminderModal
        isOpen={showWhatsAppSetup}
        onClose={handleWhatsAppSetupDone}
        onSuccess={() => {
          // Show success toast
          showActionToastWithMessage('Reminder berhasil diaktifkan!');
        }}
      />

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

      {/* Offline Modal - for features that require internet */}
      <OfflineModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        featureName={offlineFeatureName}
      />

      {/* Edit Plant Modal from menu */}
      {showEditPlantModal && menuPlant && (
        <EditPlant
          plant={menuPlant}
          onClose={() => {
            setShowEditPlantModal(false);
            setMenuPlant(null);
          }}
          onSave={async (updatedPlant: any) => {
            // Find location_id from location name
            const locationObj = supabaseLocations.find(loc => loc.name === updatedPlant.location);
            const locationId = locationObj?.id;

            // Build update object
            const updates: any = {
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

      {/* Bulk Watering Modal with photo/notes */}
      <BulkWateringModal
        isOpen={showBulkWateringModal}
        onClose={cancelBulkAction}
        onSubmit={executeBulkWatering}
        selectedPlants={plants.filter(p => selectedPlantIds.has(p.id))}
        alreadyWateredToday={alreadyWateredToday}
        isProcessing={isBulkActioning}
      />

      {/* Bulk Fertilize Modal with photo/notes */}
      <BulkFertilizeModal
        isOpen={showBulkFertilizeModal}
        onClose={cancelBulkAction}
        onSubmit={executeBulkFertilize}
        selectedPlants={plants.filter(p => selectedPlantIds.has(p.id))}
        alreadyFertilizedToday={alreadyFertilizedToday}
        isProcessing={isBulkActioning}
      />

      {/* Bulk Pruning Modal with photo/notes */}
      <BulkPruningModal
        isOpen={showBulkPruningModal}
        onClose={cancelBulkAction}
        onSubmit={executeBulkPruning}
        selectedPlants={plants.filter(p => selectedPlantIds.has(p.id))}
        alreadyPrunedToday={alreadyPrunedToday}
        isProcessing={isBulkActioning}
      />

      {/* Bulk Other Action Modal with photo/notes */}
      <BulkOtherActionModal
        isOpen={showBulkOtherActionModal}
        onClose={cancelBulkAction}
        onSubmit={executeBulkOtherAction}
        selectedPlants={plants.filter(p => selectedPlantIds.has(p.id))}
        isProcessing={isBulkActioning}
      />

      {/* Delete Confirmation Modal - Bottom Drawer Style */}
      <AnimatePresence>
        {showDeleteConfirmModal && (plantToDelete || plantsToDelete.length > 0) && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setPlantToDelete(null);
                setPlantsToDelete([]);
              }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 5000,
              }}
            />

            {/* Modal Container - Bottom drawer */}
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
                  borderRadius: '12px 12px 0 0',
                  padding: '24px',
                  paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: '1.75rem',
                      fontWeight: 600,
                      color: '#DC2626',
                      margin: 0,
                    }}
                  >
                    Hapus Tanaman
                  </h2>
                  <button
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setPlantToDelete(null);
                      setPlantsToDelete([]);
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
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
                        stroke="#757575"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Selected plants info */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#DC2626',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {plantsToDelete.length > 0
                      ? `${plantsToDelete.length} tanaman akan dihapus:`
                      : '1 tanaman akan dihapus:'
                    }
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#DC2626',
                      margin: 0,
                      lineHeight: '1.4',
                    }}
                  >
                    {plantsToDelete.length > 0
                      ? plantsToDelete.length <= 5
                        ? plantsToDelete.map(p => p.name).join(', ')
                        : `${plantsToDelete.slice(0, 5).map(p => p.name).join(', ')}, dan ${plantsToDelete.length - 5} lainnya`
                      : plantToDelete?.name
                    }
                  </p>
                </div>

                {/* Warning message */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      color: '#92400E',
                      margin: 0,
                      lineHeight: '1.4',
                    }}
                  >
                    Aksi ini tidak bisa dibatalkan. Semua data dan riwayat perawatan tanaman akan dihapus permanen.
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setPlantToDelete(null);
                      setPlantsToDelete([]);
                    }}
                    style={{
                      flex: 1,
                      padding: '16px',
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
                      padding: '16px',
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
            </div>
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
                    color: colors.greenForest,
                    backgroundColor: colors.white,
                    border: `1.5px solid ${colors.greenForest}`,
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
