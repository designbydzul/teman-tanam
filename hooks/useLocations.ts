'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
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

// Location type for internal state (transformed from DB)
interface LocationState {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  isOffline?: boolean;
  pendingSync?: boolean;
}

// Return type for add/update/delete operations
interface LocationOperationResult {
  success: boolean;
  location?: LocationState;
  error?: string;
  offline?: boolean;
}

// Return type for reorder operation
interface ReorderResult {
  success: boolean;
  error?: string;
  offline?: boolean;
}

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
  const [locations, setLocations] = useState<LocationState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations from Supabase (online) or cache (offline)
  const fetchLocations = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Helper to load from cache
    const loadFromCache = (isOfflineMode: boolean = false): boolean => {
      const cached = getFromCache<LocationState[]>(LOCATIONS_CACHE_KEY);
      if (cached?.data) {
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
      const cached = getFromCache<LocationState[]>(LOCATIONS_CACHE_KEY);
      // Use startTransition to mark cached data updates as lower priority than animations
      startTransition(() => {
        if (cached?.data) {
          setLocations(cached.data);
        } else {
          setLocations([]);
        }
      });
      setLoading(false);
      return;
    }

    // ONLINE MODE: Try to fetch from Supabase
    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Transform locations (icon column doesn't exist in DB, use default emoji)
      const transformedLocations: LocationState[] = (data || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        emoji: '📍', // Default emoji (icon column doesn't exist in DB)
        sortOrder: loc.order_index,
      }));

      setLocations(transformedLocations);
      setError(null);

      // Save to cache for offline use
      saveToCache(LOCATIONS_CACHE_KEY, transformedLocations);

    } catch (err: unknown) {
      // Try to load from cache as fallback (network error, etc.)
      const hasCache = loadFromCache(false);
      if (!hasCache) {
        // Only show error if we have no cached data to fall back to
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('Failed to fetch') ||
                               errorMessage.includes('NetworkError') ||
                               errorMessage.includes('network');
        setError(isNetworkError ? 'Tidak ada koneksi internet' : (errorMessage || 'Gagal memuat lokasi'));
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
  const locationNames: string[] = ['Semua', ...locations.map(loc => loc.name)];

  // Add a new location
  const addLocation = async (name: string, emoji: string = '📍'): Promise<LocationOperationResult> => {
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
        const tempId = generateTempId();

        const newLocation: LocationState = {
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

        return { success: true, location: newLocation, offline: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
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
      const newLocation: LocationState = {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  };

  // Update a location (only name, icon column doesn't exist in DB)
  const updateLocation = async (locationId: string, updates: { name: string }): Promise<LocationOperationResult> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    // OFFLINE MODE: Update locally and queue for sync
    if (!isOnline) {
      try {
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

        return { success: true, offline: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
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

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  };

  // Delete a location
  const deleteLocation = async (locationId: string): Promise<LocationOperationResult> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    // OFFLINE MODE: Delete locally and queue for sync
    if (!isOnline) {
      try {
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
        }

        return { success: true, offline: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
      }
    }

    // ONLINE MODE: Delete from Supabase
    try {
      // First, update any plants in this location to have no location
      const { error: updatePlantsError } = await supabase
        .from('plants')
        .update({ location_id: null })
        .eq('location_id', locationId);

      if (updatePlantsError) {
        console.error('Error updating plants before location delete:', updatePlantsError);
        throw updatePlantsError;
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  };

  // Reorder locations
  const reorderLocations = async (reorderedLocations: LocationState[]): Promise<ReorderResult> => {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  };

  // Get location by ID
  const getLocationById = (locationId: string): LocationState | undefined => {
    return locations.find(loc => loc.id === locationId);
  };

  // Get location by name
  const getLocationByName = (name: string): LocationState | undefined => {
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
