'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
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
  MapPin,
  X,
  PencilSimple,
} from '@phosphor-icons/react';
import { useLocations } from '@/hooks/useLocations';
import { GlobalOfflineBanner } from '@/components/shared';

interface Location {
  id: string;
  name: string;
  emoji?: string;
}

interface Plant {
  id: string;
  location: string;
}

interface SortableLocationCardProps {
  location: Location;
  plantCount: number;
  onDelete: (location: Location) => void;
  onEdit: (location: Location) => void;
  isDeleting: boolean;
}

const SortableLocationCard: React.FC<SortableLocationCardProps> = ({
  location,
  plantCount,
  onDelete,
  onEdit,
  isDeleting,
}) => {
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
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 1,
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
          backgroundColor: isDragging ? '#F1F8E9' : '#FFFFFF',
          border: isDragging ? '2px dashed #7CB342' : '1px solid #E4E4E7',
          borderRadius: '12px',
          marginBottom: '12px',
          boxShadow: isDragging ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)',
          transition: 'background-color 0.2s, border 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragging ? '#7CB342' : '#999999',
            touchAction: 'none',
            padding: '8px',
            marginLeft: '-8px',
            minWidth: '40px',
            minHeight: '40px',
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
                color: '#757575',
                margin: '4px 0 0 0',
              }}
            >
              {plantCount} tanaman
            </p>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(location)}
          disabled={isDeleting}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#F5F5F5',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            opacity: isDeleting ? 0.5 : 1,
            marginRight: '4px',
          }}
        >
          <PencilSimple size={20} weight="bold" color="#757575" />
        </button>

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

interface LocationSettingsProps {
  onBack: () => void;
  onLocationDeleted?: (locationName: string) => void;
  onLocationAdded?: (locationName: string) => void;
  plants?: Plant[];
  onPlantsUpdated?: (plants: Plant[]) => void;
  isNested?: boolean; // If true, just calls onBack instead of navigating to home with toast
}

