import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, isToday, startOfDay } from 'date-fns';
import {
  Drop,
  Leaf,
  FirstAidKit,
  Camera,
  CaretDown,
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
} from '@phosphor-icons/react';
import TanyaTanam from './TanyaTanam';
import EditPlant from './EditPlant';
import { supabase } from '@/lib/supabase/client';

// Helper to validate UUID format
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const PlantDetail = ({ plant, onBack, onEdit, onDelete, onRecordAction, onSavePlant }) => {
  const [activeTab, setActiveTab] = useState('perawatan');
  const [showMenu, setShowMenu] = useState(false);
  const [quickTipsExpanded, setQuickTipsExpanded] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showTanyaTanam, setShowTanyaTanam] = useState(false);
  const [showEditPlant, setShowEditPlant] = useState(false);
  const [currentPlantData, setCurrentPlantData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
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
      name: sourcePlant.name,
      scientific: 'Cucumis sativus',
      emoji: '🌱',
    },
    location: sourcePlant.location,
    plantedDate: sourcePlant.plantedDate || sourcePlant.createdAt || new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    photoUrl: sourcePlant.photoUrl || sourcePlant.photoPreview || sourcePlant.image || null,
    lastWatered: lastActionOverrides.lastWatered || sourcePlant.lastWatered || null,
    lastFertilized: lastActionOverrides.lastFertilized || sourcePlant.lastFertilized || null,
    quickTips: sourcePlant.quickTips || sourcePlant.species?.quickTips || 'Pilih lahan yang memiliki sinar matahari penuh dan tanah yang gembur, mudah menyerap air, serta kaya akan humus dengan pH sekitar 6–7. Bersihkan lahan dari gulma dan bebatuan, lalu gemburkan tanah dengan pencangkulan. Buat bedengan atau guludan dengan lebar sekitar 1 meter, tinggi 20–30 cm, dan jarak antar bedengan 30–50 cm.',
    notes: sourcePlant.notes || '',
  } : {
    id: '1',
    customName: 'Timun Jelita',
    species: {
      name: 'Timun',
      scientific: 'Cucumis sativus',
      emoji: '🥒',
    },
    location: 'Teras',
    plantedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    photoUrl: null,
    lastWatered: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    lastFertilized: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    quickTips: 'Pilih lahan yang memiliki sinar matahari penuh dan tanah yang gembur, mudah menyerap air, serta kaya akan humus dengan pH sekitar 6–7. Bersihkan lahan dari gulma dan bebatuan, lalu gemburkan tanah dengan pencangkulan. Buat bedengan atau guludan dengan lebar sekitar 1 meter, tinggi 20–30 cm, dan jarak antar bedengan 30–50 cm.',
  };

  // Calculate days since planted
  const daysSincePlanted = Math.floor(
    (new Date() - new Date(plantData.plantedDate)) / (1000 * 60 * 60 * 24)
  );

  // Get care schedule from species (with defaults)
  const wateringFrequencyDays = sourcePlant?.species?.wateringFrequencyDays || 3;
  const fertilizingFrequencyDays = sourcePlant?.species?.fertilizingFrequencyDays || 14;

  // Calculate care status based on last action dates (considering overrides)
  const calculateLocalCareStatus = (lastActionDate, frequencyDays, actionType) => {
    const actionLabel = actionType === 'siram' ? 'disiram' : 'dipupuk';
    const needsLabel = actionType === 'siram' ? 'Perlu disiram' : 'Perlu dipupuk';

    if (!lastActionDate) {
      return {
        status: 'needs_action',
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
    const daysUntilNext = Math.max(0, frequencyDays - daysSinceLast);

    if (doneToday) {
      return {
        status: 'done_today',
        label: `Sudah ${actionLabel} hari ini`,
        daysUntilNext: frequencyDays,
        daysSinceLast: 0,
        doneToday: true,
      };
    }

    if (daysSinceLast >= frequencyDays) {
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
      label: `${daysUntilNext} hari lagi`,
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
  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'siram':
        return 'Penyiraman';
      case 'pupuk':
        return 'Pemupukan';
      case 'pangkas':
        return 'Pemangkasan';
      case 'panen':
        return 'Panen';
      default:
        return actionType;
    }
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
      label: getActionLabel(action.action_type),
      notes: action.notes,
      id: action.id,
      time: formatTime(action.created_at),
      createdAt: action.created_at, // Full timestamp
      photoUrl: action.photo_url, // Photo if any
    })),
  }));

  const getActionIcon = (type) => {
    switch (type) {
      case 'water':
        return <Drop size={20} weight="regular" color="#666666" />;
      case 'fertilize':
        return <Leaf size={20} weight="regular" color="#666666" />;
      case 'prune':
        return <Scissors size={20} weight="regular" color="#666666" />;
      case 'harvest':
        return <Basket size={20} weight="regular" color="#666666" />;
      case 'diagnose':
        return <FirstAidKit size={20} weight="regular" color="#666666" />;
      case 'add':
        return <Plant size={20} weight="regular" color="#666666" />;
      default:
        return <Drop size={20} weight="regular" color="#666666" />;
    }
  };

  const handleActionLog = async (actionType, options = {}) => {
    const plantName = plantData.customName;
    const { notes, photoUrl } = options;

    // Map UI action types to database action types
    // UI: 'water', 'fertilize' -> DB: 'siram', 'pupuk'
    const dbActionType = actionType === 'water' ? 'siram' : actionType === 'fertilize' ? 'pupuk' : actionType;

    console.log('[PlantDetail] handleActionLog called:', {
      actionType,
      dbActionType,
      plantId: plantData.id,
      plantName,
      notes,
      photoUrl,
    });

    // Call the onRecordAction prop to save to Supabase
    if (onRecordAction) {
      console.log('[PlantDetail] Calling onRecordAction with:', plantData.id, dbActionType, notes);
      const result = await onRecordAction(plantData.id, dbActionType, notes);
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
      // For now, we'll just pass the notes. Photo upload can be added later
      const result = await handleActionLog('fertilize', { notes: fertilizingNotes });

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
        setShowTanyaTanam(true);
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 2000,
        overflow: 'hidden',
        visibility: showTanyaTanam ? 'hidden' : 'visible',
      }}
    >
      {/* Sticky Header Section */}
      <div style={{ position: 'relative', zIndex: 10, backgroundColor: '#FFFFFF' }}>
        {/* Header with Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
          }}
        >
          <button
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
            }}
          >
            <ArrowLeft size={16} weight="bold" color="#2D5016" />
          </button>

          <button
            onClick={() => setShowMenu(true)}
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
            <DotsThree size={16} weight="bold" color="#2D5016" />
          </button>
        </div>

        {/* Plant Info with Thumbnail */}
        <div style={{ padding: '0 24px' }}>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            {/* Plant Thumbnail - Clickable */}
            {plantData.photoUrl && !imageLoadError ? (
              <img
                src={plantData.photoUrl}
                alt={plantData.customName}
                onClick={() => setShowImagePreview(true)}
                onError={() => setImageLoadError(true)}
                style={{
                  width: '140px',
                  height: '140px',
                  objectFit: 'cover',
                  borderRadius: '24px',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              />
            ) : (
              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '24px',
                  backgroundColor: '#F1F8E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  flexShrink: 0,
                }}
              >
                {plantData.species?.emoji || '🌱'}
              </div>
            )}

            {/* Plant Details */}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: 'var(--font-caveat), Caveat, cursive',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#2D5016',
                  margin: 0,
                }}
              >
                {plantData.customName}
              </h1>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1rem',
                  color: '#666666',
                  margin: '4px 0 8px 0',
                }}
              >
                {plantData.species.scientific}
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  margin: 0,
                }}
              >
                {plantData.location} • {daysSincePlanted} hari sejak ditanam{plantData.notes ? ` • ${plantData.notes}` : ''}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '0',
              marginTop: '24px',
            }}
          >
            <button
              onClick={() => setActiveTab('perawatan')}
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: activeTab === 'perawatan' ? 500 : 400,
                color: activeTab === 'perawatan' ? '#2D5016' : '#666666',
                backgroundColor: activeTab === 'perawatan' ? '#F1F8E9' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Perawatan
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: activeTab === 'riwayat' ? 500 : 400,
                color: activeTab === 'riwayat' ? '#2D5016' : '#666666',
                backgroundColor: activeTab === 'riwayat' ? '#F1F8E9' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Riwayat
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div style={{
        position: 'absolute',
        top: '323px',
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}>
        {activeTab === 'perawatan' ? (
          <div style={{ padding: '0 24px 100px 24px' }}>
              {/* Section Header */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  marginBottom: '16px',
                }}
              >
                Yang perlu anda lakukan
              </p>

              {/* Action Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Penyiraman */}
                <div
                  onClick={handleWateringCardTap}
                  style={{
                    backgroundColor: wateringStatus.doneToday ? '#F0FDF4' : '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: wateringStatus.doneToday ? '1px solid #86EFAC' : wateringStatus.status === 'needs_action' ? '2px solid #F57C00' : '1px solid #E0E0E0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: '#2C2C2C',
                        margin: 0,
                      }}
                    >
                      Penyiraman
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: 400,
                        color: wateringStatus.doneToday ? '#16A34A' : wateringStatus.status === 'needs_action' ? '#F57C00' : '#666666',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {wateringStatus.doneToday
                        ? 'Sudah disiram hari ini'
                        : wateringStatus.status === 'needs_action'
                          ? daysSinceWatered === null
                            ? 'Perlu disiram • Belum pernah disiram'
                            : `Perlu disiram • Terakhir: ${daysSinceWatered} hari lalu`
                          : daysSinceWatered === null
                            ? `${wateringStatus.label}`
                            : `${wateringStatus.label} • Terakhir: ${daysSinceWatered} hari lalu`
                      }
                    </p>
                  </div>

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: wateringStatus.doneToday ? '#DCFCE7' : '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {wateringStatus.doneToday ? (
                      <CheckCircle size={24} weight="fill" color="#16A34A" />
                    ) : (
                      <Drop size={24} weight="duotone" color="#3B82F6" />
                    )}
                  </div>
                </div>

                {/* Pemupukan */}
                <div
                  onClick={handleFertilizingCardTap}
                  style={{
                    backgroundColor: fertilizingStatus.doneToday ? '#F0FDF4' : '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: fertilizingStatus.doneToday ? '1px solid #86EFAC' : fertilizingStatus.status === 'needs_action' ? '2px solid #F57C00' : '1px solid #E0E0E0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: '#2C2C2C',
                        margin: 0,
                      }}
                    >
                      Pemupukan
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: 400,
                        color: fertilizingStatus.doneToday ? '#16A34A' : fertilizingStatus.status === 'needs_action' ? '#F57C00' : '#666666',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {fertilizingStatus.doneToday
                        ? 'Sudah dipupuk hari ini'
                        : fertilizingStatus.status === 'needs_action'
                          ? daysSinceFertilized === null
                            ? 'Perlu dipupuk • Belum pernah dipupuk'
                            : `Perlu dipupuk • Terakhir: ${daysSinceFertilized} hari lalu`
                          : daysSinceFertilized === null
                            ? `${fertilizingStatus.label}`
                            : `${fertilizingStatus.label} • Terakhir: ${daysSinceFertilized} hari lalu`
                      }
                    </p>
                  </div>

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: fertilizingStatus.doneToday ? '#DCFCE7' : '#F0FDF4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {fertilizingStatus.doneToday ? (
                      <CheckCircle size={24} weight="fill" color="#16A34A" />
                    ) : (
                      <Leaf size={24} weight="duotone" color="#16A34A" />
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #E0E0E0',
                  marginTop: '24px',
                  cursor: 'pointer',
                }}
                onClick={() => setQuickTipsExpanded(!quickTipsExpanded)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                      margin: 0,
                    }}
                  >
                    Quick Tips
                  </h3>
                  <div
                    style={{
                      transform: quickTipsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CaretDown size={20} weight="bold" color="#666666" />
                  </div>
                </div>

                <AnimatePresence>
                  {quickTipsExpanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#4A4A4A',
                        lineHeight: 1.6,
                        marginTop: '12px',
                        marginBottom: 0,
                      }}
                    >
                      {plantData.quickTips}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Tanya Tanam Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  marginTop: '24px',
                  marginBottom: '12px',
                }}
              >
                Ngobrol sama {plantData.customName} yuk
              </p>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #E0E0E0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => handleMenuAction('diagnose')}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                      margin: 0,
                    }}
                  >
                    Tanya Tanam
                  </h3>
                </div>

                <button
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E5E5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F5')}
                >
                  <ChatCircle size={24} weight="bold" color="#4B5563" />
                </button>
              </div>
          </div>
        ) : (
          <div style={{ padding: '0 24px 100px 24px' }}>
              {/* Loading State */}
              {actionsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", color: '#666666' }}>
                    Memuat riwayat...
                  </p>
                </div>
              ) : timeline.length === 0 ? (
                /* Empty State */
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#F5F5F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <Drop size={40} weight="regular" color="#CCCCCC" />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      color: '#666666',
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
                        marginTop: groupIndex > 0 ? '32px' : '0',
                        marginBottom: '12px',
                      }}
                    >
                      {group.date}
                    </h3>

                    {/* Timeline Entries for this date */}
                    {group.entries.map((entry, entryIndex) => (
                      <div
                        key={entry.id || entryIndex}
                        onClick={() => {
                          setSelectedHistoryEntry({ ...entry, dateFormatted: group.date });
                          setShowHistoryDetailDrawer(true);
                        }}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          padding: '16px',
                          border: '1px solid #F5F5F5',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#F5F5F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                          }}
                        >
                          {getActionIcon(entry.type)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h4
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: '#2C2C2C',
                                margin: 0,
                              }}
                            >
                              {entry.label}
                            </h4>
                            {entry.time && (
                              <span
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: '14px',
                                  color: '#999999',
                                }}
                              >
                                {entry.time}
                              </span>
                            )}
                          </div>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
          </div>
        )}
      </div>

      {/* Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
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
                zIndex: 1001,
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
                  onClick={() => setShowMenu(false)}
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
                <button
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
                </button>

                <button
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
                </button>

                <button
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
              </button>
            </motion.div>
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
            <button
              onClick={() => setShowImagePreview(false)}
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
            </button>

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
                  stroke="#666666"
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
                  fontFamily: 'var(--font-caveat), Caveat, cursive',
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
                  color: '#666666',
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWateringDrawer(false)}
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
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                zIndex: 5001,
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
                    fontFamily: 'var(--font-caveat), Caveat, cursive',
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
          </>
        )}
      </AnimatePresence>

      {/* Fertilizing Drawer - always shown on tap */}
      <AnimatePresence>
        {showFertilizingDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
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
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 5001,
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
                    fontFamily: 'var(--font-caveat), Caveat, cursive',
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
                <Leaf size={20} weight="bold" color="#FFFFFF" />
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
          </>
        )}
      </AnimatePresence>

      {/* History Detail Drawer */}
      <AnimatePresence>
        {showHistoryDetailDrawer && selectedHistoryEntry && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHistoryDetailDrawer(false);
                setSelectedHistoryEntry(null);
              }}
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
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 5001,
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
                    fontFamily: 'var(--font-caveat), Caveat, cursive',
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

              {/* Action Info Card */}
              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                {/* Action Type with Icon, Title and Date in a row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: selectedHistoryEntry.notes ? '12px' : '0',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: selectedHistoryEntry.type === 'water' ? '#EFF6FF' : '#F0FDF4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selectedHistoryEntry.type === 'water' ? (
                      <Drop size={20} weight="duotone" color="#3B82F6" />
                    ) : selectedHistoryEntry.type === 'fertilize' ? (
                      <Leaf size={20} weight="duotone" color="#16A34A" />
                    ) : selectedHistoryEntry.type === 'prune' ? (
                      <Scissors size={20} weight="duotone" color="#666666" />
                    ) : selectedHistoryEntry.type === 'harvest' ? (
                      <Basket size={20} weight="duotone" color="#666666" />
                    ) : (
                      <Drop size={20} weight="duotone" color="#666666" />
                    )}
                  </div>

                  {/* Title and Date stacked */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#2C2C2C',
                      }}
                    >
                      {selectedHistoryEntry.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#666666',
                      }}
                    >
                      {selectedHistoryEntry.dateFormatted}
                      {selectedHistoryEntry.time && `, ${selectedHistoryEntry.time}`}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {selectedHistoryEntry.notes && (
                  <div
                    style={{
                      borderTop: '1px solid #E0E0E0',
                      paddingTop: '12px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#666666',
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
              </div>

              {/* Photo (if any) */}
              {selectedHistoryEntry.photoUrl && (
                <div style={{ marginBottom: '20px' }}>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#666666',
                      margin: '0 0 8px 0',
                    }}
                  >
                    Foto:
                  </p>
                  <img
                    src={selectedHistoryEntry.photoUrl}
                    alt="Action photo"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      maxHeight: '200px',
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
                    fontFamily: 'var(--font-caveat), Caveat, cursive',
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
                    color: '#666666',
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
                      color: '#666666',
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
    </div>
  );
};

export default PlantDetail;
