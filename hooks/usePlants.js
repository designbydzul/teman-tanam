'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

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
export function usePlants() {
  const { user } = useAuth();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate plant status based on last watering
  const calculateStatus = (lastWateredAt, wateringFrequencyDays = 3) => {
    if (!lastWateredAt) return 'Perlu disiram';

    const lastWatered = new Date(lastWateredAt);
    const now = new Date();
    const daysSinceWatered = Math.floor((now - lastWatered) / (1000 * 60 * 60 * 24));

    if (daysSinceWatered >= wateringFrequencyDays) {
      return 'Perlu disiram';
    } else if (daysSinceWatered >= wateringFrequencyDays - 1) {
      return 'Perlu disiram besok';
    }
    return 'Baik Baik Saja';
  };

  // Fetch plants from Supabase
  const fetchPlants = useCallback(async () => {
    if (!user?.id) {
      setPlants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[usePlants] Fetching plants for user:', user.id);

      // DEBUG: First try a simple query without joins
      console.log('[usePlants] DEBUG: Testing simple query...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', user.id);

      console.log('[usePlants] DEBUG: Simple query result:', {
        data: simpleData,
        error: simpleError,
        count: simpleData?.length
      });

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
            quick_tips
          ),
          locations (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (plantsError) {
        console.error('[usePlants] Error fetching plants with joins:', plantsError);
        console.error('[usePlants] Error details:', JSON.stringify(plantsError, null, 2));
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
          // action_type values: 'siram', 'pupuk', 'pangkas', 'panen'
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

      // Transform data to match the expected format
      const transformedPlants = (plantsData || []).map(plant => {
        const species = plant.plant_species;
        const location = plant.locations;
        const actions = actionsMap[plant.id] || {};

        // Default watering frequency of 3 days since it's not in the schema
        const wateringFrequency = 3;
        const status = calculateStatus(actions.siram, wateringFrequency);

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
          status: plant.status || status,
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
          } : {
            // Provide fallback species object with emoji based on plant name
            emoji: speciesEmoji,
          },
          plantedDate: plant.planted_date ? new Date(plant.planted_date) : new Date(plant.created_at),
          lastWatered: actions.siram ? new Date(actions.siram) : null,
          lastFertilized: actions.pupuk ? new Date(actions.pupuk) : null,
          notes: cleanNotes, // Use cleaned notes (without species tag)
          createdAt: new Date(plant.created_at),
        };
      });

      console.log('[usePlants] Transformed plants:', transformedPlants);
      setPlants(transformedPlants);
    } catch (err) {
      console.error('[usePlants] Error:', err);
      setError(err.message || 'Gagal memuat tanaman');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  // Add a new plant
  const addPlant = async (plantData) => {
    if (!user?.id) {
      console.error('[usePlants] addPlant: No user ID');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Store species info in notes as JSON if species name provided
      // This is a workaround since there's no species_name column
      let notesWithSpecies = plantData.notes || '';
      if (plantData.speciesName) {
        const speciesInfo = JSON.stringify({
          speciesName: plantData.speciesName,
          speciesEmoji: plantData.speciesEmoji || '🌱',
        });
        // Prepend species info to notes (will be parsed on read)
        notesWithSpecies = `<!--species:${speciesInfo}-->${notesWithSpecies}`;
      }

      // First, insert the plant to get an ID
      const insertData = {
        user_id: user.id,
        species_id: plantData.speciesId || null,
        location_id: plantData.locationId || null,
        name: plantData.customName || plantData.name,
        photo_url: null, // Will update after upload
        planted_date: plantData.plantedDate || new Date().toISOString(),
        notes: notesWithSpecies || null,
        status: 'active', // Must be 'active', 'archived', or 'deceased' per DB constraint
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
        console.error('[usePlants] addPlant: Error code:', error.code);
        console.error('[usePlants] addPlant: Error message:', error.message);
        console.error('[usePlants] addPlant: Error details:', error.details);
        console.error('[usePlants] addPlant: Error hint:', error.hint);
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
            // Don't fail the whole operation, photo just won't be saved
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
  const recordAction = async (plantId, actionType) => {
    console.log('[usePlants] recordAction called:', { plantId, actionType, userId: user?.id });

    if (!user?.id) {
      console.error('[usePlants] recordAction: No user ID');
      return { success: false, error: 'User not authenticated' };
    }

    // Format date as YYYY-MM-DD for the date column type
    const today = new Date();
    const actionDate = today.toISOString().split('T')[0];

    const insertData = {
      plant_id: plantId,
      user_id: user.id,
      action_type: actionType, // 'siram', 'pupuk', 'pangkas', 'panen'
      action_date: actionDate,
    };

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
        console.error('[usePlants] recordAction: Error code:', error.code);
        console.error('[usePlants] recordAction: Error message:', error.message);
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

  return {
    plants,
    loading,
    error,
    refetch: fetchPlants,
    addPlant,
    updatePlant,
    deletePlant,
    recordAction,
  };
}

export default usePlants;
