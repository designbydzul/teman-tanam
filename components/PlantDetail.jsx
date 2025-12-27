import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, isToday, startOfDay } from 'date-fns';
import {
  Drop,
  Leaf,
  FirstAidKit,
  Camera,
  ArrowLeft,
  DotsThree,
  PencilSimple,
  Trash,
  Plant,
  X,
  ChatCircle,
  Scissors,
  Basket,
  CheckCircle,
  Plus,
  Image as ImageIcon,
  ArrowCounterClockwise,
  Gear,
  ChatDots,
} from '@phosphor-icons/react';
import TanyaTanam from './TanyaTanam';
import EditPlant from './EditPlant';
import OfflineModal from './OfflineModal';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import { supabase } from '@/lib/supabase/client';

// Helper to validate UUID format
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const PlantDetail = ({ plant, onBack, onEdit, onDelete, onRecordAction, onSavePlant }) => {
  // Online status for offline handling
  const { isOnline } = useOnlineStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const [activeTab, setActiveTab] = useState('perawatan');
  const [showMenu, setShowMenu] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [timelinePhotoPreview, setTimelinePhotoPreview] = useState(null); // URL for timeline photo fullscreen
  const [showTanyaTanam, setShowTanyaTanam] = useState(false);
  const [showEditPlant, setShowEditPlant] = useState(false);
  const [currentPlantData, setCurrentPlantData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [speciesImageError, setSpeciesImageError] = useState(false);
  const containerRef = useRef(null);

  // Toast state for actions
  const [showActionToast, setShowActionToast] = useState(false);
  const [actionToastMessage, setActionToastMessage] = useState('');

  // Actions history state
  const [actionsHistory, setActionsHistory] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  // Local override for last action dates (updated after logging actions)
  const [lastActionOverrides, setLastActionOverrides] = useState({
    lastWatered: null,
    lastFertilized: null,
  });

  // Care action drawers state
  const [showWateringDrawer, setShowWateringDrawer] = useState(false);
  const [showFertilizingDrawer, setShowFertilizingDrawer] = useState(false);
  const [fertilizingNotes, setFertilizingNotes] = useState('');
  const [fertilizingPhoto, setFertilizingPhoto] = useState(null);
  const [fertilizingPhotoPreview, setFertilizingPhotoPreview] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const fertilizingPhotoInputRef = useRef(null);

  // Pruning drawer state
  const [showPruningDrawer, setShowPruningDrawer] = useState(false);
  const [pruningNotes, setPruningNotes] = useState('');
  const [pruningPhoto, setPruningPhoto] = useState(null);
  const [pruningPhotoPreview, setPruningPhotoPreview] = useState(null);
  const pruningPhotoInputRef = useRef(null);

  // Other action drawer state
  const [showOtherActionDrawer, setShowOtherActionDrawer] = useState(false);
  const [otherActionName, setOtherActionName] = useState('');
  const [otherActionNotes, setOtherActionNotes] = useState('');
  const [otherActionPhoto, setOtherActionPhoto] = useState(null);
  const [otherActionPhotoPreview, setOtherActionPhotoPreview] = useState(null);
  const otherActionPhotoInputRef = useRef(null);

  // History detail drawer state
  const [showHistoryDetailDrawer, setShowHistoryDetailDrawer] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  // Lock body scroll and prevent iOS viewport shifting when modals are open
  useEffect(() => {
    // Lock scroll when PlantDetail mounts
    const originalStyle = document.body.style.cssText;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';

    return () => {
      document.body.style.cssText = originalStyle;
    };
  }, []);

  // Reset image error state when plant changes
  useEffect(() => {
    setImageLoadError(false);
  }, [plant?.id]);

  // Use currentPlantData if available (after edit), otherwise use plant prop
  const sourcePlant = currentPlantData || plant;

  // Normalize plant data structure
  const plantData = sourcePlant ? {
    id: sourcePlant.id,
    customName: sourcePlant.customName || sourcePlant.name,
    species: sourcePlant.species || {
      name: null,
      scientific: null,
      emoji: '🌱',
    },
    location: sourcePlant.location,
    startedDate: sourcePlant.startedDate || sourcePlant.createdAt || new Date(),
    photoUrl: sourcePlant.photoUrl || sourcePlant.photoPreview || sourcePlant.image || null,
    lastWatered: lastActionOverrides.lastWatered || sourcePlant.lastWatered || null,
    lastFertilized: lastActionOverrides.lastFertilized || sourcePlant.lastFertilized || null,
    notes: sourcePlant.notes || '',
    // New species fields
    difficultyLevel: sourcePlant.species?.difficultyLevel || null,
    sunRequirement: sourcePlant.species?.sunRequirement || null,
    harvestSigns: sourcePlant.species?.harvestSigns || null,
  } : null;

  // Calculate days since started caring (with validation)
  const daysSinceStarted = (() => {
    if (!plantData?.startedDate) return null;
    const startDate = new Date(plantData.startedDate);
    if (isNaN(startDate.getTime())) return null;
    const days = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : null;
  })();

  // Get care schedule from species (null if not available)
  const wateringFrequencyDays = sourcePlant?.species?.wateringFrequencyDays || null;
  const fertilizingFrequencyDays = sourcePlant?.species?.fertilizingFrequencyDays || null;

  // Helper function to get subtitle text, color, and icon style for action cards
  // Colors: Green (#7CB342) - just done, Orange (#FF9800) - attention soon, Red (#F44336) - needs action
  const getActionSubtitle = (daysSince, frequencyDays, actionType) => {
    const pastTense = actionType === 'water' ? 'Disiram' : 'Dipupuk';
    const needsText = actionType === 'water' ? 'Perlu disiram' : 'Perlu dipupuk';
    const neverText = actionType === 'water' ? 'Belum pernah disiram' : 'Belum pernah dipupuk';
    const justNowText = actionType === 'water' ? 'Baru saja disiram' : 'Baru saja dipupuk';
    const yesterdayText = actionType === 'water' ? 'Disiram kemarin' : 'Dipupuk kemarin';

    // Default frequencies if not specified: water every 2-3 days, fertilize every 14 days
    const defaultFrequency = actionType === 'water' ? 3 : 14;
    const effectiveFrequency = frequencyDays || defaultFrequency;

    // Calculate warning threshold (when to show orange - about 70% of frequency)
    const warningThreshold = Math.max(2, Math.floor(effectiveFrequency * 0.7));

    // Never done - show red (needs action)
    if (daysSince === null || daysSince === undefined) {
      return {
        text: neverText,
        color: '#F44336',
        iconBg: 'rgba(244, 67, 54, 0.1)',
        iconColor: '#F44336',
        borderColor: '#F44336'
      };
    }

    // Done today - green
    if (daysSince === 0) {
      return {
        text: justNowText,
        color: '#7CB342',
        iconBg: 'rgba(124, 179, 66, 0.1)',
        iconColor: '#7CB342',
        borderColor: '#7CB342'
      };
    }

    // Done yesterday - green
    if (daysSince === 1) {
      return {
        text: yesterdayText,
        color: '#7CB342',
        iconBg: 'rgba(124, 179, 66, 0.1)',
        iconColor: '#7CB342',
        borderColor: '#7CB342'
      };
    }

    // Check if overdue (past the frequency) - red
    if (daysSince >= effectiveFrequency) {
      return {
        text: needsText,
        color: '#F44336',
        iconBg: 'rgba(244, 67, 54, 0.1)',
        iconColor: '#F44336',
        borderColor: '#F44336'
      };
    }

    // Check if attention needed soon (between warning threshold and overdue) - orange
    if (daysSince >= warningThreshold) {
      return {
        text: `${pastTense} ${daysSince} hari lalu`,
        color: '#FF9800',
        iconBg: 'rgba(255, 152, 0, 0.1)',
        iconColor: '#FF9800',
        borderColor: '#FF9800'
      };
    }

    // Recently done (within safe zone) - green
    return {
      text: `${pastTense} ${daysSince} hari lalu`,
      color: '#7CB342',
      iconBg: 'rgba(124, 179, 66, 0.1)',
      iconColor: '#7CB342',
      borderColor: '#7CB342'
    };
  };

  // Calculate care status based on last action dates (considering overrides)
  const calculateLocalCareStatus = (lastActionDate, frequencyDays, actionType) => {
    const actionLabel = actionType === 'siram' ? 'disiram' : 'dipupuk';
    const needsLabel = actionType === 'siram' ? 'Perlu disiram' : 'Perlu dipupuk';

    if (!lastActionDate) {
      return {
        status: frequencyDays !== null ? 'needs_action' : 'unknown',
        label: needsLabel,
        daysUntilNext: 0,
        daysSinceLast: null,
        doneToday: false,
      };
    }

    const lastAction = new Date(lastActionDate);
    const today = startOfDay(new Date());
    const lastActionDay = startOfDay(lastAction);

    const daysSinceLast = differenceInDays(today, lastActionDay);
    const doneToday = isToday(lastAction);
    const daysUntilNext = frequencyDays !== null ? Math.max(0, frequencyDays - daysSinceLast) : null;

    if (doneToday) {
      return {
        status: 'done_today',
        label: `Sudah ${actionLabel} hari ini`,
        daysUntilNext: frequencyDays,
        daysSinceLast: 0,
        doneToday: true,
      };
    }

    // Only mark as needs_action if we have frequency data
    if (frequencyDays !== null && daysSinceLast >= frequencyDays) {
      return {
        status: 'needs_action',
        label: needsLabel,
        daysUntilNext: 0,
        daysSinceLast,
        doneToday: false,
      };
    }

    return {
      status: 'on_schedule',
      label: daysUntilNext !== null ? `${daysUntilNext} hari lagi` : `${daysSinceLast} hari lalu`,
      daysUntilNext,
      daysSinceLast,
      doneToday: false,
    };
  };

  // Calculate watering status - use override if available, or from plant props
  const wateringStatus = lastActionOverrides.lastWatered
    ? calculateLocalCareStatus(lastActionOverrides.lastWatered, wateringFrequencyDays, 'siram')
    : (sourcePlant?.wateringStatus || calculateLocalCareStatus(plantData.lastWatered, wateringFrequencyDays, 'siram'));

  // Calculate fertilizing status - use override if available, or from plant props
  const fertilizingStatus = lastActionOverrides.lastFertilized
    ? calculateLocalCareStatus(lastActionOverrides.lastFertilized, fertilizingFrequencyDays, 'pupuk')
    : (sourcePlant?.fertilizingStatus || calculateLocalCareStatus(plantData.lastFertilized, fertilizingFrequencyDays, 'pupuk'));

  // For backward compatibility - keep daysSince calculations
  const daysSinceWatered = wateringStatus.daysSinceLast;
  const daysSinceFertilized = fertilizingStatus.daysSinceLast;

  // Fetch actions history from Supabase
  const fetchActionsHistory = useCallback(async () => {
    if (!plantData?.id) return;

    // Skip fetching from Supabase for offline/temp plants
    if (typeof plantData.id === 'string' && plantData.id.startsWith('temp-')) {
      console.log('[PlantDetail] Skipping fetch for temp plant:', plantData.id);
      setActionsHistory([]);
      return;
    }

    // Skip fetching for non-UUID plant IDs (created offline with numeric IDs)
    if (!isValidUUID(String(plantData.id))) {
      console.log('[PlantDetail] Skipping fetch for non-UUID plant ID:', plantData.id);
      setActionsHistory([]);
      return;
    }

    // Skip fetching if offline
    if (!navigator.onLine) {
      console.log('[PlantDetail] Offline, skipping fetch');
      return;
    }

    setActionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('plant_id', plantData.id)
        .order('action_date', { ascending: false });

      if (error) {
        console.error('[PlantDetail] Error fetching actions:', error);
        return;
      }

      console.log('[PlantDetail] Fetched actions:', data);
      setActionsHistory(data || []);
    } catch (err) {
      // Silently handle network errors when offline
      if (!navigator.onLine) {
        console.log('[PlantDetail] Network error while offline, ignoring');
        return;
      }
      console.error('[PlantDetail] Error:', err);
    } finally {
      setActionsLoading(false);
    }
  }, [plantData?.id]);

  // Fetch actions when tab changes to riwayat or after recording an action
  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchActionsHistory();
    }
  }, [activeTab, fetchActionsHistory]);

  // Helper function to format date in Indonesian
  const formatDateIndonesian = (dateString) => {
    const date = new Date(dateString);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Helper function to format time in HH.mm format
  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}.${minutes}`;
  };

  // Helper function to get action label in Indonesian
  const getActionLabel = (actionType, notes = '') => {
    switch (actionType) {
      case 'siram':
        return 'Penyiraman';
      case 'pupuk':
        return 'Pemupukan';
      case 'pangkas':
        return 'Pemangkasan';
      case 'panen':
        return 'Panen';
      case 'lainnya':
        // Extract custom action name from notes (format: "[CustomName] optional notes" or "[CustomName]")
        const match = notes?.match(/^\[([^\]]+)\]/);
        if (match) {
          return match[1]; // Return the custom name
        }
        return 'Lainnya';
      default:
        // Capitalize first letter for custom actions
        return actionType.charAt(0).toUpperCase() + actionType.slice(1);
    }
  };

  // Helper to extract clean notes (without the [CustomName] prefix for lainnya actions)
  const getCleanNotes = (actionType, notes) => {
    if (actionType === 'lainnya' && notes) {
      // Remove the [CustomName] prefix from notes
      return notes.replace(/^\[[^\]]+\]\s*/, '').trim() || null;
    }
    return notes;
  };

  // Helper function to map DB action type to UI type for icons
  const mapActionTypeForIcon = (actionType) => {
    switch (actionType) {
      case 'siram':
        return 'water';
      case 'pupuk':
        return 'fertilize';
      case 'pangkas':
        return 'prune';
      case 'panen':
        return 'harvest';
      default:
        return actionType;
    }
  };

  // Group actions by date for timeline display
  const groupedActions = actionsHistory.reduce((groups, action) => {
    const dateKey = action.action_date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(action);
    return groups;
  }, {});

  // Convert to array format for rendering
  const timeline = Object.entries(groupedActions).map(([date, actions]) => ({
    date: formatDateIndonesian(date),
    rawDate: date, // Keep raw date for detail drawer
    entries: actions.map(action => ({
      type: mapActionTypeForIcon(action.action_type),
      actionType: action.action_type, // Keep original action type
      label: getActionLabel(action.action_type, action.notes), // Pass notes to extract custom name for 'lainnya'
      notes: getCleanNotes(action.action_type, action.notes), // Clean notes (remove [CustomName] prefix)
      id: action.id,
      time: formatTime(action.created_at),
      createdAt: action.created_at, // Full timestamp
      photoUrl: action.photo_url, // Photo if any
    })),
  }));

  const getActionIcon = (type) => {
    switch (type) {
      case 'water':
        return <Drop size={20} weight="regular" color="#757575" />;
      case 'fertilize':
        return <Leaf size={20} weight="regular" color="#757575" />;
      case 'prune':
        return <Scissors size={20} weight="regular" color="#757575" />;
      case 'harvest':
        return <Basket size={20} weight="regular" color="#757575" />;
      case 'diagnose':
        return <FirstAidKit size={20} weight="regular" color="#757575" />;
      case 'add':
        return <Plant size={20} weight="regular" color="#757575" />;
      default:
        // Custom actions show a generic icon
        return <DotsThree size={20} weight="regular" color="#757575" />;
    }
  };

  const handleActionLog = async (actionType, options = {}) => {
    const plantName = plantData.customName;
    const { notes, photo } = options;

    // Map UI action types to database action types
    // UI: 'water', 'fertilize' -> DB: 'siram', 'pupuk'
    const dbActionType = actionType === 'water' ? 'siram' : actionType === 'fertilize' ? 'pupuk' : actionType;

    console.log('[PlantDetail] handleActionLog called:', {
      actionType,
      dbActionType,
      plantId: plantData.id,
      plantName,
      notes,
      hasPhoto: !!photo,
    });

    // Call the onRecordAction prop to save to Supabase
    if (onRecordAction) {
      console.log('[PlantDetail] Calling onRecordAction with:', plantData.id, dbActionType, notes, !!photo);
      const result = await onRecordAction(plantData.id, dbActionType, notes, photo);
      console.log('[PlantDetail] onRecordAction result:', result);

      if (!result.success) {
        console.error('[PlantDetail] Failed to record action:', result.error);
        setActionToastMessage(`Gagal mencatat: ${result.error}`);
        setShowActionToast(true);
        setTimeout(() => setShowActionToast(false), 3000);
        return { success: false };
      }

      // Update local state to reflect the new action immediately
      const now = new Date();
      if (actionType === 'water') {
        setLastActionOverrides(prev => ({ ...prev, lastWatered: now }));
      } else if (actionType === 'fertilize') {
        setLastActionOverrides(prev => ({ ...prev, lastFertilized: now }));
      }

      // Refetch actions history to update the Riwayat tab
      fetchActionsHistory();
    } else {
      console.warn('[PlantDetail] onRecordAction prop not provided');
    }

    let message = '';
    switch (actionType) {
      case 'water':
        message = `Penyiraman ${plantName} sudah dicatat`;
        break;
      case 'fertilize':
        message = `Pemupukan ${plantName} sudah dicatat`;
        break;
      default:
        message = `Aksi ${actionType} sudah dicatat`;
    }

    setActionToastMessage(message);
    setShowActionToast(true);
    setTimeout(() => setShowActionToast(false), 3000);
    return { success: true };
  };

  // Delete today's action (undo)
  const handleDeleteTodayAction = async (actionType) => {
    const plantName = plantData.customName;
    const dbActionType = actionType === 'water' ? 'siram' : actionType === 'fertilize' ? 'pupuk' : actionType;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('[PlantDetail] handleDeleteTodayAction called:', {
      actionType,
      dbActionType,
      plantId: plantData.id,
      today,
    });

    // Skip for offline/temp plants
    if (!isValidUUID(String(plantData.id))) {
      console.log('[PlantDetail] Skipping delete for non-UUID plant ID');
      setActionToastMessage('Tidak dapat membatalkan aksi untuk tanaman offline');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);
      return { success: false };
    }

    // Skip if offline
    if (!navigator.onLine) {
      console.log('[PlantDetail] Skipping delete - device is offline');
      setActionToastMessage('Tidak dapat membatalkan aksi saat offline');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);
      return { success: false };
    }

    try {
      // Find today's action for this plant and action type
      const { data: todayActions, error: fetchError } = await supabase
        .from('actions')
        .select('id')
        .eq('plant_id', plantData.id)
        .eq('action_type', dbActionType)
        .eq('action_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('[PlantDetail] Error fetching today action:', fetchError);
        setActionToastMessage('Gagal membatalkan aksi');
        setShowActionToast(true);
        setTimeout(() => setShowActionToast(false), 3000);
        return { success: false };
      }

      if (!todayActions || todayActions.length === 0) {
        console.log('[PlantDetail] No action found to delete');
        setActionToastMessage('Tidak ada aksi untuk dibatalkan');
        setShowActionToast(true);
        setTimeout(() => setShowActionToast(false), 3000);
        return { success: false };
      }

      // Delete the action
      const { error: deleteError } = await supabase
        .from('actions')
        .delete()
        .eq('id', todayActions[0].id);

      if (deleteError) {
        console.error('[PlantDetail] Error deleting action:', deleteError);
        setActionToastMessage('Gagal membatalkan aksi');
        setShowActionToast(true);
        setTimeout(() => setShowActionToast(false), 3000);
        return { success: false };
      }

      console.log('[PlantDetail] Action deleted successfully');

      // Clear the local override so it recalculates from the remaining actions
      if (actionType === 'water') {
        setLastActionOverrides(prev => ({ ...prev, lastWatered: null }));
      } else if (actionType === 'fertilize') {
        setLastActionOverrides(prev => ({ ...prev, lastFertilized: null }));
      }

      // Refetch actions history
      fetchActionsHistory();

      const actionLabel = actionType === 'water' ? 'Penyiraman' : 'Pemupukan';
      setActionToastMessage(`${actionLabel} ${plantName} dibatalkan`);
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);

      return { success: true };
    } catch (err) {
      console.error('[PlantDetail] Error in handleDeleteTodayAction:', err);
      setActionToastMessage('Gagal membatalkan aksi');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);
      return { success: false };
    }
  };

  // Handle fertilizing photo selection
  const handleFertilizingPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFertilizingPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFertilizingPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle fertilizing form submit
  const handleFertilizingSubmit = async () => {
    setIsSubmittingAction(true);

    try {
      const result = await handleActionLog('fertilize', { notes: fertilizingNotes, photo: fertilizingPhoto });

      if (result?.success) {
        // Clear form and close drawer
        setFertilizingNotes('');
        setFertilizingPhoto(null);
        setFertilizingPhotoPreview(null);
        setShowFertilizingDrawer(false);
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle watering card tap
  const handleWateringCardTap = () => {
    if (wateringStatus.doneToday) {
      // Already watered today - show drawer with options
      setShowWateringDrawer(true);
    } else {
      // Not watered today - quick action
      handleActionLog('water');
    }
  };

  // Handle fertilizing card tap - always show drawer
  const handleFertilizingCardTap = () => {
    setShowFertilizingDrawer(true);
  };

  // Handle pruning photo selection
  const handlePruningPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPruningPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPruningPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle pruning submit
  const handlePruningSubmit = async () => {
    setIsSubmittingAction(true);

    try {
      const result = await handleActionLog('pangkas', { notes: pruningNotes, photo: pruningPhoto });

      if (result?.success) {
        setPruningNotes('');
        setPruningPhoto(null);
        setPruningPhotoPreview(null);
        setShowPruningDrawer(false);
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle pruning card tap - always show drawer
  const handlePruningCardTap = () => {
    setShowPruningDrawer(true);
  };

  // Handle other action photo selection
  const handleOtherActionPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setOtherActionPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOtherActionPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle other action submit
  const handleOtherActionSubmit = async () => {
    if (!otherActionName.trim()) {
      setActionToastMessage('Nama aksi harus diisi');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);
      return;
    }

    setIsSubmittingAction(true);

    try {
      // Use 'lainnya' as the action type and store custom action name in notes
      // This works with the database constraint that only allows specific action types
      const combinedNotes = otherActionNotes
        ? `[${otherActionName.trim()}] ${otherActionNotes}`
        : `[${otherActionName.trim()}]`;
      const result = await handleActionLog('lainnya', { notes: combinedNotes, photo: otherActionPhoto });

      // Always close drawer and reset state after submit attempt
      setOtherActionName('');
      setOtherActionNotes('');
      setOtherActionPhoto(null);
      setOtherActionPhotoPreview(null);
      setShowOtherActionDrawer(false);

      // Note: handleActionLog already shows toast messages for both success and failure
    } catch (err) {
      console.error('[PlantDetail] Other action submit error:', err);
      setActionToastMessage('Gagal menyimpan aksi. Coba lagi.');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);
      // Still close the drawer on error so user isn't stuck
      setOtherActionName('');
      setOtherActionNotes('');
      setOtherActionPhoto(null);
      setOtherActionPhotoPreview(null);
      setShowOtherActionDrawer(false);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle other action card tap - always show drawer
  const handleOtherActionCardTap = () => {
    setShowOtherActionDrawer(true);
  };

  // Delete a specific history action by ID
  const handleDeleteHistoryAction = async (actionId) => {
    if (!actionId) {
      console.error('[PlantDetail] handleDeleteHistoryAction: No action ID provided');
      return { success: false };
    }

    console.log('[PlantDetail] handleDeleteHistoryAction:', actionId);
    setIsDeletingHistory(true);

    try {
      const { error: deleteError } = await supabase
        .from('actions')
        .delete()
        .eq('id', actionId);

      if (deleteError) {
        console.error('[PlantDetail] Error deleting action:', deleteError);
        setActionToastMessage('Gagal menghapus catatan');
        setShowActionToast(true);
        setTimeout(() => setShowActionToast(false), 3000);
        return { success: false };
      }

      console.log('[PlantDetail] Action deleted successfully');

      // Close drawers
      setShowDeleteHistoryConfirm(false);
      setShowHistoryDetailDrawer(false);
      setSelectedHistoryEntry(null);

      // Refetch actions history
      fetchActionsHistory();

      // Show success toast
      setActionToastMessage('Catatan dihapus');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);

      return { success: true };
    } catch (err) {
      console.error('[PlantDetail] Error in handleDeleteHistoryAction:', err);
      setActionToastMessage('Gagal menghapus catatan');
      setShowActionToast(true);
      setTimeout(() => setShowActionToast(false), 3000);
      return { success: false };
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'water':
        handleActionLog('water');
        break;
      case 'fertilize':
        handleActionLog('fertilize');
        break;
      case 'diagnose':
        if (!isOnline) {
          setShowOfflineModal(true);
        } else {
          setShowTanyaTanam(true);
        }
        break;
      case 'edit':
        setShowEditPlant(true);
        break;
      case 'delete':
        setShowDeleteConfirm(true);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="ios-fixed-container"
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 2000,
        overflow: 'hidden',
        visibility: showTanyaTanam ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sticky Header Section */}
      <div style={{ position: 'relative', zIndex: 10, backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        {/* Header with Navigation - Back, Image Center, Settings */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px',
          }}
        >
          {/* Back Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
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
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
          </motion.button>

          {/* Center Plant Image */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {plantData.photoUrl && !imageLoadError ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={plantData.photoUrl}
                  alt={plantData.customName}
                  onClick={() => setShowImagePreview(true)}
                  onError={() => setImageLoadError(true)}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    cursor: 'pointer',
                  }}
                />
                {/* Species image badge */}
                {sourcePlant?.species?.imageUrl && !speciesImageError && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      right: '-8px',
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                    }}
                  >
                    <img
                      src={sourcePlant.species.imageUrl}
                      alt={sourcePlant.species.name || ''}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                      onError={() => setSpeciesImageError(true)}
                    />
                  </div>
                )}
              </div>
            ) : sourcePlant?.species?.imageUrl && !speciesImageError ? (
              /* Show species image when no plant photo */
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  backgroundColor: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                }}
              >
                <img
                  src={sourcePlant.species.imageUrl}
                  alt={sourcePlant.species.name || plantData.customName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={() => setSpeciesImageError(true)}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  backgroundColor: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                }}
              >
                {plantData.species?.emoji || '🌱'}
              </div>
            )}
          </div>

          {/* Settings Button - Opens Edit Plant */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditPlant(true)}
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
              flexShrink: 0,
            }}
          >
            <Gear size={20} weight="regular" color="#2C2C2C" />
          </motion.button>
        </div>

        {/* Plant Info - Centered */}
        <div style={{ padding: '0 16px', textAlign: 'center', marginBottom: '16px' }}>
          {/* Plant Name */}
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: '0 0 4px',
            }}
          >
            {plantData.customName}
          </h1>

          {/* Metadata Row: Time • Location • Notes */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#757575',
              margin: '0 0 4px 0',
            }}
          >
            {[
              daysSinceStarted === 0 ? 'Baru mulai hari ini! 🌱' : (daysSinceStarted != null ? `${daysSinceStarted} hari merawat` : null),
              plantData.location,
              plantData.notes
            ].filter(Boolean).join(' • ')}
          </p>

        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            margin: '0 16px',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('perawatan')}
            style={{
              flex: 1,
              padding: '10px 24px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: activeTab === 'perawatan' ? 500 : 400,
              color: activeTab === 'perawatan' ? '#7CB342' : '#757575',
              backgroundColor: activeTab === 'perawatan' ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
            }}
          >
            Perawatan
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('riwayat')}
            style={{
              flex: 1,
              padding: '10px 24px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: activeTab === 'riwayat' ? 500 : 400,
              color: activeTab === 'riwayat' ? '#7CB342' : '#757575',
              backgroundColor: activeTab === 'riwayat' ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
            }}
          >
            Riwayat
          </motion.button>
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}>
        {activeTab === 'perawatan' ? (
          <div style={{ padding: '16px 16px 120px 16px' }}>
              {/* Section Header */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#757575',
                  margin: '0 0 12px 0',
                }}
              >
                Yang dapat anda lakukan
              </p>

              {/* 2x2 Action Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                {/* Penyiraman Card */}
                {(() => {
                  const wateringStatus = getActionSubtitle(daysSinceWatered, wateringFrequencyDays, 'water');
                  return (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWateringCardTap}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E4E4E7',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#FAFAFA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Drop size={20} weight="regular" color="#757575" />
                      </div>
                      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        <h3
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#2C2C2C',
                            margin: '0 0 4px 0',
                          }}
                        >
                          Penyiraman
                        </h3>
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                            color: wateringStatus.color,
                            margin: 0,
                          }}
                        >
                          {wateringStatus.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Pemupukan Card */}
                {(() => {
                  const fertilizingStatus = getActionSubtitle(daysSinceFertilized, fertilizingFrequencyDays, 'fertilize');
                  return (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFertilizingCardTap}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E4E4E7',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#FAFAFA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Leaf size={20} weight="regular" color="#757575" />
                      </div>
                      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        <h3
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#2C2C2C',
                            margin: '0 0 4px 0',
                          }}
                        >
                          Pemupukan
                        </h3>
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                            color: fertilizingStatus.color,
                            margin: 0,
                          }}
                        >
                          {fertilizingStatus.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Pemangkasan Card */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePruningCardTap}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Scissors size={20} weight="regular" color="#757575" />
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#2C2C2C',
                        margin: '0 0 4px 0',
                      }}
                    >
                      Pemangkasan
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#757575',
                        margin: 0,
                      }}
                    >
                      Pangkas daun
                    </p>
                  </div>
                </motion.div>

                {/* Aksi Lainya Card */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOtherActionCardTap}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DotsThree size={20} weight="regular" color="#757575" />
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#2C2C2C',
                        margin: '0 0 4px 0',
                      }}
                    >
                      Aksi Lainya
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#757575',
                        margin: 0,
                      }}
                    >
                      Catat aksi
                    </p>
                  </div>
                </motion.div>
              </div>

          </div>
        ) : (
          <div style={{ padding: '16px 16px 24px 16px', minHeight: 'calc(100vh - 400px)' }}>
              {/* Loading State */}
              {actionsLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 'calc(100vh - 450px)',
                }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", color: '#757575' }}>
                    Memuat riwayat...
                  </p>
                </div>
              ) : timeline.length === 0 ? (
                /* Empty State */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 'calc(100vh - 450px)',
                  textAlign: 'center',
                }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#F5F5F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Drop size={40} weight="regular" color="#CCCCCC" />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      color: '#757575',
                      margin: 0,
                    }}
                  >
                    Belum ada riwayat perawatan
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#999999',
                      margin: '8px 0 0 0',
                    }}
                  >
                    Catat penyiraman atau pemupukan pertamamu!
                  </p>
                </div>
              ) : (
                /* Timeline Entries */
                timeline.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Date Header */}
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#2C2C2C',
                        marginTop: groupIndex > 0 ? '32px' : '16px',
                        marginBottom: '12px',
                      }}
                    >
                      {group.date}
                    </h3>

                    {/* Timeline Entries for this date */}
                    {group.entries.map((entry, entryIndex) => (
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        key={entry.id || entryIndex}
                        onClick={() => {
                          setSelectedHistoryEntry({ ...entry, dateFormatted: group.date });
                          setShowHistoryDetailDrawer(true);
                        }}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E4E4E7',
                          padding: '16px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: (entry.notes || entry.photoUrl) ? 'flex-start' : 'center',
                          gap: '12px',
                        }}
                      >
                        {/* Left side: Icon */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#FAFAFA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getActionIcon(entry.type)}
                        </div>

                        {/* Middle: Title, Notes, Photo */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#2C2C2C',
                              margin: 0,
                            }}
                          >
                            {entry.label}
                          </h4>
                          {entry.notes && (
                            <p
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '14px',
                                color: '#666666',
                                margin: '4px 0 0 0',
                              }}
                            >
                              {entry.notes}
                            </p>
                          )}
                          {entry.photoUrl && (
                            <img
                              src={entry.photoUrl}
                              alt="Foto aksi"
                              style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                display: 'block',
                                marginTop: '8px',
                              }}
                            />
                          )}
                        </div>

                        {/* Right side: Time */}
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                            color: '#757575',
                            margin: 0,
                            flexShrink: 0,
                          }}
                        >
                          {entry.time}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ))
              )}
          </div>
        )}
      </div>

      {/* Sticky Tanya Tanam Section - Fixed at Bottom - Only show on Perawatan tab */}
      {activeTab === 'perawatan' && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            left: '16px',
            right: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E4E4E7',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            cursor: 'pointer',
            zIndex: 100,
            transition: 'transform 0.1s ease',
          }}
          onClick={() => handleMenuAction('diagnose')}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                color: '#2C2C2C',
                margin: '0 0 4px 0',
              }}
            >
              Tanya Tanam
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#757575',
                margin: 0,
              }}
            >
              Ngobrol dengan {plantData.customName}
            </p>
          </div>

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChatDots size={20} weight="regular" color="#757575" />
          </div>
        </div>
      )}

      {/* Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            />

            {/* Menu Sheet Container - for centering */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: 'var(--app-max-width)',
                zIndex: 1001,
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
                maxHeight: '70vh',
                overflowY: 'auto',
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
                    fontFamily: "'Caveat', cursive",
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Pilihan
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMenu(false)}
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
                </motion.button>
              </div>

              {/* Aksi Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#757575',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Aksi
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !wateringStatus.doneToday && handleMenuAction('water')}
                  disabled={wateringStatus.doneToday}
                  style={{
                    backgroundColor: wateringStatus.doneToday ? '#F0FDF4' : '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: wateringStatus.doneToday ? '1px solid #86EFAC' : '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: wateringStatus.doneToday ? 'default' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: wateringStatus.doneToday ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => !wateringStatus.doneToday && (e.target.style.backgroundColor = '#F5F5F5')}
                  onMouseLeave={(e) => !wateringStatus.doneToday && (e.target.style.backgroundColor = '#FFFFFF')}
                >
                  {wateringStatus.doneToday ? (
                    <CheckCircle size={24} weight="fill" color="#16A34A" />
                  ) : (
                    <Drop size={24} weight="duotone" color="#3B82F6" />
                  )}
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: wateringStatus.doneToday ? '#16A34A' : '#2C2C2C',
                    }}
                  >
                    {wateringStatus.doneToday ? 'Sudah disiram hari ini' : 'Siram Tanaman'}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !fertilizingStatus.doneToday && handleMenuAction('fertilize')}
                  disabled={fertilizingStatus.doneToday}
                  style={{
                    backgroundColor: fertilizingStatus.doneToday ? '#F0FDF4' : '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: fertilizingStatus.doneToday ? '1px solid #86EFAC' : '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: fertilizingStatus.doneToday ? 'default' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: fertilizingStatus.doneToday ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => !fertilizingStatus.doneToday && (e.target.style.backgroundColor = '#F5F5F5')}
                  onMouseLeave={(e) => !fertilizingStatus.doneToday && (e.target.style.backgroundColor = '#FFFFFF')}
                >
                  {fertilizingStatus.doneToday ? (
                    <CheckCircle size={24} weight="fill" color="#16A34A" />
                  ) : (
                    <Leaf size={24} weight="duotone" color="#16A34A" />
                  )}
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: fertilizingStatus.doneToday ? '#16A34A' : '#2C2C2C',
                    }}
                  >
                    {fertilizingStatus.doneToday ? 'Sudah dipupuk hari ini' : 'Beri Pupuk'}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMenuAction('diagnose')}
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
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#F5F5F5')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
                >
                  <ChatCircle size={24} weight="duotone" color="#7CB342" />
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
                </motion.button>
              </div>

              {/* Konfigurasi Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#757575',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Konfigurasi
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMenuAction('edit')}
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
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#F5F5F5')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
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
                </motion.button>
              </div>

              {/* Zona Berbahaya Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#757575',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Zona Berbahaya
              </p>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuAction('delete')}
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
              </motion.button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Image Preview Modal - only show if there's a photo and it loaded successfully */}
      <AnimatePresence>
        {showImagePreview && plantData.photoUrl && !imageLoadError && (
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
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowImagePreview(false)}
          >
            {/* Close Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImagePreview(false)}
              aria-label="Tutup"
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={28} weight="bold" color="#FFFFFF" />
            </motion.button>

            {/* Full Image */}
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={plantData.photoUrl}
              alt={plantData.customName}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Photo Fullscreen Preview - must be above detail drawers (z-index 5001) */}
      <AnimatePresence>
        {timelinePhotoPreview && (
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
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 6500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setTimelinePhotoPreview(null)}
          >
            {/* Close Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimelinePhotoPreview(null)}
              aria-label="Tutup"
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={28} weight="bold" color="#FFFFFF" />
            </motion.button>

            {/* Full Image */}
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={timelinePhotoPreview}
              alt="Foto aksi"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tanya Tanam Screen - rendered via Portal to avoid iOS keyboard issues */}
      {showTanyaTanam && typeof document !== 'undefined' && createPortal(
        <TanyaTanam
          plant={plant}
          onBack={() => setShowTanyaTanam(false)}
        />,
        document.body
      )}

      {/* Edit Plant Modal */}
      {showEditPlant && (
        <EditPlant
          plant={currentPlantData || plantData}
          onClose={() => setShowEditPlant(false)}
          onSave={async (updatedPlant) => {
            // Save to Supabase via parent callback
            if (onSavePlant) {
              const result = await onSavePlant(updatedPlant);
              if (result.success) {
                setCurrentPlantData(updatedPlant);
                setShowEditPlant(false);
                setShowActionToast(true);
                setActionToastMessage('Perubahan berhasil disimpan');
                setTimeout(() => setShowActionToast(false), 3000);
              } else {
                setShowActionToast(true);
                setActionToastMessage('Gagal menyimpan perubahan');
                setTimeout(() => setShowActionToast(false), 3000);
              }
            } else {
              // Fallback if no save callback provided
              setCurrentPlantData(updatedPlant);
              setShowEditPlant(false);
            }
          }}
          onDelete={(plantToDelete) => {
            setShowEditPlant(false);
            if (onDelete) {
              onDelete(plantToDelete?.id);
            }
          }}
        />
      )}

      {/* Action Toast */}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
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
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4001,
                pointerEvents: 'none',
              }}
            >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '32px 24px',
                width: 'calc(100% - 48px)',
                maxWidth: '320px',
                textAlign: 'center',
                pointerEvents: 'auto',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Trash size={32} weight="bold" color="#DC2626" />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#2D5016',
                  margin: '0 0 12px 0',
                }}
              >
                Hapus Tanaman?
              </h2>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#757575',
                  margin: '0 0 24px 0',
                  lineHeight: 1.5,
                }}
              >
                Kamu yakin mau hapus <strong style={{ color: '#2C2C2C' }}>{plantData.customName}</strong>? Semua data dan riwayat perawatan akan hilang.
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
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
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    if (onDelete) onDelete(plantData.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
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
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Watering Drawer - shown when already watered today */}
      <AnimatePresence>
        {showWateringDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWateringDrawer(false)}
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
                borderRadius: '12px 12px 0 0',
                padding: '24px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
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
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Penyiraman Hari Ini
                </h2>
                <button
                  onClick={() => setShowWateringDrawer(false)}
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

              {/* Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle size={24} weight="fill" color="#16A34A" />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#16A34A',
                  }}
                >
                  Sudah disiram hari ini
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Add Another Watering */}
                <button
                  onClick={async () => {
                    setShowWateringDrawer(false);
                    await handleActionLog('water');
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={24} weight="bold" color="#3B82F6" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Tambah Penyiraman Lagi
                  </span>
                </button>

                {/* Undo Watering */}
                <button
                  onClick={async () => {
                    setShowWateringDrawer(false);
                    await handleDeleteTodayAction('water');
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowCounterClockwise size={24} weight="bold" color="#DC2626" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#DC2626',
                    }}
                  >
                    Batalkan Penyiraman
                  </span>
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Fertilizing Drawer - always shown on tap */}
      <AnimatePresence>
        {showFertilizingDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowFertilizingDrawer(false);
                setFertilizingNotes('');
                setFertilizingPhoto(null);
                setFertilizingPhotoPreview(null);
              }}
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
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Catat Pemupukan
                </h2>
                <button
                  onClick={() => {
                    setShowFertilizingDrawer(false);
                    setFertilizingNotes('');
                    setFertilizingPhoto(null);
                    setFertilizingPhotoPreview(null);
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

              {/* Already fertilized today status */}
              {fertilizingStatus.doneToday && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#F0FDF4',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <CheckCircle size={24} weight="fill" color="#16A34A" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#16A34A',
                    }}
                  >
                    Sudah dipupuk hari ini
                  </span>
                </div>
              )}

              {/* Photo Upload */}
              <input
                type="file"
                accept="image/*"
                ref={fertilizingPhotoInputRef}
                onChange={handleFertilizingPhotoSelect}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fertilizingPhotoInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: fertilizingPhotoPreview ? '200px' : '120px',
                  border: '2px dashed #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#FAFAFA',
                }}
              >
                {fertilizingPhotoPreview ? (
                  <img
                    src={fertilizingPhotoPreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <Camera size={32} weight="duotone" color="#999999" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#999999',
                      }}
                    >
                      Tambah foto (opsional)
                    </span>
                  </>
                )}
              </div>

              {/* Notes Textarea */}
              <textarea
                value={fertilizingNotes}
                onChange={(e) => setFertilizingNotes(e.target.value)}
                placeholder="Jenis pupuk, dosis, catatan lainnya..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid transparent',
                  borderRadius: '12px',
                  resize: 'vertical',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.border = '2px solid #7CB342'}
                onBlur={(e) => e.target.style.border = '2px solid transparent'}
              />

              {/* Submit Button */}
              <button
                onClick={handleFertilizingSubmit}
                disabled={isSubmittingAction}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isSubmittingAction ? '#A5D6A7' : '#7CB342',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmittingAction ? 'default' : 'pointer',
                  marginBottom: fertilizingStatus.doneToday ? '12px' : '0',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {isSubmittingAction ? 'Menyimpan...' : 'Simpan'}
                </span>
              </button>

              {/* Undo button - only show if already fertilized today */}
              {fertilizingStatus.doneToday && (
                <button
                  onClick={async () => {
                    setShowFertilizingDrawer(false);
                    setFertilizingNotes('');
                    setFertilizingPhoto(null);
                    setFertilizingPhotoPreview(null);
                    await handleDeleteTodayAction('fertilize');
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowCounterClockwise size={20} weight="bold" color="#DC2626" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#DC2626',
                    }}
                  >
                    Batalkan Pemupukan Hari Ini
                  </span>
                </button>
              )}
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Pruning Drawer */}
      <AnimatePresence>
        {showPruningDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPruningDrawer(false);
                setPruningNotes('');
                setPruningPhoto(null);
                setPruningPhotoPreview(null);
              }}
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
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Catat Pemangkasan
                </h2>
                <button
                  onClick={() => {
                    setShowPruningDrawer(false);
                    setPruningNotes('');
                    setPruningPhoto(null);
                    setPruningPhotoPreview(null);
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

              {/* Photo Upload */}
              <input
                type="file"
                accept="image/*"
                ref={pruningPhotoInputRef}
                onChange={handlePruningPhotoSelect}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => pruningPhotoInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: pruningPhotoPreview ? '200px' : '120px',
                  border: '2px dashed #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#FAFAFA',
                }}
              >
                {pruningPhotoPreview ? (
                  <img
                    src={pruningPhotoPreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <Camera size={32} weight="duotone" color="#999999" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#999999',
                      }}
                    >
                      Tambah foto (opsional)
                    </span>
                  </>
                )}
              </div>

              {/* Notes Textarea */}
              <textarea
                value={pruningNotes}
                onChange={(e) => setPruningNotes(e.target.value)}
                placeholder="Bagian yang dipangkas, alasan, catatan lainnya..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid transparent',
                  borderRadius: '12px',
                  resize: 'vertical',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.border = '2px solid #7CB342'}
                onBlur={(e) => e.target.style.border = '2px solid transparent'}
              />

              {/* Submit Button */}
              <button
                onClick={handlePruningSubmit}
                disabled={isSubmittingAction}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isSubmittingAction ? '#A5D6A7' : '#7CB342',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmittingAction ? 'default' : 'pointer',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {isSubmittingAction ? 'Menyimpan...' : 'Simpan'}
                </span>
              </button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Other Action Drawer */}
      <AnimatePresence>
        {showOtherActionDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOtherActionDrawer(false);
                setOtherActionName('');
                setOtherActionNotes('');
                setOtherActionPhoto(null);
                setOtherActionPhotoPreview(null);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOtherActionDrawer(false);
                setOtherActionName('');
                setOtherActionNotes('');
                setOtherActionPhoto(null);
                setOtherActionPhotoPreview(null);
              }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 5000,
                cursor: 'pointer',
                touchAction: 'manipulation',
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
              onClick={(e) => e.stopPropagation()}
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
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Aksi Lainya
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowOtherActionDrawer(false);
                    setOtherActionName('');
                    setOtherActionNotes('');
                    setOtherActionPhoto(null);
                    setOtherActionPhotoPreview(null);
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

              {/* Action Name Input */}
              <input
                type="text"
                value={otherActionName}
                onChange={(e) => setOtherActionName(e.target.value)}
                placeholder="Nama aksi (wajib)"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid transparent',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.border = '2px solid #7CB342'}
                onBlur={(e) => e.target.style.border = '2px solid transparent'}
              />

              {/* Photo Upload */}
              <input
                type="file"
                accept="image/*"
                ref={otherActionPhotoInputRef}
                onChange={handleOtherActionPhotoSelect}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => otherActionPhotoInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: otherActionPhotoPreview ? '200px' : '120px',
                  border: '2px dashed #E0E0E0',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#FAFAFA',
                }}
              >
                {otherActionPhotoPreview ? (
                  <img
                    src={otherActionPhotoPreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <Camera size={32} weight="duotone" color="#999999" />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#999999',
                      }}
                    >
                      Tambah foto (opsional)
                    </span>
                  </>
                )}
              </div>

              {/* Notes Textarea */}
              <textarea
                value={otherActionNotes}
                onChange={(e) => setOtherActionNotes(e.target.value)}
                placeholder="Deskripsi atau catatan (opsional)"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid transparent',
                  borderRadius: '12px',
                  resize: 'vertical',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.border = '2px solid #7CB342'}
                onBlur={(e) => e.target.style.border = '2px solid transparent'}
              />

              {/* Submit Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOtherActionSubmit();
                }}
                disabled={isSubmittingAction || !otherActionName.trim()}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isSubmittingAction || !otherActionName.trim() ? '#A5D6A7' : '#7CB342',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmittingAction || !otherActionName.trim() ? 'default' : 'pointer',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {isSubmittingAction ? 'Menyimpan...' : 'Simpan'}
                </span>
              </button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* History Detail Drawer - Clean Layout */}
      <AnimatePresence>
        {showHistoryDetailDrawer && selectedHistoryEntry && (
          <>
            {/* Backdrop */}
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHistoryDetailDrawer(false);
                setSelectedHistoryEntry(null);
              }}
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
                    color: '#2D5016',
                    margin: 0,
                  }}
                >
                  Detail {selectedHistoryEntry.label}
                </h2>
                <button
                  onClick={() => {
                    setShowHistoryDetailDrawer(false);
                    setSelectedHistoryEntry(null);
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

              {/* Timestamp */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#757575',
                  margin: '0 0 16px 0',
                }}
              >
                {selectedHistoryEntry.dateFormatted}
                {selectedHistoryEntry.time && `, ${selectedHistoryEntry.time}`}
              </p>

              {/* Notes (if any) */}
              {selectedHistoryEntry.notes && (
                <div style={{ marginBottom: '16px' }}>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#757575',
                      margin: '0 0 4px 0',
                    }}
                  >
                    Catatan:
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#2C2C2C',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedHistoryEntry.notes}
                  </p>
                </div>
              )}

              {/* Photo (if any) */}
              {selectedHistoryEntry.photoUrl && (
                <div style={{ marginBottom: '20px' }}>
                  <img
                    src={selectedHistoryEntry.photoUrl}
                    alt="Action photo"
                    onClick={() => setTimelinePhotoPreview(selectedHistoryEntry.photoUrl)}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      maxHeight: '250px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteHistoryConfirm(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Trash size={20} weight="bold" color="#DC2626" />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#DC2626',
                  }}
                >
                  Hapus
                </span>
              </button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete History Confirmation Modal */}
      <AnimatePresence>
        {showDeleteHistoryConfirm && selectedHistoryEntry && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteHistoryConfirm(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 6000,
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
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 6001,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '32px 24px',
                  width: 'calc(100% - 48px)',
                  maxWidth: '320px',
                  textAlign: 'center',
                  pointerEvents: 'auto',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <Trash size={32} weight="bold" color="#DC2626" />
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#2D5016',
                    margin: '0 0 12px 0',
                  }}
                >
                  Hapus Catatan?
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
                    margin: '0 0 24px 0',
                    lineHeight: 1.5,
                  }}
                >
                  Catatan {selectedHistoryEntry.label.toLowerCase()} ini akan dihapus.
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowDeleteHistoryConfirm(false)}
                    disabled={isDeletingHistory}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      color: '#757575',
                      backgroundColor: '#F5F5F5',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isDeletingHistory ? 'default' : 'pointer',
                      opacity: isDeletingHistory ? 0.5 : 1,
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteHistoryAction(selectedHistoryEntry.id)}
                    disabled={isDeletingHistory}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      fontSize: '1rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      color: '#FFFFFF',
                      backgroundColor: isDeletingHistory ? '#F87171' : '#DC2626',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isDeletingHistory ? 'default' : 'pointer',
                    }}
                  >
                    {isDeletingHistory ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Offline Modal for Tanya Tanam */}
      <OfflineModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        featureName="Tanya Tanam"
      />
    </div>
  );
};

export default PlantDetail;
