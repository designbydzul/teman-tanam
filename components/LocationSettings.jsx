import React, { useState, useEffect } from 'react';
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

const SortableLocationCard = ({ location, onDelete }) => {
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
          {location.plantCount > 0 && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#666666',
                margin: '4px 0 0 0',
              }}
            >
              {location.plantCount} tanaman
            </p>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(location)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Trash size={20} weight="bold" color="#DC2626" />
        </button>
      </div>
    </div>
  );
};

const LocationSettings = ({ onBack, onLocationDeleted, onLocationAdded }) => {
  const [locations, setLocations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showMovePlantsModal, setShowMovePlantsModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [moveToLocation, setMoveToLocation] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

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

  useEffect(() => {
    // Load locations from localStorage
    const savedLocations = localStorage.getItem('temanTanamLocations');
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    } else {
      // Default locations
      const defaultLocations = [
        { id: '1', name: 'Balkon', plantCount: 3 },
        { id: '2', name: 'Teras', plantCount: 2 },
        { id: '3', name: 'Dapur', plantCount: 0 },
      ];
      setLocations(defaultLocations);
      localStorage.setItem('temanTanamLocations', JSON.stringify(defaultLocations));
    }
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocations((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newLocations = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('temanTanamLocations', JSON.stringify(newLocations));
        return newLocations;
      });
    }
  };

  const handleAddLocation = () => {
    if (newLocationName.trim().length >= 2) {
      const locationName = newLocationName.trim();
      const newLocation = {
        id: Date.now().toString(),
        name: locationName,
        plantCount: 0,
      };
      const updatedLocations = [...locations, newLocation];
      setLocations(updatedLocations);
      localStorage.setItem('temanTanamLocations', JSON.stringify(updatedLocations));
      setNewLocationName('');
      setShowAddModal(false);
      // Callback to show toast
      if (onLocationAdded) {
        onLocationAdded(locationName);
      }
    }
  };

  const handleDeleteLocation = (location) => {
    setLocationToDelete(location);
    if (location.plantCount > 0) {
      setShowMovePlantsModal(true);
    } else {
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDelete = () => {
    if (locationToDelete) {
      const deletedLocationName = locationToDelete.name;
      const updatedLocations = locations.filter((loc) => loc.id !== locationToDelete.id);
      setLocations(updatedLocations);
      localStorage.setItem('temanTanamLocations', JSON.stringify(updatedLocations));
      setLocationToDelete(null);
      setShowDeleteConfirmModal(false);
      // Callback to show toast
      if (onLocationDeleted) {
        onLocationDeleted(deletedLocationName);
      }
    }
  };

  const handleMovePlants = () => {
    if (locationToDelete && moveToLocation) {
      const deletedLocationName = locationToDelete.name;
      // Move plants to selected location
      const updatedLocations = locations.map((loc) => {
        if (loc.id === moveToLocation) {
          return { ...loc, plantCount: loc.plantCount + (locationToDelete.plantCount || 0) };
        }
        if (loc.id === locationToDelete.id) {
          return { ...loc, plantCount: 0 };
        }
        return loc;
      });

      // Remove the location after moving plants
      const finalLocations = updatedLocations.filter((loc) => loc.id !== locationToDelete.id);
      setLocations(finalLocations);
      localStorage.setItem('temanTanamLocations', JSON.stringify(finalLocations));

      // Reset state
      setLocationToDelete(null);
      setMoveToLocation('');
      setShowMovePlantsModal(false);

      // Callback to show toast
      if (onLocationDeleted) {
        onLocationDeleted(deletedLocationName);
      }
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
        {/* Draggable Location List */}
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
                onDelete={handleDeleteLocation}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add New Location Button */}
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
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
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
                onClick={() => setShowAddModal(false)}
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
                  cursor: 'pointer',
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
                onChange={(e) => setNewLocationName(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  color: '#2C2C2C',
                  backgroundColor: '#FAFAFA',
                  border: inputFocused || newLocationName.length >= 2 ? '2px solid #7CB342' : '2px solid transparent',
                  borderRadius: '12px',
                  outline: 'none',
                  marginBottom: '16px',
                  transition: 'border-color 200ms',
                }}
              />

              {/* Submit Button */}
              <button
                onClick={handleAddLocation}
                disabled={newLocationName.trim().length < 2}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor:
                    newLocationName.trim().length >= 2 ? '#7CB342' : '#CCCCCC',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: newLocationName.trim().length >= 2 ? 'pointer' : 'not-allowed',
                }}
              >
                Simpan
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
            onClick={() => setShowDeleteConfirmModal(false)}
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
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
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
                    cursor: 'pointer',
                  }}
                >
                  Hapus
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
              onClick={() => setShowMovePlantsModal(false)}
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
                onClick={() => setShowMovePlantsModal(false)}
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
                  cursor: 'pointer',
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
                Ada {locationToDelete.plantCount} tanaman di "{locationToDelete.name}".
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
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {location.name}
                      {location.plantCount > 0 && (
                        <span style={{ color: '#666666', fontSize: '14px', marginLeft: '8px' }}>
                          ({location.plantCount} tanaman)
                        </span>
                      )}
                    </button>
                  ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowMovePlantsModal(false)}
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
                  onClick={handleMovePlants}
                  disabled={!moveToLocation}
                  style={{
                    flex: 1,
                    padding: '14px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: moveToLocation ? '#7CB342' : '#CCCCCC',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: moveToLocation ? 'pointer' : 'not-allowed',
                  }}
                >
                  Pindahkan & Hapus
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
