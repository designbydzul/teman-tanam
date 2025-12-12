'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

/**
 * useLocations Hook
 *
 * Fetches and manages user's locations from Supabase.
 * - Fetches user's locations
 * - Allows adding new locations
 * - Allows reordering locations
 * - Allows deleting locations
 */
export function useLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations from Supabase
  const fetchLocations = useCallback(async () => {
    if (!user?.id) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useLocations] Fetching locations for user:', user.id);

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
    } catch (err) {
      console.error('[useLocations] Error:', err);
      setError(err.message || 'Gagal memuat lokasi');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

    try {
      // Get the highest order_index
      const maxOrderIndex = locations.reduce((max, loc) => Math.max(max, loc.sortOrder || 0), 0);

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
      setLocations(prev => [...prev, newLocation]);

      return { success: true, location: newLocation };
    } catch (err) {
      console.error('[useLocations] Error adding location:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a location (only name, icon column doesn't exist in DB)
  const updateLocation = async (locationId, updates) => {
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
      setLocations(prev =>
        prev.map(loc =>
          loc.id === locationId
            ? { ...loc, name: data.name }
            : loc
        )
      );

      return { success: true, location: data };
    } catch (err) {
      console.error('[useLocations] Error updating location:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a location
  const deleteLocation = async (locationId) => {
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
      setLocations(prev => prev.filter(loc => loc.id !== locationId));

      return { success: true };
    } catch (err) {
      console.error('[useLocations] Error deleting location:', err);
      return { success: false, error: err.message };
    }
  };

  // Reorder locations
  const reorderLocations = async (reorderedLocations) => {
    try {
      // Update order_index for each location
      const updates = reorderedLocations.map((loc, index) => ({
        id: loc.id,
        order_index: index,
      }));

      // Update each location's order_index
      for (const update of updates) {
        const { error } = await supabase
          .from('locations')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Update local state
      setLocations(reorderedLocations.map((loc, index) => ({
        ...loc,
        sortOrder: index,
      })));

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
