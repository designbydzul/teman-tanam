'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  saveToCache,
  getFromCache,
  addToSyncQueue,
  generateTempId,
} from '@/lib/offlineStorage';

const LOCATIONS_CACHE_KEY = 'locations';

/**
 * useLocations Hook
 *
 * Fetches and manages user's locations from Supabase.
 * - Fetches user's locations
 * - Allows adding new locations
 * - Allows reordering locations
 * - Allows deleting locations
 * - Supports offline mode with caching
 */
export function useLocations() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations from Supabase (online) or cache (offline)
  const fetchLocations = useCallback(async () => {
    if (!user?.id) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Helper to load from cache
    const loadFromCache = (isOfflineMode = false) => {
      const cached = getFromCache(LOCATIONS_CACHE_KEY);
      if (cached?.data) {
        console.log('[useLocations] Loading from cache:', cached.data.length, 'locations');
        setLocations(cached.data);
        // Don't show error for offline mode - it's expected behavior
        if (!isOfflineMode) {
          setError(null);
        }
        return true;
      }
      return false;
    };

    // OFFLINE MODE: Load from cache directly
    if (!isOnline) {
      console.log('[useLocations] OFFLINE: Loading from cache');
      const hasCache = loadFromCache(true);
      if (!hasCache) {
        console.log('[useLocations] OFFLINE: No cached data available');
        setLocations([]);
      }
      setLoading(false);
      return;
    }

    // ONLINE MODE: Try to fetch from Supabase
    try {
      console.log('[useLocations] ONLINE: Fetching locations for user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (fetchError) {
        console.error('[useLocations] Error fetching locations:', fetchError);
        throw fetchError;
      }

      console.log('[useLocations] Fetched locations:', data);

      // Transform locations (icon column doesn't exist in DB, use default emoji)
      const transformedLocations = (data || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        emoji: '📍', // Default emoji (icon column doesn't exist in DB)
        sortOrder: loc.order_index,
      }));

      setLocations(transformedLocations);
      setError(null);

      // Save to cache for offline use
      saveToCache(LOCATIONS_CACHE_KEY, transformedLocations);
      console.log('[useLocations] Saved locations to cache');

    } catch (err) {
      console.error('[useLocations] Error:', err);

      // Try to load from cache as fallback (network error, etc.)
      const hasCache = loadFromCache(false);
      if (hasCache) {
        console.log('[useLocations] Using cached data as fallback');
        // Don't show error if we have cached data - just use it silently
      } else {
        // Only show error if we have no cached data to fall back to
        const isNetworkError = err.message?.includes('Failed to fetch') ||
                               err.message?.includes('NetworkError') ||
                               err.message?.includes('network');
        setError(isNetworkError ? 'Tidak ada koneksi internet' : (err.message || 'Gagal memuat lokasi'));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline]);

  // Initial fetch
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Get location names with "Semua" prepended
  const locationNames = ['Semua', ...locations.map(loc => loc.name)];

  // Add a new location
  const addLocation = async (name, emoji = '📍') => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check for duplicates
    if (locations.some(loc => loc.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: 'Lokasi dengan nama ini sudah ada' };
    }

    // Get the highest order_index
    const maxOrderIndex = locations.reduce((max, loc) => Math.max(max, loc.sortOrder || 0), 0);

    // OFFLINE MODE: Save locally and queue for sync
    if (!isOnline) {
      try {
        console.log('[useLocations] OFFLINE: Adding location locally');

        const tempId = generateTempId();

        const newLocation = {
          id: tempId,
          name,
          emoji: '📍',
          sortOrder: maxOrderIndex + 1,
          isOffline: true,
          pendingSync: true,
        };

        // Add to sync queue
        addToSyncQueue({
          type: 'location',
          action: 'create',
          data: {
            user_id: user.id,
            name,
            order_index: maxOrderIndex + 1,
            tempId,
          },
        });

        // Update local state
        const updatedLocations = [...locations, newLocation];
        setLocations(updatedLocations);

        // Update cache
        saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

        console.log('[useLocations] OFFLINE: Added location to sync queue');
        return { success: true, location: newLocation, offline: true };
      } catch (err) {
        console.error('[useLocations] OFFLINE addLocation error:', err);
        return { success: false, error: err.message };
      }
    }

    // ONLINE MODE: Insert to Supabase
    try {
      // Note: 'icon' column doesn't exist in DB, so we don't include it
      const { data, error } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          name,
          order_index: maxOrderIndex + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state (use default emoji since icon column doesn't exist)
      const newLocation = {
        id: data.id,
        name: data.name,
        emoji: '📍',
        sortOrder: data.order_index,
      };

      const updatedLocations = [...locations, newLocation];
      setLocations(updatedLocations);

      // Update cache
      saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

      return { success: true, location: newLocation };
    } catch (err) {
      console.error('[useLocations] Error adding location:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a location (only name, icon column doesn't exist in DB)
  const updateLocation = async (locationId, updates) => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    // OFFLINE MODE: Update locally and queue for sync
    if (!isOnline) {
      try {
        console.log('[useLocations] OFFLINE: Updating location locally');

        // Update local state
        const updatedLocations = locations.map(loc =>
          loc.id === locationId
            ? { ...loc, name: updates.name, pendingSync: true }
            : loc
        );
        setLocations(updatedLocations);

        // Update cache
        saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

        // Add to sync queue
        addToSyncQueue({
          type: 'location',
          action: 'update',
          data: {
            id: locationId,
            name: updates.name,
          },
        });

        console.log('[useLocations] OFFLINE: Added location update to sync queue');
        return { success: true, offline: true };
      } catch (err) {
        console.error('[useLocations] OFFLINE updateLocation error:', err);
        return { success: false, error: err.message };
      }
    }

    // ONLINE MODE: Update in Supabase
    try {
      const { data, error } = await supabase
        .from('locations')
        .update({
          name: updates.name,
        })
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedLocations = locations.map(loc =>
        loc.id === locationId
          ? { ...loc, name: data.name }
          : loc
      );
      setLocations(updatedLocations);

      // Update cache
      saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

      return { success: true, location: data };
    } catch (err) {
      console.error('[useLocations] Error updating location:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a location
  const deleteLocation = async (locationId) => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    // OFFLINE MODE: Delete locally and queue for sync
    if (!isOnline) {
      try {
        console.log('[useLocations] OFFLINE: Deleting location locally');

        // Update local state
        const updatedLocations = locations.filter(loc => loc.id !== locationId);
        setLocations(updatedLocations);

        // Update cache
        saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

        // Add to sync queue (only if not a temp ID - temp IDs were never synced)
        if (!locationId.startsWith('temp-')) {
          addToSyncQueue({
            type: 'location',
            action: 'delete',
            data: {
              id: locationId,
            },
          });
          console.log('[useLocations] OFFLINE: Added location delete to sync queue');
        } else {
          console.log('[useLocations] OFFLINE: Skipping sync queue for temp location');
        }

        return { success: true, offline: true };
      } catch (err) {
        console.error('[useLocations] OFFLINE deleteLocation error:', err);
        return { success: false, error: err.message };
      }
    }

    // ONLINE MODE: Delete from Supabase
    try {
      // First, update any plants in this location to have no location
      const { error: updateError } = await supabase
        .from('plants')
        .update({ location_id: null })
        .eq('location_id', locationId);

      if (updateError) {
        console.warn('[useLocations] Error updating plants:', updateError);
      }

      // Then delete the location
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      // Update local state
      const updatedLocations = locations.filter(loc => loc.id !== locationId);
      setLocations(updatedLocations);

      // Update cache
      saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

      return { success: true };
    } catch (err) {
      console.error('[useLocations] Error deleting location:', err);
      return { success: false, error: err.message };
    }
  };

  // Reorder locations
  const reorderLocations = async (reorderedLocations) => {
    // Update local state immediately for responsive UI
    const updatedLocations = reorderedLocations.map((loc, index) => ({
      ...loc,
      sortOrder: index,
    }));
    setLocations(updatedLocations);

    // Update cache
    saveToCache(LOCATIONS_CACHE_KEY, updatedLocations);

    // OFFLINE MODE: Just update locally (sync will handle it when online)
    if (!isOnline) {
      console.log('[useLocations] OFFLINE: Reordered locations locally');
      // Note: We don't queue reorder for sync as it's complex and order will be
      // re-fetched when online. The local order is preserved in cache.
      return { success: true, offline: true };
    }

    // ONLINE MODE: Update in Supabase
    try {
      // Update order_index for each location
      const updates = reorderedLocations.map((loc, index) => ({
        id: loc.id,
        order_index: index,
      }));

      // Update each location's order_index
      for (const update of updates) {
        // Skip temp IDs - they haven't been synced yet
        if (update.id.startsWith?.('temp-')) continue;

        const { error } = await supabase
          .from('locations')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('[useLocations] Error reordering locations:', err);
      return { success: false, error: err.message };
    }
  };

  // Get location by ID
  const getLocationById = (locationId) => {
    return locations.find(loc => loc.id === locationId);
  };

  // Get location by name
  const getLocationByName = (name) => {
    return locations.find(loc => loc.name.toLowerCase() === name.toLowerCase());
  };

  return {
    locations,
    locationNames,
    loading,
    error,
    isOnline,
    refetch: fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    getLocationById,
    getLocationByName,
  };
}

export default useLocations;
