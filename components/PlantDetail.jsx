import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  X
} from '@phosphor-icons/react';
import DiagnosaHama from './DiagnosaHama';
import EditPlant from './EditPlant';

// Static mock timeline data - moved outside component to prevent recreation on every render
const MOCK_TIMELINE = [
  {
    date: '18 Desember 2025',
    entries: [
      { type: 'water', label: 'Penyiraman', time: '7.45' },
      { type: 'fertilize', label: 'Pemupukan', time: '6.30' },
    ],
  },
  {
    date: '16 Desember 2025',
    entries: [
      { type: 'water', label: 'Penyiraman', time: '7.45' },
      { type: 'diagnose', label: 'Diagnosa penyakit', time: '6.30', hasDetails: true },
    ],
  },
  {
    date: '10 Desember 2025',
    entries: [
      { type: 'water', label: 'Penyiraman', time: '10.15' },
      { type: 'add', label: 'Tanaman ditambahkan', time: '8.23' },
    ],
  },
];

const PlantDetail = ({ plant, onBack, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState('perawatan');
  const [showMenu, setShowMenu] = useState(false);
  const [quickTipsExpanded, setQuickTipsExpanded] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDiagnosaHama, setShowDiagnosaHama] = useState(false);
  const [showEditPlant, setShowEditPlant] = useState(false);
  const [currentPlantData, setCurrentPlantData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Toast state for actions
  const [showActionToast, setShowActionToast] = useState(false);
  const [actionToastMessage, setActionToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
    photoUrl: sourcePlant.photoUrl || sourcePlant.photoPreview || sourcePlant.image || 'https://images.unsplash.com/photo-1568584711271-6c0b7a1e0d64?w=600',
    lastWatered: sourcePlant.lastWatered || new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    lastFertilized: sourcePlant.lastFertilized || new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    quickTips: sourcePlant.quickTips || 'Pilih lahan yang memiliki sinar matahari penuh dan tanah yang gembur, mudah menyerap air, serta kaya akan humus dengan pH sekitar 6–7. Bersihkan lahan dari gulma dan bebatuan, lalu gemburkan tanah dengan pencangkulan. Buat bedengan atau guludan dengan lebar sekitar 1 meter, tinggi 20–30 cm, dan jarak antar bedengan 30–50 cm.',
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
    photoUrl: 'https://images.unsplash.com/photo-1568584711271-6c0b7a1e0d64?w=600',
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

  // Use static timeline data from outside component
  const timeline = MOCK_TIMELINE;

  const getActionIcon = (type) => {
    switch (type) {
      case 'water':
        return <Drop size={20} weight="regular" color="#666666" />;
      case 'fertilize':
        return <Leaf size={20} weight="regular" color="#666666" />;
      case 'diagnose':
        return <FirstAidKit size={20} weight="regular" color="#666666" />;
      case 'add':
        return <Plant size={20} weight="regular" color="#666666" />;
      default:
        return <Drop size={20} weight="regular" color="#666666" />;
    }
  };

  // Memoized action log handler with proper timeout cleanup
  const handleActionLog = useCallback((actionType) => {
    const plantName = plantData.customName;
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

    // Clear any existing timeout to prevent memory leaks
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setActionToastMessage(message);
    setShowActionToast(true);
    toastTimerRef.current = setTimeout(() => setShowActionToast(false), 3000);
  }, [plantData.customName]);

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
        setShowDiagnosaHama(true);
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 2000,
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
            <img
              src={plantData.photoUrl}
              alt={plantData.customName}
              loading="lazy"
              decoding="async"
              onClick={() => setShowImagePreview(true)}
              style={{
                width: '140px',
                height: '140px',
                objectFit: 'cover',
                borderRadius: '24px',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            />

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
                {plantData.location} • {daysSincePlanted} hari sejak ditanam
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '0',
              marginTop: '24px',
              marginBottom: '16px',
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
                backgroundColor: activeTab === 'perawatan' ? '#FFF9E6' : 'transparent',
                border: 'none',
                borderRadius: '12px',
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
                backgroundColor: activeTab === 'riwayat' ? '#FFF9E6' : 'transparent',
                border: 'none',
                borderRadius: '12px',
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
        top: '330px',
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {activeTab === 'perawatan' ? (
          <div style={{ padding: '24px 24px 100px 24px' }}>
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
                      Terakhir disiram {daysSinceWatered} hari yang lalu
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
                      Terakhir diberi pupuk {daysSinceFertilized} hari yang lalu
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

              {/* Diagnosis Section */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  marginTop: '24px',
                  marginBottom: '12px',
                }}
              >
                Ada yang aneh dengan {plantData.customName}?
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
                    Diagnosa Hama
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
                  <Camera size={24} weight="bold" color="#4B5563" />
                </button>
              </div>
          </div>
        ) : (
          <div style={{ padding: '24px 24px 100px 24px' }}>
              {timeline.map((group, groupIndex) => (
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

                  {/* Timeline Entries */}
                  {group.entries.map((entry, entryIndex) => (
                    <div
                      key={entryIndex}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '16px',
                        border: '1px solid #F5F5F5',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: entry.hasDetails ? 'flex-start' : 'center',
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
                        {entry.hasDetails && (
                          <p
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '14px',
                              color: '#666666',
                              margin: '4px 0 0 0',
                            }}
                          >
                            Lihat details
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          color: '#999999',
                        }}
                      >
                        {entry.time}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
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

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && (
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

      {/* Diagnosa Hama Screen */}
      {showDiagnosaHama && (
        <DiagnosaHama
          plant={plant}
          onBack={() => setShowDiagnosaHama(false)}
        />
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
