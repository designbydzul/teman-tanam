'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { differenceInDays, isToday, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  saveToCache,
  getFromCache,
  addToSyncQueue,
  generateTempId,
  getSyncQueueCount,
} from '@/lib/offlineStorage';
import { syncAll } from '@/lib/syncService';

// Helper to validate UUID format
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Map species names to emojis (since DB doesn't have icon column)
const SPECIES_EMOJI_MAP = {
  'labuh': '🎃',
  'kentang': '🥔',
  'wortel': '🥕',
  'brokoli': '🥦',
  'kacang hijau': '🫘',
  'paprika': '🫑',
  'bawang merah': '🧅',
  'bayam': '🥬',
  'kembang kol': '🥬',
  'tomat': '🍅',
  'kubis': '🥬',
  'terong': '🍆',
  'cabai': '🌶️',
  'jagung': '🌽',
  'selada': '🥗',
  'mentimun': '🥒',
  'timun': '🥒',
  'bawang putih': '🧄',
  'labu siam': '🥒',
  'kangkung': '🥬',
  'sawi': '🥬',
  'seledri': '🥬',
};

// Get emoji for species by name (case insensitive)
const getSpeciesEmoji = (speciesName) => {
  if (!speciesName) return '🌱';
  const normalized = speciesName.toLowerCase().trim();
  return SPECIES_EMOJI_MAP[normalized] || '🌱';
};

/**
 * usePlants Hook
 *
 * Fetches and manages user's plants from Supabase.
 * - Joins with plant_species for species info
 * - Joins with locations for location name
 * - Gets last action date for status calculation
 */
const PLANTS_CACHE_KEY = 'plants';

export function usePlants() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [pendingCount, setPendingCount] = useState(0);
  const wasOfflineRef = useRef(!isOnline);

  // Calculate care status for watering or fertilizing
  const calculateCareStatus = (lastActionDate, frequencyDays, actionType = 'siram') => {
    const actionLabel = actionType === 'siram' ? 'disiram' : 'dipupuk';
    const needsLabel = actionType === 'siram' ? 'Perlu disiram' : 'Perlu dipupuk';

    // Default frequency if not specified
    const frequency = frequencyDays || (actionType === 'siram' ? 3 : 14);

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
    const daysUntilNext = Math.max(0, frequency - daysSinceLast);

    if (doneToday) {
      return {
        status: 'done_today',
        label: `Sudah ${actionLabel} hari ini`,
        daysUntilNext: frequency,
        daysSinceLast: 0,
        doneToday: true,
      };
    }

    if (daysSinceLast >= frequency) {
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

  // Calculate harvest status based on planted_date and days_to_harvest
  const calculateHarvestStatus = (plantedDate, daysToHarvest, category) => {
    // Only applicable to harvestable plants (vegetables, fruits, herbs)
    // Skip ornamental plants
    const harvestableCategories = ['sayuran', 'buah', 'rempah', 'vegetable', 'fruit', 'herb'];
    const isHarvestable = category && harvestableCategories.some(cat =>
      category.toLowerCase().includes(cat)
    );

    if (!isHarvestable || !daysToHarvest || !plantedDate) {
      return { isReadyToHarvest: false, daysUntilHarvest: null };
    }

    const planted = new Date(plantedDate);
    const today = startOfDay(new Date());
    const plantedDay = startOfDay(planted);
    const daysSincePlanted = differenceInDays(today, plantedDay);
    const daysUntilHarvest = Math.max(0, daysToHarvest - daysSincePlanted);

    return {
      isReadyToHarvest: daysSincePlanted >= daysToHarvest,
      daysUntilHarvest,
      daysSincePlanted,
    };
  };

  // Calculate overall plant status (for display on cards)
  const calculateOverallStatus = (wateringStatus, fertilizingStatus, harvestStatus) => {
    // Priority: needs_action (watering) > needs_action (fertilizing) > siap dipanen > on_schedule
    if (wateringStatus.status === 'needs_action') {
      return { status: 'Perlu disiram', color: '#F57C00' }; // Orange
    }
    if (fertilizingStatus.status === 'needs_action') {
      return { status: 'Perlu dipupuk', color: '#F57C00' }; // Orange
    }
    if (harvestStatus?.isReadyToHarvest) {
      return { status: 'Siap dipanen', color: '#4CAF50' }; // Green (harvest ready)
    }
    return { status: 'Terawat', color: '#7CB342' }; // Green
  };

  // Transform raw plant data to match the expected format
  const transformPlantData = useCallback((plantsData, actionsMap = {}) => {
    return (plantsData || []).map(plant => {
      const species = plant.plant_species;
      const location = plant.locations;
      const actions = actionsMap[plant.id] || {};

      // Get care schedule from species (with defaults)
      const wateringFrequencyDays = species?.watering_frequency_days || 3;
      const fertilizingFrequencyDays = species?.fertilizing_frequency_days || 14;
      const daysToHarvest = species?.days_to_harvest || null;

      // Calculate care statuses
      const wateringStatus = calculateCareStatus(actions.siram, wateringFrequencyDays, 'siram');
      const fertilizingStatus = calculateCareStatus(actions.pupuk, fertilizingFrequencyDays, 'pupuk');
      const plantedDate = plant.planted_date || plant.created_at;
      const harvestStatus = calculateHarvestStatus(plantedDate, daysToHarvest, species?.category);
      const overallStatus = calculateOverallStatus(wateringStatus, fertilizingStatus, harvestStatus);

      // Parse species info from notes if available (stored as <!--species:{...}-->)
      let storedSpeciesInfo = null;
      let cleanNotes = plant.notes || '';
      const speciesMatch = cleanNotes.match(/<!--species:(\{.*?\})-->/);
      if (speciesMatch) {
        try {
          storedSpeciesInfo = JSON.parse(speciesMatch[1]);
          cleanNotes = cleanNotes.replace(speciesMatch[0], ''); // Remove species tag from notes
        } catch (e) {
          console.warn('[usePlants] Failed to parse stored species info:', e);
        }
      }

      // Get emoji - priority: stored emoji > species from DB > plant name lookup
      const plantName = plant.name || species?.common_name || 'Tanaman';
      let speciesEmoji;
      if (storedSpeciesInfo?.speciesEmoji) {
        speciesEmoji = storedSpeciesInfo.speciesEmoji;
      } else if (species) {
        speciesEmoji = getSpeciesEmoji(species.common_name);
      } else if (storedSpeciesInfo?.speciesName) {
        speciesEmoji = getSpeciesEmoji(storedSpeciesInfo.speciesName);
      } else {
        speciesEmoji = getSpeciesEmoji(plantName);
      }

      return {
        id: plant.id,
        name: plantName,
        customName: plant.name,
        status: overallStatus.status,
        statusColor: overallStatus.color,
        location: location?.name || 'Semua',
        locationId: plant.location_id,
        image: plant.photo_url || null,
        species: species ? {
          id: species.id,
          name: species.common_name,
          scientific: species.latin_name,
          category: species.category,
          quickTips: species.quick_tips,
          emoji: speciesEmoji,
          wateringFrequencyDays,
          fertilizingFrequencyDays,
          daysToHarvest,
        } : {
          // Provide fallback species object with emoji based on plant name
          emoji: speciesEmoji,
          wateringFrequencyDays: 3,
          fertilizingFrequencyDays: 14,
          daysToHarvest: null,
        },
        plantedDate: plant.planted_date ? new Date(plant.planted_date) : new Date(plant.created_at),
        lastWatered: actions.siram ? new Date(actions.siram) : null,
        lastFertilized: actions.pupuk ? new Date(actions.pupuk) : null,
        // Care status details
        wateringStatus,
        fertilizingStatus,
        harvestStatus,
        notes: cleanNotes, // Use cleaned notes (without species tag)
        createdAt: new Date(plant.created_at),
        // Offline flags
        isOffline: plant.isOffline || false,
        pendingSync: plant.pendingSync || false,
      };
    });
  }, []);

  // Fetch plants from Supabase (online) or cache (offline)
  const fetchPlants = useCallback(async () => {
    if (!user?.id) {
      setPlants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Update pending count
    setPendingCount(getSyncQueueCount());

    try {
      // OFFLINE MODE: Load from cache
      if (!isOnline) {
        console.log('[usePlants] OFFLINE: Loading from cache');
        const cached = getFromCache(PLANTS_CACHE_KEY);

        if (cached?.data) {
          console.log('[usePlants] OFFLINE: Found cached plants:', cached.data.length);
          setPlants(cached.data);
          setError(null);
        } else {
          console.log('[usePlants] OFFLINE: No cached data available');
          setPlants([]);
          setError('Tidak ada data tersimpan. Hubungkan ke internet untuk memuat tanaman.');
        }
        setLoading(false);
        return;
      }

      // ONLINE MODE: Fetch from Supabase
      console.log('[usePlants] ONLINE: Fetching plants for user:', user.id);

      // Fetch plants with joins
      // First try with days_to_harvest column, fallback without it if column doesn't exist
      let plantsData = null;
      let plantsError = null;

      // Try query with days_to_harvest first
      const queryWithHarvest = await supabase
        .from('plants')
        .select(`
          *,
          plant_species (
            id,
            common_name,
            latin_name,
            category,
            quick_tips,
            watering_frequency_days,
            fertilizing_frequency_days,
            days_to_harvest
          ),
          locations (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryWithHarvest.error) {
        // If error (likely column doesn't exist), try without days_to_harvest
        console.warn('[usePlants] Query with days_to_harvest failed, trying without:', queryWithHarvest.error.message);

        const queryWithoutHarvest = await supabase
          .from('plants')
          .select(`
            *,
            plant_species (
              id,
              common_name,
              latin_name,
              category,
              quick_tips,
              watering_frequency_days,
              fertilizing_frequency_days
            ),
            locations (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        plantsData = queryWithoutHarvest.data;
        plantsError = queryWithoutHarvest.error;
      } else {
        plantsData = queryWithHarvest.data;
        plantsError = queryWithHarvest.error;
      }

      if (plantsError) {
        console.error('[usePlants] Error fetching plants with joins:', plantsError);
        throw plantsError;
      }

      console.log('[usePlants] Raw plants data with joins:', plantsData);
      console.log('[usePlants] Plants count:', plantsData?.length);

      // Fetch last actions for each plant
      const plantIds = plantsData?.map(p => p.id) || [];
      let actionsMap = {};

      if (plantIds.length > 0) {
        const { data: actionsData, error: actionsError } = await supabase
          .from('actions')
          .select('plant_id, action_type, action_date')
          .in('plant_id', plantIds)
          .order('action_date', { ascending: false });

        if (actionsError) {
          console.warn('[usePlants] Error fetching actions:', actionsError);
        } else if (actionsData) {
          // Group actions by plant_id and get the latest of each type
          actionsData.forEach(action => {
            if (!actionsMap[action.plant_id]) {
              actionsMap[action.plant_id] = {};
            }
            if (!actionsMap[action.plant_id][action.action_type]) {
              actionsMap[action.plant_id][action.action_type] = action.action_date;
            }
          });
        }
      }

      // Transform data
      const transformedPlants = transformPlantData(plantsData, actionsMap);

      console.log('[usePlants] Transformed plants:', transformedPlants);
      setPlants(transformedPlants);

      // Save to cache for offline use
      saveToCache(PLANTS_CACHE_KEY, transformedPlants);
      console.log('[usePlants] Saved plants to cache');

    } catch (err) {
      console.error('[usePlants] Error:', err);

      // Try to load from cache as fallback
      const cached = getFromCache(PLANTS_CACHE_KEY);
      if (cached?.data) {
        console.log('[usePlants] Using cached data as fallback');
        setPlants(cached.data);
        setError('Menggunakan data tersimpan. Gagal memuat data terbaru.');
      } else {
        setError(err.message || 'Gagal memuat tanaman');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline, transformPlantData]);

  // Initial fetch
  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Upload photo to Supabase Storage
  const uploadPhoto = async (photoBlob, plantId) => {
    if (!photoBlob || !user?.id) {
      return null;
    }

    try {
      const timestamp = Date.now();
      const filePath = `${user.id}/${plantId}/${timestamp}.jpg`;

      console.log('[usePlants] uploadPhoto: Uploading to path:', filePath);
      console.log('[usePlants] uploadPhoto: Blob size:', (photoBlob.size / 1024).toFixed(1), 'KB');

      const { data, error } = await supabase.storage
        .from('plant-photos')
        .upload(filePath, photoBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('[usePlants] uploadPhoto: Upload error:', error);
        throw error;
      }

      console.log('[usePlants] uploadPhoto: Upload success:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(filePath);

      console.log('[usePlants] uploadPhoto: Public URL:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (err) {
      console.error('[usePlants] uploadPhoto: Error:', err);
      return null;
    }
  };

  // Convert blob to base64 for offline storage
  const blobToBase64 = async (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Add a new plant
  const addPlant = async (plantData) => {
    if (!user?.id) {
      console.error('[usePlants] addPlant: No user ID');
      return { success: false, error: 'User not authenticated' };
    }

    // Store species info in notes as JSON if species name provided
    let notesWithSpecies = plantData.notes || '';
    if (plantData.speciesName) {
      const speciesInfo = JSON.stringify({
        speciesName: plantData.speciesName,
        speciesEmoji: plantData.speciesEmoji || '🌱',
      });
      notesWithSpecies = `<!--species:${speciesInfo}-->${notesWithSpecies}`;
    }

    // OFFLINE MODE: Save locally and queue for sync
    if (!isOnline) {
      try {
        console.log('[usePlants] OFFLINE: Adding plant locally');

        const tempId = generateTempId();
        const now = new Date();

        // Convert photo to base64 if present
        let offlinePhoto = null;
        if (plantData.photoBlob) {
          try {
            offlinePhoto = await blobToBase64(plantData.photoBlob);
          } catch (e) {
            console.warn('[usePlants] Failed to convert photo to base64:', e);
          }
        }

        // Create local plant data
        const localPlant = {
          id: tempId,
          user_id: user.id,
          species_id: plantData.speciesId || null,
          location_id: plantData.locationId || null,
          name: plantData.customName || plantData.name,
          photo_url: offlinePhoto, // Use base64 for local display
          planted_date: plantData.plantedDate || now.toISOString(),
          notes: notesWithSpecies || null,
          status: 'active',
          created_at: now.toISOString(),
          isOffline: true,
          pendingSync: true,
        };

        // Add to sync queue
        const queueItem = addToSyncQueue({
          type: 'plant',
          action: 'create',
          data: {
            ...localPlant,
            offlinePhoto: offlinePhoto,
          },
        });

        console.log('[usePlants] OFFLINE: Added to sync queue:', queueItem);

        // Update local state immediately
        const transformedPlant = transformPlantData([localPlant])[0];
        setPlants(prev => [transformedPlant, ...prev]);

        // Update cache
        const cached = getFromCache(PLANTS_CACHE_KEY);
        const updatedPlants = [transformedPlant, ...(cached?.data || [])];
        saveToCache(PLANTS_CACHE_KEY, updatedPlants);

        // Update pending count
        setPendingCount(getSyncQueueCount());

        return { success: true, plant: localPlant, offline: true };
      } catch (err) {
        console.error('[usePlants] OFFLINE addPlant error:', err);
        return { success: false, error: err.message };
      }
    }

    // ONLINE MODE: Insert to Supabase
    try {
      const insertData = {
        user_id: user.id,
        species_id: plantData.speciesId || null,
        location_id: plantData.locationId || null,
        name: plantData.customName || plantData.name,
        photo_url: null,
        planted_date: plantData.plantedDate || new Date().toISOString(),
        notes: notesWithSpecies || null,
        status: 'active',
      };

      console.log('[usePlants] addPlant: Inserting data:', insertData);

      const { data, error } = await supabase
        .from('plants')
        .insert(insertData)
        .select()
        .single();

      console.log('[usePlants] addPlant: Supabase response:', { data, error });

      if (error) {
        console.error('[usePlants] addPlant: INSERT ERROR:', error);
        throw error;
      }

      console.log('[usePlants] addPlant: SUCCESS - Plant inserted:', data);

      // If there's a photo, upload it and update the plant
      if (plantData.photoBlob) {
        console.log('[usePlants] addPlant: Uploading photo...');
        const photoUrl = await uploadPhoto(plantData.photoBlob, data.id);

        if (photoUrl) {
          console.log('[usePlants] addPlant: Updating plant with photo URL:', photoUrl);
          const { error: updateError } = await supabase
            .from('plants')
            .update({ photo_url: photoUrl })
            .eq('id', data.id);

          if (updateError) {
            console.error('[usePlants] addPlant: Photo URL update error:', updateError);
          } else {
            console.log('[usePlants] addPlant: Photo URL saved successfully');
          }
        }
      }

      // Refetch to get the complete plant data with joins
      await fetchPlants();

      return { success: true, plant: data };
    } catch (err) {
      console.error('[usePlants] Error adding plant:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a plant
  const updatePlant = async (plantId, updates) => {
    try {
      const updateData = {
        updated_at: new Date().toISOString(),
      };

      if (updates.customName !== undefined || updates.name !== undefined) {
        updateData.name = updates.customName || updates.name;
      }
      if (updates.locationId !== undefined) {
        updateData.location_id = updates.locationId;
      }
      if (updates.photoUrl !== undefined) {
        updateData.photo_url = updates.photoUrl;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }

      const { data, error } = await supabase
        .from('plants')
        .update(updateData)
        .eq('id', plantId)
        .select()
        .single();

      if (error) throw error;

      await fetchPlants();
      return { success: true, plant: data };
    } catch (err) {
      console.error('[usePlants] Error updating plant:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a plant
  const deletePlant = async (plantId) => {
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      // Update local state immediately
      setPlants(prev => prev.filter(p => p.id !== plantId));
      return { success: true };
    } catch (err) {
      console.error('[usePlants] Error deleting plant:', err);
      return { success: false, error: err.message };
    }
  };

  // Record an action (water, fertilize, etc.)
  const recordAction = async (plantId, actionType, notes = null) => {
    console.log('[usePlants] recordAction called:', { plantId, actionType, notes, userId: user?.id });

    if (!user?.id) {
      console.error('[usePlants] recordAction: No user ID');
      return { success: false, error: 'User not authenticated' };
    }

    // Validate plant ID is a valid UUID before sending to Supabase
    const plantIdStr = String(plantId);
    if (!isValidUUID(plantIdStr)) {
      console.warn('[usePlants] recordAction: Invalid UUID for plant_id:', plantId);
      // For non-UUID plant IDs (created offline), update local state only
      const today = new Date();
      setPlants(prev => prev.map(plant => {
        if (plant.id === plantId) {
          const updates = { ...plant };
          if (actionType === 'siram') {
            updates.lastWatered = today;
            updates.status = 'Baik Baik Saja';
          } else if (actionType === 'pupuk') {
            updates.lastFertilized = today;
          }
          return updates;
        }
        return plant;
      }));
      return { success: true, offline: true, message: 'Action recorded locally for offline plant' };
    }

    // Format date as YYYY-MM-DD for the date column type
    const today = new Date();
    const actionDate = today.toISOString().split('T')[0];

    // OFFLINE MODE: Save locally and queue for sync
    if (!isOnline) {
      try {
        console.log('[usePlants] OFFLINE: Recording action locally');

        const tempId = generateTempId();

        // Convert photo to base64 if present
        let offlinePhoto = null;
        if (photoBlob) {
          try {
            offlinePhoto = await blobToBase64(photoBlob);
          } catch (e) {
            console.warn('[usePlants] Failed to convert action photo to base64:', e);
          }
        }

        const actionData = {
          id: tempId,
          plant_id: plantId,
          user_id: user.id,
          action_type: actionType,
          action_date: actionDate,
          isOffline: true,
          pendingSync: true,
        };

        // Add to sync queue
        const queueItem = addToSyncQueue({
          type: 'action',
          action: 'create',
          data: {
            ...actionData,
            offlinePhoto: offlinePhoto,
          },
        });

        console.log('[usePlants] OFFLINE: Added action to sync queue:', queueItem);

        // Update local plant state to reflect the action
        setPlants(prev => prev.map(plant => {
          if (plant.id === plantId) {
            const updates = { ...plant };
            if (actionType === 'siram') {
              updates.lastWatered = new Date(actionDate);
              updates.status = 'Baik Baik Saja';
            } else if (actionType === 'pupuk') {
              updates.lastFertilized = new Date(actionDate);
            }
            return updates;
          }
          return plant;
        }));

        // Update cache with new plant states
        const cached = getFromCache(PLANTS_CACHE_KEY);
        if (cached?.data) {
          const updatedCache = cached.data.map(plant => {
            if (plant.id === plantId) {
              const updates = { ...plant };
              if (actionType === 'siram') {
                updates.lastWatered = new Date(actionDate);
                updates.status = 'Baik Baik Saja';
              } else if (actionType === 'pupuk') {
                updates.lastFertilized = new Date(actionDate);
              }
              return updates;
            }
            return plant;
          });
          saveToCache(PLANTS_CACHE_KEY, updatedCache);
        }

        // Update pending count
        setPendingCount(getSyncQueueCount());

        return { success: true, action: actionData, offline: true };
      } catch (err) {
        console.error('[usePlants] OFFLINE recordAction error:', err);
        return { success: false, error: err.message };
      }
    }

    // ONLINE MODE: Insert to Supabase
    const insertData = {
      plant_id: plantId,
      user_id: user.id,
      action_type: actionType,
      action_date: actionDate,
    };

    // Add notes if provided
    if (notes && notes.trim()) {
      insertData.notes = notes.trim();
    }

    console.log('[usePlants] recordAction: Inserting data:', insertData);

    try {
      const { data, error } = await supabase
        .from('actions')
        .insert(insertData)
        .select()
        .single();

      console.log('[usePlants] recordAction: Supabase response:', { data, error });

      if (error) {
        console.error('[usePlants] recordAction: INSERT ERROR:', error);
        throw error;
      }

      console.log('[usePlants] recordAction: SUCCESS - Action recorded:', data);

      // Refetch to update statuses
      await fetchPlants();

      return { success: true, action: data };
    } catch (err) {
      console.error('[usePlants] Error recording action:', err);
      return { success: false, error: err.message };
    }
  };

  // Sync pending items to Supabase
  const syncNow = async () => {
    if (!isOnline) {
      console.log('[usePlants] syncNow: Cannot sync while offline');
      return { success: false, error: 'No internet connection' };
    }

    const queueCount = getSyncQueueCount();
    if (queueCount === 0) {
      console.log('[usePlants] syncNow: No items to sync');
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    console.log('[usePlants] syncNow: Starting sync of', queueCount, 'items');
    setSyncStatus('syncing');

    try {
      const result = await syncAll();

      if (result.success) {
        setSyncStatus('success');
        console.log('[usePlants] syncNow: Sync completed successfully');

        // Refresh plants from Supabase to get real IDs and updated data
        await fetchPlants();
      } else {
        setSyncStatus('error');
        console.warn('[usePlants] syncNow: Sync completed with errors:', result.errors);
      }

      // Update pending count
      setPendingCount(getSyncQueueCount());

      // Reset status after a delay
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);

      return result;
    } catch (err) {
      console.error('[usePlants] syncNow error:', err);
      setSyncStatus('error');

      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);

      return { success: false, synced: 0, failed: 0, errors: [{ error: err.message }] };
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    // Check if we just came back online
    if (isOnline && wasOfflineRef.current) {
      const queueCount = getSyncQueueCount();
      if (queueCount > 0) {
        console.log('[usePlants] Back online with', queueCount, 'pending items. Auto-syncing...');
        syncNow();
      }
    }

    // Update ref for next check
    wasOfflineRef.current = !isOnline;
  }, [isOnline]);

  // Update pending count on mount
  useEffect(() => {
    setPendingCount(getSyncQueueCount());
  }, []);

  return {
    plants,
    loading,
    error,
    refetch: fetchPlants,
    addPlant,
    updatePlant,
    deletePlant,
    recordAction,
    // Offline support
    isOnline,
    syncStatus,
    pendingCount,
    syncNow,
  };
}

export default usePlants;
