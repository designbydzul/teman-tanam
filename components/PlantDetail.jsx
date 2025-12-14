import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Basket
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

const PlantDetail = ({ plant, onBack, onEdit, onDelete, onRecordAction }) => {
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

  // Calculate days since last action
  const daysSinceWatered = plantData.lastWatered
    ? Math.floor((new Date() - new Date(plantData.lastWatered)) / (1000 * 60 * 60 * 24))
    : null;

  const daysSinceFertilized = plantData.lastFertilized
    ? Math.floor((new Date() - new Date(plantData.lastFertilized)) / (1000 * 60 * 60 * 24))
    : null;

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
    entries: actions.map(action => ({
      type: mapActionTypeForIcon(action.action_type),
      label: getActionLabel(action.action_type),
      notes: action.notes,
      id: action.id,
      time: formatTime(action.created_at),
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

  const handleActionLog = async (actionType) => {
    const plantName = plantData.customName;

    // Map UI action types to database action types
    // UI: 'water', 'fertilize' -> DB: 'siram', 'pupuk'
    const dbActionType = actionType === 'water' ? 'siram' : actionType === 'fertilize' ? 'pupuk' : actionType;

    console.log('[PlantDetail] handleActionLog called:', {
      actionType,
      dbActionType,
      plantId: plantData.id,
      plantName,
    });

    // Call the onRecordAction prop to save to Supabase
    if (onRecordAction) {
      console.log('[PlantDetail] Calling onRecordAction with:', plantData.id, dbActionType);
      const result = await onRecordAction(plantData.id, dbActionType);
      console.log('[PlantDetail] onRecordAction result:', result);

      if (!result.success) {
        console.error('[PlantDetail] Failed to record action:', result.error);
        setActionToastMessage(`Gagal mencatat: ${result.error}`);
        setShowActionToast(true);
        setTimeout(() => setShowActionToast(false), 3000);
        return;
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
                  onClick={() => handleActionLog('water')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #E0E0E0',
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
                        color: '#666666',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {daysSinceWatered === null ? 'Belum pernah disiram' : daysSinceWatered === 0 ? 'Terakhir disiram hari ini' : `Terakhir disiram ${daysSinceWatered} hari yang lalu`}
                    </p>
                  </div>

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Drop size={24} weight="duotone" color="#3B82F6" />
                  </div>
                </div>

                {/* Pemupukan */}
                <div
                  onClick={() => handleActionLog('fertilize')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #E0E0E0',
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
                        color: '#666666',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {daysSinceFertilized === null ? 'Belum pernah dipupuk' : daysSinceFertilized === 0 ? 'Terakhir dipupuk hari ini' : `Terakhir dipupuk ${daysSinceFertilized} hari yang lalu`}
                    </p>
                  </div>

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#F0FDF4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Leaf size={24} weight="duotone" color="#16A34A" />
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
                  onClick={() => handleMenuAction('water')}
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
                  <Drop size={24} weight="duotone" color="#3B82F6" />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#2C2C2C',
                    }}
                  >
                    Siram Tanaman
                  </span>
                </button>

                <button
                  onClick={() => handleMenuAction('fertilize')}
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
          onSave={(updatedPlant) => {
            setCurrentPlantData(updatedPlant);
            setShowEditPlant(false);
            if (onEdit) onEdit(updatedPlant);
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
    </div>
  );
};

export default PlantDetail;
