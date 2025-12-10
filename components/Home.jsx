import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddPlant from './AddPlant';
import AddPlantForm from './AddPlantForm';
import AddPlantSuccess from './AddPlantSuccess';
import PlantDetail from './PlantDetail';
import ProfileModal from './ProfileModal';
import LocationSettings from './LocationSettings';
import EditProfile from './EditProfile';
import AddLocationModal from './AddLocationModal';

// Mock plant data
const MOCK_PLANTS = [
  { id: 1, name: 'Labuh', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1605027990121-cbae9d3c0a39?w=300' },
  { id: 2, name: 'Kentang', status: 'Siap dipanen', location: 'Semua', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 3, name: 'Labuh 01', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1605027990121-cbae9d3c0a39?w=300' },
  { id: 4, name: 'Kentang Ubi', status: 'Perlu disiram', location: 'Teras', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 5, name: 'Kentang Sakit', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 6, name: 'Kentang Hama', status: 'Baik Baik Saja', location: 'Semua', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
  { id: 7, name: 'Bawang Merah', status: 'Perlu disiram', location: 'Teras', image: 'https://images.unsplash.com/photo-1587411768078-af8b0b9c8f78?w=300' },
  { id: 8, name: 'Bayam', status: 'Baik Baik Saja', location: 'Teras', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
  { id: 9, name: 'Kembang Kol', status: 'Baik Baik Saja', location: 'Balkon', image: 'https://images.unsplash.com/photo-1568584711271-e57ccf2f3679?w=300' },
  { id: 10, name: 'Bayam Awal', status: 'Baik Baik Saja', location: 'Semua', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
  { id: 11, name: 'Bayam Jokowi', status: 'Perlu disiram', location: 'Semua', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
  { id: 12, name: 'Bayam Akhir', status: 'Baik Baik Saja', location: 'Semua', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300' },
];

const Home = ({ userName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Semua');
  const [plants, setPlants] = useState(MOCK_PLANTS);

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
  const [userEmail, setUserEmail] = useState('designbydzul@gmail.com');
  const [currentUserName, setCurrentUserName] = useState(userName || 'Dzul');
  const [userPhoto, setUserPhoto] = useState(null);

  // Add Location Modal state
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  // Load user profile from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('temanTanamUserName');
    const savedEmail = localStorage.getItem('temanTanamUserEmail');
    const savedPhoto = localStorage.getItem('temanTanamUserPhoto');
    if (savedName) setCurrentUserName(savedName);
    if (savedEmail) setUserEmail(savedEmail);
    if (savedPhoto) setUserPhoto(savedPhoto);
  }, []);

  // Dynamic locations from localStorage
  const [locations, setLocations] = useState(['Semua']);

  // Load locations from localStorage on mount
  useEffect(() => {
    const loadLocations = () => {
      const savedLocations = localStorage.getItem('temanTanamLocations');
      if (savedLocations) {
        const parsed = JSON.parse(savedLocations);
        const locationNames = parsed.map((loc) => loc.name);
        setLocations(['Semua', ...locationNames]);
      } else {
        setLocations(['Semua', 'Teras', 'Balkon']);
      }
    };

    loadLocations();

    // Listen for storage changes (when LocationSettings updates)
    window.addEventListener('storage', loadLocations);
    return () => window.removeEventListener('storage', loadLocations);
  }, []);

  // Reload locations when returning from LocationSettings
  const handleLocationSettingsClose = () => {
    setShowLocationSettings(false);
    // Reload locations from localStorage
    const savedLocations = localStorage.getItem('temanTanamLocations');
    if (savedLocations) {
      const parsed = JSON.parse(savedLocations);
      const locationNames = parsed.map((loc) => loc.name);
      setLocations(['Semua', ...locationNames]);
      // Reset to 'Semua' if current selection was deleted
      if (!['Semua', ...locationNames].includes(selectedLocation)) {
        setSelectedLocation('Semua');
      }
    }
  };

  // Filter plants based on search and location
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const hasFilteredPlants = selectedLocation !== 'Semua';
  const showEmptyState = filteredPlants.length === 0;

  const handleBulkWater = () => {
    console.log('Bulk watering plants in:', selectedLocation);
    // TODO: Implement bulk watering logic
  };

  // Add Plant flow handlers
  const handleAddPlantClick = () => {
    setShowAddPlant(true);
  };

  const handleSelectSpecies = (species) => {
    setSelectedSpecies(species);
    setShowAddPlant(false);
    setShowAddPlantForm(true);
  };

  const handleFormSubmit = (plantData) => {
    // Add photo preview to plant data
    const dataWithPhoto = {
      ...plantData,
      photoPreview: plantData.photo ? URL.createObjectURL(plantData.photo) : null,
    };

    setNewPlantData(dataWithPhoto);
    setShowAddPlantForm(false);
    setShowSuccess(true);

    // Add to plants list
    const newPlant = {
      id: Date.now(),
      name: plantData.customName,
      status: 'Baru ditambahkan',
      location: plantData.location,
      image: dataWithPhoto.photoPreview || 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=300',
    };
    setPlants([newPlant, ...plants]);

    // Add custom location to locations list if it doesn't exist
    if (plantData.location && !locations.includes(plantData.location) && plantData.location !== 'Semua') {
      // This would be handled in a real app by updating global state or localStorage
      console.log('New location added:', plantData.location);
    }
  };

  const handleViewDetails = () => {
    // TODO: Navigate to plant detail page
    console.log('View details for:', newPlantData);
    setShowSuccess(false);
  };

  const handleAddNew = () => {
    setShowSuccess(false);
    setShowAddPlant(true);
    setSelectedSpecies(null);
    setNewPlantData(null);
  };

  const handleBackHome = () => {
    setShowSuccess(false);
    setSelectedSpecies(null);
    setNewPlantData(null);
  };

  // Plant Detail handlers
  const handlePlantClick = (plant) => {
    setSelectedPlant(plant);
    setShowPlantDetail(true);
  };

  const handlePlantDetailBack = () => {
    setShowPlantDetail(false);
    setSelectedPlant(null);
  };

  const handlePlantEdit = (plant) => {
    console.log('Edit plant:', plant);
    // TODO: Implement plant editing
  };

  const handlePlantDelete = (plantId) => {
    setPlants(plants.filter((p) => p.id !== plantId));
    setShowPlantDetail(false);
    setSelectedPlant(null);
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

  // Handle add location save
  const handleAddLocationSave = ({ name, selectedPlantIds }) => {
    // Get existing locations from localStorage
    const savedLocations = localStorage.getItem('temanTanamLocations');
    const existingLocations = savedLocations ? JSON.parse(savedLocations) : [];

    // Add new location
    const newLocation = {
      id: Date.now().toString(),
      name,
      emoji: '📍',
    };
    const updatedLocations = [...existingLocations, newLocation];

    // Save to localStorage
    localStorage.setItem('temanTanamLocations', JSON.stringify(updatedLocations));

    // Update local state
    setLocations(['Semua', ...updatedLocations.map((loc) => loc.name)]);

    // Update selected plants' locations
    if (selectedPlantIds.length > 0) {
      setPlants((prevPlants) =>
        prevPlants.map((plant) =>
          selectedPlantIds.includes(plant.id)
            ? { ...plant, location: name }
            : plant
        )
      );
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header - Sticky */}
      <div
        style={{
          padding: '20px 24px',
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
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-caveat), Caveat, cursive',
              fontSize: '2rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 'calc(100% - 140px)',
            }}
          >
            Halo {currentUserName}
          </h1>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* WiFi Icon Button */}
            <button
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#F1F8E9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.55a11 11 0 0114.08 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                  stroke="#2D5016"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
          }}
        >
          <input
            type="text"
            placeholder="Cari tanaman"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 50px 16px 20px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              color: '#666666',
              backgroundColor: '#FAFAFA',
              border: 'none',
              borderRadius: '12px',
              outline: 'none',
            }}
          />
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
        </div>

        {/* Location Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flex: 1,
              overflowX: 'auto',
            }}
          >
            {locations.map((location) => (
              <button
                key={location}
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

          {/* Add Location Button */}
          <button
            onClick={() => setShowAddLocationModal(true)}
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
      </div>

      {/* Plant Grid or Empty State - Scrollable */}
      <div
        style={{
          display: 'flex',
          padding: '16px 8px',
          paddingBottom: '100px',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          alignContent: 'flex-start',
          gap: '24px 0',
          flexWrap: 'wrap',
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
        }}
      >
        {showEmptyState ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {/* Plant Icon */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#F1F8E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path
                  d="M30 52.5C30 52.5 12 42 12 27C12 20.3726 17.3726 15 24 15C26.8328 15 29.4134 15.9876 31.5 17.6459C33.5866 15.9876 36.1672 15 39 15C45.6274 15 51 20.3726 51 27C51 42 33 52.5 30 52.5Z"
                  fill="#7CB342"
                />
                <path
                  d="M30 17.6459V52.5"
                  stroke="#2D5016"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
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
              Belum ada tanaman
              <br />
              ditambahkan
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
                style={{
                  display: 'flex',
                  padding: '0 8px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '1 0 0',
                  maxWidth: '33.333%',
                  cursor: 'pointer',
                }}
              >
                {/* Plant Image */}
                <div
                  style={{
                    width: '104px',
                    height: '104px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                  }}
                >
                  <img
                    src={plant.image}
                    alt={plant.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
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
                  }}
                >
                  {plant.status}
                </p>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Bulk Water Button (only show when filtered) */}
        <AnimatePresence>
          {hasFilteredPlants && selectedLocation !== 'Semua' && !showEmptyState && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={handleBulkWater}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '2px solid #7CB342',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 28c-4.418 0-8-3.134-8-7 0-4 8-13 8-13s8 9 8 13c0 3.866-3.582 7-8 7z"
                  fill="#7CB342"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Add Plant Button */}
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
      </div>

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
        <LocationSettings onBack={handleLocationSettingsClose} />
      )}

      {/* Edit Profile */}
      {showEditProfile && (
        <EditProfile
          onBack={() => setShowEditProfile(false)}
          userName={currentUserName}
          userEmail={userEmail}
          userPhoto={userPhoto}
          onSave={handleProfileSave}
        />
      )}

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        plants={plants}
        onSave={handleAddLocationSave}
      />
    </div>
  );
};

export default Home;