const LocationSettings: React.FC<LocationSettingsProps> = ({
  onBack,
  onLocationDeleted,
  onLocationAdded,
  plants = [],
  onPlantsUpdated,
  isNested = false,
}) => {
  // Use Supabase locations hook
  const {
    locations,
    loading,
    error: locationsError,
    isOnline,
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    refetch,
  } = useLocations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showMovePlantsModal, setShowMovePlantsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [moveToLocation, setMoveToLocation] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [editInputFocused, setEditInputFocused] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const addLocationInputRef = useRef<HTMLInputElement>(null);
  const editLocationInputRef = useRef<HTMLInputElement>(null);

  // Calculate plant count for a location from actual plants data
  const getPlantCountForLocation = (locationName: string): number => {
    return plants.filter((plant) => plant.location === locationName).length;
  };

  // Check for duplicate location name
  const checkDuplicate = (name: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return (locations as Location[]).some((loc) => loc.name.toLowerCase() === trimmedName);
  };

  // Auto-focus input when add modal opens
  useEffect(() => {
    if (showAddModal && addLocationInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        addLocationInputRef.current?.focus();
      }, 100);
    }
  }, [showAddModal]);

  // Auto-focus input when edit modal opens
  useEffect(() => {
    if (showEditModal && editLocationInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        editLocationInputRef.current?.focus();
      }, 100);
    }
  }, [showEditModal]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('[LocationSettings] Drag started:', event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('[LocationSettings] Drag ended:', { activeId: active.id, overId: over?.id });
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((item: Location) => item.id === active.id);
      const newIndex = locations.findIndex((item: Location) => item.id === over.id);
      const reorderedLocations = arrayMove(locations, oldIndex, newIndex);
      console.log('[LocationSettings] Reordering from', oldIndex, 'to', newIndex);

      // Update in Supabase
      const result = await reorderLocations(reorderedLocations);
      if (!result.success) {
        console.error('[LocationSettings] Failed to reorder:', result.error);
      } else {
        console.log('[LocationSettings] Reorder successful');
      }
    }
  };

  const handleDragCancel = () => {
    console.log('[LocationSettings] Drag cancelled');
    setActiveId(null);
  };

  // Get the active location for DragOverlay
  const activeLocation = activeId ? (locations as Location[]).find((loc) => loc.id === activeId) : null;

  const handleNameChange = (value: string) => {
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

  // Handle edit location
  const handleEdit = (location: Location) => {
    setLocationToEdit(location);
    setEditLocationName(location.name);
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditNameChange = (value: string) => {
    setEditLocationName(value);
    // Clear error when user starts typing
    if (editError) {
      setEditError('');
    }
  };

  const handleUpdateLocation = async () => {
    if (!locationToEdit) return;

    const trimmedName = editLocationName.trim();

    // Validate
    if (trimmedName.length < 2) {
      setEditError('Minimal 2 karakter');
      return;
    }

    // Check for duplicates (excluding current location)
    const isDuplicate = locations.some(
      (loc) => loc.id !== locationToEdit.id && loc.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setEditError('Lokasi sudah ada');
      return;
    }

    setIsSubmitting(true);

    // Update in Supabase
    const result = await updateLocation(locationToEdit.id, { name: trimmedName });

    if (result.success) {
      setShowEditModal(false);
      setLocationToEdit(null);
      setEditLocationName('');

      // Callback to show toast
      if (onLocationAdded) {
        onLocationAdded(trimmedName);
      }
    } else {
      setEditError(result.error || 'Gagal mengubah lokasi');
    }

    setIsSubmitting(false);
  };

  const handleDeleteLocation = (location: Location) => {
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
      const targetLocation = (locations as Location[]).find((loc) => loc.id === moveToLocation);

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
      className="ios-fixed-container"
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 3000,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {/* Global Offline Banner */}
      <GlobalOfflineBanner />

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
            <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
          </button>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
            }}
          >
            Atur Lokasi Tanam
          </h1>

          {/* Add Location Button - Plus Icon */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              position: 'absolute',
              right: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#7CB342',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={20} weight="bold" color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', paddingBottom: '100px', minHeight: 'calc(100vh - 100px)' }}>
        {/* Loading State - Skeleton Cards */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`skeleton-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Drag Handle Skeleton */}
                <div
                  className="skeleton-pulse"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: '#E8E8E8',
                  }}
                />
                {/* Location Info Skeleton */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: '120px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: '#E8E8E8',
                    }}
                  />
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: '80px',
                      height: '14px',
                      borderRadius: '4px',
                      backgroundColor: '#E8E8E8',
                    }}
                  />
                </div>
                {/* Delete Button Skeleton */}
                <div
                  className="skeleton-pulse"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#E8E8E8',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Error State - only show if no locations loaded */}
        {locationsError && !loading && locations.length === 0 && (
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 280px)',
              textAlign: 'center',
              padding: '40px 24px',
            }}
          >
            {/* Icon with circle background */}
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
              <MapPin size={64} weight="duotone" color="#999999" />
            </div>

            {/* Text */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.125rem',
                fontWeight: 500,
                color: '#757575',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Belum ada lokasi.
              <br />
              Tambahkan lokasi pertamamu!
            </p>
          </div>
        )}

        {/* Draggable Location List - show even if there&apos;s an error as long as we have cached data */}
        {!loading && locations.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={(locations as Location[]).map((loc) => loc.id)}
              strategy={verticalListSortingStrategy}
            >
              {(locations as Location[]).map((location) => (
                <SortableLocationCard
                  key={location.id}
                  location={location}
                  plantCount={getPlantCountForLocation(location.name)}
                  onDelete={handleDeleteLocation}
                  onEdit={handleEdit}
                  isDeleting={isDeleting}
                />
              ))}
            </SortableContext>

            {/* Drag Overlay - shows a copy of the dragged item */}
            <DragOverlay>
              {activeLocation ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4E4E7',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    opacity: 0.95,
                  }}
                >
                  <div
                    style={{
                      cursor: 'grabbing',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#7CB342',
                    }}
                  >
                    <DotsSixVertical size={24} weight="bold" />
                  </div>
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
                      {activeLocation.name}
                    </h3>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

      </div>

      {/* Save Button - Fixed at bottom */}
      {!loading && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F0F0F0',
            zIndex: 100,
          }}
        >
          <button
            onClick={() => {
              if (isNested) {
                // If nested (e.g., from AddPlantForm), just close the modal
                onBack();
              } else {
                // If standalone page, navigate back with success toast
                window.location.href = '/?toast=lokasi-saved';
              }
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#7CB342',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
            }}
          >
            Simpan
          </button>
        </div>
      )}

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowAddModal(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            />

            {/* Modal Container - for centering */}
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
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isSubmitting && setShowAddModal(false)}
                disabled={isSubmitting}
                aria-label="Tutup"
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
                <X size={20} weight="regular" color="#757575" />
              </button>

              {/* Add Location Modal Title */}
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
                ref={addLocationInputRef}
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
                  backgroundColor: isValidNewLocation && !isSubmitting ? '#7CB342' : '#E0E0E0',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isValidNewLocation && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Location Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowEditModal(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            />

            {/* Modal Container - for centering */}
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
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isSubmitting && setShowEditModal(false)}
                disabled={isSubmitting}
                aria-label="Tutup"
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
                <X size={20} weight="regular" color="#757575" />
              </button>

              {/* Edit Location Modal Title */}
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#2C2C2C',
                  margin: '0 0 16px 0',
                }}
              >
                Edit Lokasi
              </h2>

              {/* Input */}
              <input
                ref={editLocationInputRef}
                type="text"
                placeholder="Nama lokasi (min. 2 karakter)"
                value={editLocationName}
                onChange={(e) => handleEditNameChange(e.target.value)}
                onFocus={() => setEditInputFocused(true)}
                onBlur={() => setEditInputFocused(false)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: editError
                    ? '2px solid #EF4444'
                    : editInputFocused
                      ? '2px solid #7CB342'
                      : '2px solid transparent',
                  borderRadius: '12px',
                  outline: 'none',
                  marginBottom: editError ? '8px' : '16px',
                  transition: 'border-color 200ms',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              />
              {editError && (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#EF4444',
                    margin: '0 0 16px 0',
                  }}
                >
                  {editError}
                </p>
              )}

              {/* Submit Button */}
              <button
                onClick={handleUpdateLocation}
                disabled={editLocationName.trim().length < 2 || isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: editLocationName.trim().length >= 2 && !isSubmitting ? '#7CB342' : '#E0E0E0',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: editLocationName.trim().length >= 2 && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && locationToDelete && (
          <motion.div
            className="ios-fixed-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDeleting && setShowDeleteConfirmModal(false)}
            style={{
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
                  color: '#757575',
                  margin: '0 0 24px 0',
                }}
              >
                Yakin mau hapus lokasi &quot;{locationToDelete.name}&quot;?
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
                    color: '#757575',
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
              className="ios-fixed-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowMovePlantsModal(false)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            />

            {/* Modal Container - for centering */}
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
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isDeleting && setShowMovePlantsModal(false)}
                disabled={isDeleting}
                aria-label="Tutup"
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
                <X size={20} weight="regular" color="#757575" />
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
                  color: '#757575',
                  margin: '0 0 24px 0',
                }}
              >
                Ada {getPlantCountForLocation(locationToDelete.name)} tanaman di &quot;{locationToDelete.name}&quot;.
                Mau dipindahkan kemana?
              </p>

              {/* Location Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {locations
                  .filter((loc: Location) => loc.id !== locationToDelete.id)
                  .map((location: Location) => (
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
                        <span style={{ color: '#757575', fontSize: '14px', marginLeft: '8px' }}>
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
                    color: '#757575',
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
                    backgroundColor: moveToLocation && !isDeleting ? '#7CB342' : '#E0E0E0',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: moveToLocation && !isDeleting ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isDeleting ? 'Memproses...' : 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationSettings;
