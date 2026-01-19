'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveToCache, getFromCache } from '@/lib/offlineStorage';
import { createDebugger } from '@/lib/debug';
import { CACHE_KEYS } from '@/lib/constants';
import type {
  PlantPhaseDefinition,
  PlantPhaseDefinitionRaw,
  PlantSpeciesCategory,
  UsePlantPhasesReturn,
} from '@/types';

const debug = createDebugger('usePlantPhases');

/**
 * Transform raw phase data from DB (snake_case) to UI format (camelCase)
 */
const transformPhase = (raw: PlantPhaseDefinitionRaw): PlantPhaseDefinition => ({
  id: raw.id,
  category: raw.category,
  phaseKey: raw.phase_key,
  phaseName: raw.phase_name,
  phaseOrder: raw.phase_order,
  icon: raw.icon,
  color: raw.color,
  description: raw.description,
  careTips: raw.care_tips || [],
});

/**
 * usePlantPhases Hook
 *
 * Fetches and manages plant phase definitions from Supabase.
 * Phases are cached for offline use and rarely change.
 *
 * @param category - The plant category to fetch phases for (e.g., 'Sayuran', 'Bunga')
 */
export function usePlantPhases(category: PlantSpeciesCategory | null): UsePlantPhasesReturn {
  const { isOnline } = useOnlineStatus();
  const [phases, setPhases] = useState<PlantPhaseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache key includes category for per-category caching
  const cacheKey = category ? `${CACHE_KEYS.PLANT_PHASES}_${category}` : null;

  const fetchPhases = useCallback(async () => {
    if (!category) {
      setPhases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // OFFLINE MODE: Load from cache
    if (!isOnline && cacheKey) {
      debug.log('OFFLINE: Loading phases from cache for category:', category);
      const cached = getFromCache<PlantPhaseDefinition[]>(cacheKey);

      startTransition(() => {
        if (cached?.data) {
          debug.log('OFFLINE: Found cached phases:', cached.data.length);
          setPhases(cached.data);
        } else {
          debug.log('OFFLINE: No cached phases available');
          setPhases([]);
        }
      });

      setLoading(false);
      return;
    }

    // ONLINE MODE: Fetch from Supabase
    debug.log('ONLINE: Fetching phases for category:', category);
    console.log('[usePlantPhases] Fetching phases for category:', category);

    try {
      const { data, error: fetchError } = await supabase
        .from('plant_phase_definitions')
        .select('*')
        .eq('category', category)
        .order('phase_order', { ascending: true });

      console.log('[usePlantPhases] Supabase response:', { data, error: fetchError });

      if (fetchError) {
        debug.error('Fetch error:', fetchError);
        throw fetchError;
      }

      const transformed = (data || []).map(transformPhase);
      debug.log('Fetched phases:', transformed.length);
      console.log('[usePlantPhases] Transformed phases:', transformed);
      setPhases(transformed);

      // Cache for offline use
      if (cacheKey) {
        saveToCache(cacheKey, transformed);
        debug.log('Saved phases to cache');
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      debug.error('Error fetching phases:', errorMessage);

      // Try to load from cache as fallback
      if (cacheKey) {
        const cached = getFromCache<PlantPhaseDefinition[]>(cacheKey);
        if (cached?.data) {
          debug.log('Using cached phases as fallback');
          setPhases(cached.data);
          setError('Menggunakan data tersimpan. Gagal memuat data terbaru.');
          return;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [category, isOnline, cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  /**
   * Get a phase definition by its key
   */
  const getPhaseByKey = useCallback(
    (key: string): PlantPhaseDefinition | undefined => {
      return phases.find((p) => p.phaseKey === key);
    },
    [phases]
  );

  /**
   * Get the next phase after the current one
   */
  const getNextPhase = useCallback(
    (currentKey: string): PlantPhaseDefinition | undefined => {
      const currentIndex = phases.findIndex((p) => p.phaseKey === currentKey);
      if (currentIndex >= 0 && currentIndex < phases.length - 1) {
        return phases[currentIndex + 1];
      }
      return undefined;
    },
    [phases]
  );

  return {
    phases,
    loading,
    error,
    getPhaseByKey,
    getNextPhase,
  };
}

export default usePlantPhases;
