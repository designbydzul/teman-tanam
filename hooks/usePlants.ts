'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
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
import { createDebugger } from '@/lib/debug';
import { compressImage, compressImageToBase64 } from '@/lib/imageUtils';
import {
  ACTION_TYPES,
  PLANT_STATUS,
  STATUS_COLORS,
  HARVESTABLE_CATEGORIES,
  DEFAULT_CARE_FREQUENCY,
  CACHE_KEYS,
  TIMEOUTS,
  getSpeciesEmoji,
  isValidUUID,
} from '@/lib/constants';
import type {
  Plant,
  PlantRaw,
  CareStatus,
  HarvestStatus,
  AddPlantData,
  UpdatePlantData,
  UsePlantsReturn,
} from '@/types';

const debug = createDebugger('usePlants');

type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

// Actions map type
type ActionsMap = Record<string, Record<string, string>>;

/**
 * usePlants Hook
 *
 * Fetches and manages user's plants from Supabase.
 */
export function usePlants(): UsePlantsReturn {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const wasOfflineRef = useRef(!isOnline);

  // Calculate care status for watering or fertilizing
  const calculateCareStatus = (
    lastActionDate: string | null | undefined,
    frequencyDays: number | null | undefined,
    actionType: ActionType = ACTION_TYPES.WATER
  ): CareStatus => {
    const actionLabel = actionType === ACTION_TYPES.WATER ? 'disiram' : 'dipupuk';
    const needsLabel = actionType === ACTION_TYPES.WATER ? PLANT_STATUS.NEEDS_WATERING : PLANT_STATUS.NEEDS_FERTILIZING;

    const frequency = frequencyDays || (actionType === ACTION_TYPES.WATER ? DEFAULT_CARE_FREQUENCY.WATERING : DEFAULT_CARE_FREQUENCY.FERTILIZING);

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

  // Calculate harvest status
  const calculateHarvestStatus = (
    startedDate: string | null | undefined,
    daysToHarvest: number | null | undefined,
    category: string | null | undefined
  ): HarvestStatus => {
    const isHarvestable = category && HARVESTABLE_CATEGORIES.some(cat =>
      category.toLowerCase().includes(cat)
    );

    if (!isHarvestable || !daysToHarvest || !startedDate) {
      return { isReadyToHarvest: false, daysUntilHarvest: null };
    }

    const started = new Date(startedDate);
    const today = startOfDay(new Date());
    const startedDay = startOfDay(started);
    const daysSinceStarted = differenceInDays(today, startedDay);
    const daysUntilHarvest = Math.max(0, daysToHarvest - daysSinceStarted);

    return {
      isReadyToHarvest: daysSinceStarted >= daysToHarvest,
      daysUntilHarvest,
      daysSinceStarted,
    };
  };

  // Calculate overall plant status
  const calculateOverallStatus = (
    wateringStatus: CareStatus,
    fertilizingStatus: CareStatus,
    harvestStatus: HarvestStatus
  ): { status: string; color: string } => {
    if (wateringStatus.status === 'needs_action') {
      return { status: PLANT_STATUS.NEEDS_WATERING, color: STATUS_COLORS[PLANT_STATUS.NEEDS_WATERING] };
    }
    if (fertilizingStatus.status === 'needs_action') {
      return { status: PLANT_STATUS.NEEDS_FERTILIZING, color: STATUS_COLORS[PLANT_STATUS.NEEDS_FERTILIZING] };
    }
    if (harvestStatus?.isReadyToHarvest) {
      return { status: PLANT_STATUS.READY_TO_HARVEST, color: STATUS_COLORS[PLANT_STATUS.READY_TO_HARVEST] };
    }
    return { status: PLANT_STATUS.HEALTHY, color: STATUS_COLORS[PLANT_STATUS.HEALTHY] };
  };

  // Transform raw plant data to match the expected format
  const transformPlantData = useCallback((plantsData: PlantRaw[], actionsMap: ActionsMap = {}): Plant[] => {
    return (plantsData || []).map(plant => {
      const species = plant.plant_species;
      const location = plant.locations;
      const actions = actionsMap[plant.id] || {};

      // Species defaults
      const speciesWateringDays = species?.watering_frequency_days || DEFAULT_CARE_FREQUENCY.WATERING;
      const speciesFertilizingDays = species?.fertilizing_frequency_days || DEFAULT_CARE_FREQUENCY.FERTILIZING;

      // Use custom frequency if set, otherwise use species default
      const wateringFrequencyDays = plant.custom_watering_days ?? speciesWateringDays;
      const fertilizingFrequencyDays = plant.custom_fertilizing_days ?? speciesFertilizingDays;

      const wateringStatus = calculateCareStatus(actions[ACTION_TYPES.WATER], wateringFrequencyDays, ACTION_TYPES.WATER);
      const fertilizingStatus = calculateCareStatus(actions[ACTION_TYPES.FERTILIZE], fertilizingFrequencyDays, ACTION_TYPES.FERTILIZE);
      const startedDate = plant.started_date || plant.created_at;
      // Harvest status - use harvest_signs for harvestable categories
      const harvestStatus = calculateHarvestStatus(startedDate, null, species?.category);
      const overallStatus = calculateOverallStatus(wateringStatus, fertilizingStatus, harvestStatus);

      // Parse species info from notes if available
      let storedSpeciesInfo: { speciesEmoji?: string; speciesName?: string } | null = null;
      let cleanNotes = plant.notes || '';
      const speciesMatch = cleanNotes.match(/<!--species:(\{.*?\})-->/);
      if (speciesMatch) {
        try {
          storedSpeciesInfo = JSON.parse(speciesMatch[1]);
          cleanNotes = cleanNotes.replace(speciesMatch[0], '');
        } catch {
          debug.warn('Failed to parse stored species info');
        }
      }

      const plantName = plant.name || species?.common_name || 'Tanaman';
      let speciesEmoji: string;
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
          imageUrl: species.image_url || null,
          emoji: speciesEmoji,
          wateringFrequencyDays: speciesWateringDays,
          fertilizingFrequencyDays: speciesFertilizingDays,
          // New fields
          difficultyLevel: species.difficulty_level,
          sunRequirement: species.sun_requirement,
          growingSeason: species.growing_season,
          harvestSigns: species.harvest_signs,
          careSummary: species.care_summary,
        } : {
          emoji: speciesEmoji,
          wateringFrequencyDays: DEFAULT_CARE_FREQUENCY.WATERING,
          fertilizingFrequencyDays: DEFAULT_CARE_FREQUENCY.FERTILIZING,
        },
        // Custom frequencies (null = use species default)
        customWateringDays: plant.custom_watering_days ?? null,
        customFertilizingDays: plant.custom_fertilizing_days ?? null,
        startedDate: plant.started_date ? new Date(plant.started_date) : new Date(plant.created_at),
        lastWatered: actions[ACTION_TYPES.WATER] ? new Date(actions[ACTION_TYPES.WATER]) : null,
        lastFertilized: actions[ACTION_TYPES.FERTILIZE] ? new Date(actions[ACTION_TYPES.FERTILIZE]) : null,
        wateringStatus,
        fertilizingStatus,
        harvestStatus,
        notes: cleanNotes,
        createdAt: new Date(plant.created_at),
        isOffline: plant.isOffline || false,
        pendingSync: plant.pendingSync || false,
      };
    });
  }, []);

  // Fetch plants from Supabase or cache
  const fetchPlants = useCallback(async () => {
    if (!user?.id) {
      setPlants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPendingCount(getSyncQueueCount());

    try {
      // OFFLINE MODE: Load from cache
      if (!isOnline) {
        debug.log('OFFLINE: Loading from cache');
        const cached = getFromCache<Plant[]>(CACHE_KEYS.PLANTS);

        // Use startTransition to mark cached data updates as lower priority than animations
        startTransition(() => {
          if (cached?.data) {
            debug.log('OFFLINE: Found cached plants:', cached.data.length);
            setPlants(cached.data);
            setError(null);
          } else {
            debug.log('OFFLINE: No cached data available');
            setPlants([]);
            setError('Tidak ada data tersimpan. Hubungkan ke internet untuk memuat tanaman.');
          }
        });
        setLoading(false);
        return;
      }

      // ONLINE MODE: Fetch from Supabase
      debug.log('ONLINE: Fetching plants for user:', user.id);

      // Fetch plants with joins
      const { data: plantsData, error: plantsError } = await supabase
        .from('plants')
        .select(`
          *,
          plant_species (
            id,
            common_name,
            latin_name,
            category,
            image_url,
            watering_frequency_days,
            fertilizing_frequency_days,
            sun_requirement,
            difficulty_level,
            growing_season,
            harvest_signs,
            care_summary
          ),
          locations (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (plantsError) throw plantsError;

      debug.log('Plants count:', plantsData?.length);

      // Fetch last actions for each plant
      const plantIds = plantsData?.map(p => p.id) || [];
      const actionsMap: ActionsMap = {};

      if (plantIds.length > 0) {
        // OPTIMIZATION: Use RPC to fetch only the latest action per plant per action_type
        // This avoids the N+1 problem of fetching ALL actions then filtering in JS
        // PostgreSQL's DISTINCT ON efficiently returns just what we need
        // See: supabase/migrations/20260117_add_get_latest_actions_function.sql
        const { data: actionsData, error: actionsError } = await supabase
          .rpc('get_latest_actions_for_plants', { plant_ids: plantIds });

        if (actionsError) {
          debug.warn('Error fetching actions:', actionsError);
        } else if (actionsData) {
          // Build the actions map - each entry is already the latest for that type
          (actionsData as { plant_id: string; action_type: string; action_date: string }[])
            .forEach(action => {
              if (!actionsMap[action.plant_id]) {
                actionsMap[action.plant_id] = {};
              }
              actionsMap[action.plant_id][action.action_type] = action.action_date;
            });
        }
      }

      const transformedPlants = transformPlantData(plantsData || [], actionsMap);
      debug.log('Transformed plants:', transformedPlants.length);
      setPlants(transformedPlants);

      // Save to cache for offline use
      saveToCache(CACHE_KEYS.PLANTS, transformedPlants);
      debug.log('Saved plants to cache');

    } catch (err) {
      const error = err as Error;
      debug.error('Error:', error);

      const cached = getFromCache(CACHE_KEYS.PLANTS);
      if (cached?.data) {
        debug.log('Using cached data as fallback');
        setPlants(cached.data as Plant[]);
        setError('Menggunakan data tersimpan. Gagal memuat data terbaru.');
      } else {
        setError(error.message || 'Gagal memuat tanaman');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline, transformPlantData]);

  // Initial fetch
  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Upload photo to Supabase Storage (with compression)
  const uploadPhoto = async (photoBlob: Blob, plantId: string): Promise<string | null> => {
    if (!photoBlob || !user?.id) {
      return null;
    }

    try {
      // Compress image before upload if it's a File
      let blobToUpload = photoBlob;
      if (photoBlob instanceof File) {
        debug.log('uploadPhoto: Compressing before upload...');
        blobToUpload = await compressImage(photoBlob, 200, 1200, 1200);
        debug.log(`uploadPhoto: Compressed from ${(photoBlob.size / 1024).toFixed(1)}KB to ${(blobToUpload.size / 1024).toFixed(1)}KB`);
      }

      const timestamp = Date.now();
      const filePath = `${user.id}/${plantId}/${timestamp}.jpg`;

      debug.log('uploadPhoto: Uploading to path:', filePath);

      const { data, error } = await supabase.storage
        .from('plant-photos')
        .upload(filePath, blobToUpload, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        debug.error('uploadPhoto: Upload error:', error);
        throw error;
      }

      debug.log('uploadPhoto: Upload success');

      const { data: urlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      debug.error('uploadPhoto: Error:', err);
      return null;
    }
  };

  // Convert blob to base64 for offline storage (with compression)
  const blobToBase64 = async (blob: Blob): Promise<string> => {
    // If it's a File, compress it first
    if (blob instanceof File) {
      return compressImageToBase64(blob);
    }
    // For Blob, convert to base64 directly (likely already compressed)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Add a new plant
  const addPlant = async (plantData: AddPlantData) => {
    if (!user?.id) {
      debug.error('addPlant: No user ID');
      return { success: false, error: 'User not authenticated' };
    }

    // Store species info in notes
    let notesWithSpecies = plantData.notes || '';
    if (plantData.speciesName) {
      const speciesInfo = JSON.stringify({
        speciesName: plantData.speciesName,
        speciesEmoji: plantData.speciesEmoji || '🌱',
      });
      notesWithSpecies = `<!--species:${speciesInfo}-->${notesWithSpecies}`;
    }

    // OFFLINE MODE
    if (!isOnline) {
      try {
        debug.log('OFFLINE: Adding plant locally');

        const tempId = generateTempId();
        const now = new Date();

        let offlinePhoto: string | null = null;
        if (plantData.photoBlob) {
          try {
            offlinePhoto = await blobToBase64(plantData.photoBlob);
          } catch {
            debug.warn('Failed to convert photo to base64');
          }
        }

        const localPlant: PlantRaw = {
          id: tempId,
          user_id: user.id,
          species_id: plantData.speciesId || null,
          location_id: plantData.locationId || null,
          name: plantData.customName || plantData.name || null,
          photo_url: offlinePhoto,
          started_date: plantData.startedDate || now.toISOString(),
          notes: notesWithSpecies || null,
          status: 'active',
          created_at: now.toISOString(),
          updated_at: null,
          custom_watering_days: null,
          custom_fertilizing_days: null,
          isOffline: true,
          pendingSync: true,
        };

        addToSyncQueue({
          type: 'plant',
          action: 'create',
          data: {
            ...localPlant,
            offlinePhoto: offlinePhoto,
          },
        });

        const transformedPlant = transformPlantData([localPlant])[0];
        setPlants(prev => [transformedPlant, ...prev]);

        const cached = getFromCache(CACHE_KEYS.PLANTS);
        const updatedPlants = [transformedPlant, ...(cached?.data as Plant[] || [])];
        saveToCache(CACHE_KEYS.PLANTS, updatedPlants);
        setPendingCount(getSyncQueueCount());

        return { success: true, plant: localPlant, offline: true };
      } catch (err) {
        const error = err as Error;
        debug.error('OFFLINE addPlant error:', error);
        return { success: false, error: error.message };
      }
    }

    // ONLINE MODE
    try {
      const insertData = {
        user_id: user.id,
        species_id: plantData.speciesId || null,
        location_id: plantData.locationId || null,
        name: plantData.customName || plantData.name,
        photo_url: null as string | null,
        started_date: plantData.startedDate || new Date().toISOString(),
        notes: notesWithSpecies || null,
        status: 'active',
      };

      debug.log('addPlant: Inserting data', { userId: user.id, name: insertData.name });

      const { data, error } = await supabase
        .from('plants')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        debug.error('addPlant: INSERT ERROR:', error);
        throw error;
      }

      debug.log('addPlant: SUCCESS', { plantId: data.id });

      // Upload photo if present
      if (plantData.photoBlob) {
        debug.log('addPlant: Uploading photo...');
        const photoUrl = await uploadPhoto(plantData.photoBlob, data.id);

        if (photoUrl) {
          const { error: photoUpdateError } = await supabase
            .from('plants')
            .update({ photo_url: photoUrl })
            .eq('id', data.id);

          if (photoUpdateError) {
            debug.error('Failed to update plant photo URL:', photoUpdateError.message);
            // Don't fail - plant was created, just photo URL update failed
          }
        }
      }

      await fetchPlants();
      return { success: true, plant: data };
    } catch (err) {
      const error = err as Error;
      debug.error('Error adding plant:', error);
      return { success: false, error: error.message };
    }
  };

  // Update a plant
  const updatePlant = async (plantId: string, updates: UpdatePlantData) => {
    const updateData: Record<string, unknown> = {
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
    // Custom care frequencies (null to reset to species default)
    if (updates.customWateringDays !== undefined) {
      updateData.custom_watering_days = updates.customWateringDays;
    }
    if (updates.customFertilizingDays !== undefined) {
      updateData.custom_fertilizing_days = updates.customFertilizingDays;
    }

    // OFFLINE MODE
    if (!isOnline) {
      try {
        debug.log('OFFLINE: Updating plant locally', { plantId });

        // Add to sync queue
        addToSyncQueue({
          type: 'plant',
          action: 'update',
          data: {
            id: plantId,
            ...updateData,
          },
        });

        // Update local state
        setPlants(prev => prev.map(p => {
          if (p.id === plantId) {
            return {
              ...p,
              customName: updates.customName ?? updates.name ?? p.customName,
              name: updates.customName || updates.name || p.name,
              image: updates.photoUrl ?? p.image,
              notes: updates.notes ?? p.notes,
              customWateringDays: updates.customWateringDays ?? p.customWateringDays,
              customFertilizingDays: updates.customFertilizingDays ?? p.customFertilizingDays,
            };
          }
          return p;
        }));

        // Update cache
        const cached = getFromCache<Plant[]>(CACHE_KEYS.PLANTS);
        if (cached?.data) {
          const updatedPlants = cached.data.map(p => {
            if (p.id === plantId) {
              return {
                ...p,
                customName: updates.customName ?? updates.name ?? p.customName,
                name: updates.customName || updates.name || p.name,
                image: updates.photoUrl ?? p.image,
                notes: updates.notes ?? p.notes,
                customWateringDays: updates.customWateringDays ?? p.customWateringDays,
                customFertilizingDays: updates.customFertilizingDays ?? p.customFertilizingDays,
              };
            }
            return p;
          });
          saveToCache(CACHE_KEYS.PLANTS, updatedPlants);
        }

        setPendingCount(getSyncQueueCount());

        return { success: true, offline: true };
      } catch (err) {
        const error = err as Error;
        debug.error('OFFLINE updatePlant error:', error);
        return { success: false, error: error.message };
      }
    }

    // ONLINE MODE
    try {
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
      const error = err as Error;
      debug.error('Error updating plant:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a plant
  const deletePlant = async (plantId: string) => {
    // OFFLINE MODE
    if (!isOnline) {
      try {
        debug.log('OFFLINE: Deleting plant locally', { plantId });

        // Only queue for sync if it's a real UUID (not a temp ID)
        if (isValidUUID(plantId)) {
          addToSyncQueue({
            type: 'plant',
            action: 'delete',
            data: { id: plantId },
          });
        }

        // Remove from local state
        setPlants(prev => prev.filter(p => p.id !== plantId));

        // Remove from cache
        const cached = getFromCache<Plant[]>(CACHE_KEYS.PLANTS);
        if (cached?.data) {
          const updatedPlants = cached.data.filter(p => p.id !== plantId);
          saveToCache(CACHE_KEYS.PLANTS, updatedPlants);
        }

        setPendingCount(getSyncQueueCount());

        return { success: true, offline: true };
      } catch (err) {
        const error = err as Error;
        debug.error('OFFLINE deletePlant error:', error);
        return { success: false, error: error.message };
      }
    }

    // ONLINE MODE
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      setPlants(prev => prev.filter(p => p.id !== plantId));
      return { success: true };
    } catch (err) {
      const error = err as Error;
      debug.error('Error deleting plant:', error);
      return { success: false, error: error.message };
    }
  };

  // Record an action (water, fertilize, prune, etc.)
  const recordAction = async (
    plantId: string,
    actionType: ActionType,
    notes: string | null = null,
    photoFile: File | null = null
  ) => {
    debug.log('recordAction called:', { plantId, actionType, notes, hasPhoto: !!photoFile });

    if (!user?.id) {
      debug.error('recordAction: No user ID');
      return { success: false, error: 'User not authenticated' };
    }

    const plantIdStr = String(plantId);
    if (!isValidUUID(plantIdStr)) {
      debug.warn('recordAction: Invalid UUID for plant_id:', plantId);
      const today = new Date();
      setPlants(prev => prev.map(plant => {
        if (plant.id === plantId) {
          const updates = { ...plant };
          if (actionType === ACTION_TYPES.WATER) {
            updates.lastWatered = today;
            updates.status = PLANT_STATUS.HEALTHY;
          } else if (actionType === ACTION_TYPES.FERTILIZE) {
            updates.lastFertilized = today;
          }
          return updates;
        }
        return plant;
      }));
      return { success: true, offline: true };
    }

    const today = new Date();
    const actionDate = today.toISOString().split('T')[0];

    // OFFLINE MODE
    if (!isOnline) {
      try {
        debug.log('OFFLINE: Recording action locally');

        const tempId = generateTempId();
        const actionData = {
          id: tempId,
          plant_id: plantId,
          user_id: user.id,
          action_type: actionType,
          action_date: actionDate,
          isOffline: true,
          pendingSync: true,
        };

        addToSyncQueue({
          type: 'action',
          action: 'create',
          data: actionData,
        });

        setPlants(prev => prev.map(plant => {
          if (plant.id === plantId) {
            const updates = { ...plant };
            if (actionType === ACTION_TYPES.WATER) {
              updates.lastWatered = new Date(actionDate);
              updates.status = PLANT_STATUS.HEALTHY;
            } else if (actionType === ACTION_TYPES.FERTILIZE) {
              updates.lastFertilized = new Date(actionDate);
            }
            return updates;
          }
          return plant;
        }));

        const cached = getFromCache(CACHE_KEYS.PLANTS);
        if (cached?.data) {
          const updatedCache = (cached.data as Plant[]).map(plant => {
            if (plant.id === plantId) {
              const updates = { ...plant };
              if (actionType === ACTION_TYPES.WATER) {
                updates.lastWatered = new Date(actionDate);
                updates.status = PLANT_STATUS.HEALTHY;
              } else if (actionType === ACTION_TYPES.FERTILIZE) {
                updates.lastFertilized = new Date(actionDate);
              }
              return updates;
            }
            return plant;
          });
          saveToCache(CACHE_KEYS.PLANTS, updatedCache);
        }

        // Also cache the action for Riwayat tab offline viewing
        const actionsCacheKey = `${CACHE_KEYS.ACTIONS}_${plantId}`;
        const cachedActions = getFromCache<Record<string, unknown>[]>(actionsCacheKey);
        const existingActions = cachedActions?.data || [];
        // Add new action at the beginning (most recent first)
        saveToCache(actionsCacheKey, [actionData, ...existingActions]);
        debug.log('OFFLINE: Cached action for plant', plantId);

        setPendingCount(getSyncQueueCount());
        return { success: true, action: actionData, offline: true };
      } catch (err) {
        const error = err as Error;
        debug.error('OFFLINE recordAction error:', error);
        return { success: false, error: error.message };
      }
    }

    // ONLINE MODE
    const insertData: Record<string, unknown> = {
      plant_id: plantId,
      user_id: user.id,
      action_type: actionType,
      action_date: actionDate,
    };

    if (notes && notes.trim()) {
      insertData.notes = notes.trim();
    }

    // Upload photo if provided (compress first)
    if (photoFile) {
      try {
        // Compress photo before upload
        debug.log('recordAction: Compressing photo before upload...');
        const compressedBlob = await compressImage(photoFile, 200, 1200, 1200);
        debug.log(`recordAction: Compressed from ${(photoFile.size / 1024).toFixed(1)}KB to ${(compressedBlob.size / 1024).toFixed(1)}KB`);

        const fileName = `${user.id}/${plantId}/${actionType}_${Date.now()}.jpg`;

        debug.log('recordAction: Uploading photo to storage');
        const { error: uploadError } = await supabase.storage
          .from('action-photos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          debug.error('recordAction: Photo upload error:', uploadError);
          // Continue without photo if upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('action-photos')
            .getPublicUrl(fileName);
          insertData.photo_url = publicUrl;
          debug.log('recordAction: Photo uploaded:', publicUrl);
        }
      } catch (photoErr) {
        debug.error('recordAction: Photo upload exception:', photoErr);
        // Continue without photo
      }
    }

    debug.log('recordAction: Inserting data');

    try {
      const { data, error } = await supabase
        .from('actions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        debug.error('recordAction: INSERT ERROR:', error);
        throw error;
      }

      debug.log('recordAction: SUCCESS');
      await fetchPlants();
      return { success: true, action: data };
    } catch (err) {
      const error = err as Error;
      debug.error('Error recording action:', error);
      return { success: false, error: error.message };
    }
  };

  // Sync pending items to Supabase
  const syncNow = async () => {
    if (!isOnline) {
      debug.log('syncNow: Cannot sync while offline');
      return { success: false, synced: 0, failed: 0, errors: [{ error: 'No internet connection' }] };
    }

    const queueCount = getSyncQueueCount();
    if (queueCount === 0) {
      debug.log('syncNow: No items to sync');
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    debug.log('syncNow: Starting sync of items', { queueCount });
    setSyncStatus('syncing');

    try {
      const result = await syncAll();

      if (result.success) {
        setSyncStatus('success');
        debug.log('syncNow: Sync completed successfully');
        await fetchPlants();
      } else {
        setSyncStatus('error');
        debug.warn('syncNow: Sync completed with errors:', result.errors);
      }

      setPendingCount(getSyncQueueCount());

      setTimeout(() => {
        setSyncStatus('idle');
      }, TIMEOUTS.SYNC_STATUS_RESET);

      return result;
    } catch (err) {
      const error = err as Error;
      debug.error('syncNow error:', error);
      setSyncStatus('error');

      setTimeout(() => {
        setSyncStatus('idle');
      }, TIMEOUTS.SYNC_STATUS_RESET);

      return { success: false, synced: 0, failed: 0, errors: [{ error: error.message }] };
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      const queueCount = getSyncQueueCount();
      if (queueCount > 0) {
        debug.log('Back online with pending items. Auto-syncing...', { queueCount });
        syncNow();
      }
    }
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
    isOnline,
    syncStatus,
    pendingCount,
    syncNow,
  };
}

export default usePlants;
