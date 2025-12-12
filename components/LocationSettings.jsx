import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  DotsSixVertical,
  Trash,
  Plus,
  X,
} from '@phosphor-icons/react';
import { useLocations } from '@/hooks/useLocations';

const SortableLocationCard = ({ location, plantCount, onDelete, isDeleting }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="location-card"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#FFFFFF',
          border: 'none',
          borderRadius: '12px',
          marginBottom: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            color: '#999999',
          }}
        >
          <DotsSixVertical size={24} weight="bold" />
        </div>

        {/* Location Info */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              fontWeight: 600,
              color: '#2C2C2C',
              margin: 0,
            }}
          >
            {location.name}
          </h3>
          {plantCount > 0 && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#666666',
                margin: '4px 0 0 0',
              }}
            >
              {plantCount} tanaman
            </p>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(location)}
          disabled={isDeleting}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          <Trash size={20} weight="bold" color="#DC2626" />
        </button>
      </div>
    </div>
  );
};

const LocationSettings = ({ onBack, onLocationDeleted, onLocationAdded, plants = [], onPlantsUpdated }) => {
  // Use Supabase locations hook
  const {
    locations,
    loading,
    error: locationsError,
    addLocation,
    deleteLocation,
    reorderLocations,
    refetch,
  } = useLocations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showMovePlantsModal, setShowMovePlantsModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [moveToLocation, setMoveToLocation] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate plant count for a location from actual plants data
  const getPlantCountForLocation = (locationName) => {
    return plants.filter((plant) => plant.location === locationName).length;
  };

  // Check for duplicate location name
  const checkDuplicate = (name) => {
    const trimmedName = name.trim().toLowerCase();
    return locations.some((loc) => loc.name.toLowerCase() === trimmedName);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((item) => item.id === active.id);
      const newIndex = locations.findIndex((item) => item.id === over.id);
      const reorderedLocations = arrayMove(locations, oldIndex, newIndex);

      // Update in Supabase
      const result = await reorderLocations(reorderedLocations);
      if (!result.success) {
        console.error('[LocationSettings] Failed to reorder:', result.error);
      }
    }
  };

  const handleNameChange = (value) => {
    setNewLocationName(value);
    // Clear error when typing
    if (error) setError('');
    // Check for duplicate
    if (value.trim().length >= 2 && checkDuplicate(value)) {
      setError('Nama lokasi sudah ada');
    }
  };

  const handleAddLocation = async () => {
    if (newLocationName.trim().length < 2) return;

    // Check for duplicate before saving
    if (checkDuplicate(newLocationName)) {
      setError('Nama lokasi sudah ada');
      return;
    }

    setIsSubmitting(true);
    const locationName = newLocationName.trim();

    // Add to Supabase
    const result = await addLocation(locationName, '📍');

    if (result.success) {
      setNewLocationName('');
      setError('');
      setShowAddModal(false);
      // Callback to show toast
      if (onLocationAdded) {
        onLocationAdded(locationName);
      }
    } else {
      setError(result.error || 'Gagal menambahkan lokasi');
    }

    setIsSubmitting(false);
  };

  const isValidNewLocation = newLocationName.trim().length >= 2 && !checkDuplicate(newLocationName);

  const handleDeleteLocation = (location) => {
    setLocationToDelete(location);
    const plantCount = getPlantCountForLocation(location.name);
    if (plantCount > 0) {
      setShowMovePlantsModal(true);
    } else {
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDelete = async () => {
    if (locationToDelete) {
      setIsDeleting(true);
      const deletedLocationName = locationToDelete.name;

      // Delete from Supabase
      const result = await deleteLocation(locationToDelete.id);

      if (result.success) {
        setLocationToDelete(null);
        setShowDeleteConfirmModal(false);
        // Callback to show toast
        if (onLocationDeleted) {
          onLocationDeleted(deletedLocationName);
        }
      } else {
        setError(result.error || 'Gagal menghapus lokasi');
      }

      setIsDeleting(false);
    }
  };

  const handleMovePlants = async () => {
    if (locationToDelete && moveToLocation) {
      setIsDeleting(true);
      const deletedLocationName = locationToDelete.name;
      const targetLocation = locations.find((loc) => loc.id === moveToLocation);

      if (targetLocation) {
        // Update plants to new location
        const updatedPlants = plants.map((plant) => {
          if (plant.location === deletedLocationName) {
            return { ...plant, location: targetLocation.name };
          }
          return plant;
        });

        // Call callback to update plants in parent component
        if (onPlantsUpdated) {
          onPlantsUpdated(updatedPlants);
        }
      }

      // Delete from Supabase
      const result = await deleteLocation(locationToDelete.id);

      if (result.success) {
        // Reset state
        setLocationToDelete(null);
        setMoveToLocation('');
        setShowMovePlantsModal(false);

        // Callback to show toast
        if (onLocationDeleted) {
          onLocationDeleted(deletedLocationName);
        }
      } else {
        setError(result.error || 'Gagal menghapus lokasi');
      }

      setIsDeleting(false);
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
        zIndex: 3000,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F5F5F5',
          zIndex: 10,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Back Button */}
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              left: 0,
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

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-caveat), Caveat, cursive',
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
            }}
          >
            Atur Lokasi Tanam
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666666', fontFamily: "'Inter', sans-serif" }}>
              Memuat lokasi...
            </p>
          </div>
        )}

        {/* Error State */}
        {locationsError && !loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#DC2626', fontFamily: "'Inter', sans-serif", marginBottom: '16px' }}>
              {locationsError}
            </p>
            <button
              onClick={refetch}
              style={{
                padding: '12px 24px',
                backgroundColor: '#7CB342',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !locationsError && locations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666666', fontFamily: "'Inter', sans-serif" }}>
              Belum ada lokasi. Tambahkan lokasi pertamamu!
            </p>
          </div>
        )}

        {/* Draggable Location List */}
        {!loading && !locationsError && locations.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={locations.map((loc) => loc.id)}
              strategy={verticalListSortingStrategy}
            >
              {locations.map((location) => (
                <SortableLocationCard
                  key={location.id}
                  location={location}
                  plantCount={getPlantCountForLocation(location.name)}
                  onDelete={handleDeleteLocation}
                  isDeleting={isDeleting}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Add New Location Button */}
        {!loading && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#FFFFFF',
              border: '2px dashed #7CB342',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginTop: '12px',
            }}
          >
            <Plus size={24} weight="bold" color="#7CB342" />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                color: '#7CB342',
              }}
            >
              Tambah Lokasi Baru
            </span>
          </button>
        )}
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowAddModal(false)}
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
                zIndex: 1001,
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isSubmitting && setShowAddModal(false)}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                <X size={20} weight="bold" color="#666666" />
              </button>

              {/* Modal Title */}
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 16px 0',
                }}
              >
                Tambah Lokasi Baru
              </h2>

              {/* Input */}
              <input
                type="text"
                placeholder="Nama lokasi (min. 2 karakter)"
                value={newLocationName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: error
                    ? '2px solid #EF4444'
                    : inputFocused
                      ? '2px solid #7CB342'
                      : '2px solid transparent',
                  borderRadius: '12px',
                  outline: 'none',
                  marginBottom: error ? '8px' : '16px',
                  transition: 'border-color 200ms',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              />
              {error && (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#EF4444',
                    margin: '0 0 16px 0',
                  }}
                >
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                onClick={handleAddLocation}
                disabled={!isValidNewLocation || isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: isValidNewLocation && !isSubmitting ? '#7CB342' : '#CCCCCC',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isValidNewLocation && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && locationToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDeleting && setShowDeleteConfirmModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '400px',
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 12px 0',
                }}
              >
                Hapus Lokasi?
              </h2>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  margin: '0 0 24px 0',
                }}
              >
                Yakin mau hapus lokasi "{locationToDelete.name}"?
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#666666',
                    backgroundColor: '#F5F5F5',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: '#DC2626',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Plants Modal */}
      <AnimatePresence>
        {showMovePlantsModal && locationToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowMovePlantsModal(false)}
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
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 1001,
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isDeleting && setShowMovePlantsModal(false)}
                disabled={isDeleting}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                <X size={20} weight="bold" color="#666666" />
              </button>

              {/* Modal Title */}
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 12px 0',
                }}
              >
                Pindahkan Tanaman
              </h2>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  margin: '0 0 24px 0',
                }}
              >
                Ada {getPlantCountForLocation(locationToDelete.name)} tanaman di "{locationToDelete.name}".
                Mau dipindahkan kemana?
              </p>

              {/* Location Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {locations
                  .filter((loc) => loc.id !== locationToDelete.id)
                  .map((location) => (
                    <button
                      key={location.id}
                      onClick={() => setMoveToLocation(location.id)}
                      disabled={isDeleting}
                      style={{
                        padding: '16px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: moveToLocation === location.id ? '#2D5016' : '#2C2C2C',
                        backgroundColor:
                          moveToLocation === location.id ? '#F1F8E9' : '#FAFAFA',
                        border:
                          moveToLocation === location.id
                            ? '2px solid #7CB342'
                            : '1px solid #E0E0E0',
                        borderRadius: '12px',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                    >
                      {location.name}
                      {getPlantCountForLocation(location.name) > 0 && (
                        <span style={{ color: '#666666', fontSize: '14px', marginLeft: '8px' }}>
                          ({getPlantCountForLocation(location.name)} tanaman)
                        </span>
                      )}
                    </button>
                  ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowMovePlantsModal(false)}
                  disabled={isDeleting}
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
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleMovePlants}
                  disabled={!moveToLocation || isDeleting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: moveToLocation && !isDeleting ? '#7CB342' : '#CCCCCC',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: moveToLocation && !isDeleting ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isDeleting ? 'Memproses...' : 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationSettings;
