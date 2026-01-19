'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveToCache, getFromCache, addToSyncQueue, getSyncQueueCount, generateTempId } from '@/lib/offlineStorage';
import { createDebugger } from '@/lib/debug';
import { CACHE_KEYS, ACTION_TYPES } from '@/lib/constants';
import {
  getPhaseConfig,
  getPhaseDisplay,
  getValidPhases,
  getLifecycleProgress,
  calculateExpectedPhase,
  getDaysInPhase,
  getPlantAge,
  canManuallySetPhase,
  getPhaseChangeMessage,
  shouldShowHarvestReminder,
  getDaysUntilHarvest,
  getHarvestTimelineMessage,
  DEFAULT_PHASE,
  type PhaseConfig,
} from '@/lib/lifecycle-config';
import {
  shouldShowPhaseReminder,
  dismissPhaseReminder as dismissPhaseReminderUtil,
  clearPhaseReminder,
} from '@/lib/phaseReminder';
import type { LifecyclePhase, PlantLifecycleType, Plant } from '@/types';

const debug = createDebugger('useLifecyclePhase');

// ============================================================================
// Types
// ============================================================================

/**
 * Harvest information for harvestable plants
 */
export interface HarvestInfo {
  /** Days until expected harvest (negative if overdue) */
  daysUntilHarvest: number | null;
  /** Whether the plant is past its harvest window */
  isOverdue: boolean;
  /** Human-readable timeline message in Indonesian */
  timelineMessage: string;
  /** Whether to show a gentle reminder to check harvest readiness */
  showReminder: boolean;
}

/**
 * Result of a phase update operation
 */
export interface PhaseUpdateResult {
  success: boolean;
  error?: string;
  /** Whether the update was queued for offline sync */
  offline?: boolean;
  /** Whether this transition is a celebration milestone */
  isCelebration?: boolean;
  /** Encouraging message for the transition */
  message?: string;
}

/**
 * Return type for useLifecyclePhase hook
 */
export interface UseLifecyclePhaseReturn {
  /** Current lifecycle phase */
  currentPhase: LifecyclePhase | null;
  /** Configuration for current phase (label, icon, color, description) */
  phaseConfig: PhaseConfig | undefined;
  /** Display info with fallback for unknown phases */
  phaseDisplay: { label: string; icon: string; color: string };
  /** Progress percentage through lifecycle (0-100) */
  phaseProgress: number;
  /** Days since phase was last changed */
  daysInPhase: number;
  /** Plant age in days since planting */
  plantAge: number;
  /** Valid phases for this plant's lifecycle type */
  validPhases: LifecyclePhase[];
  /** Expected phase based on plant age and species */
  expectedPhase: LifecyclePhase;
  /** Whether current phase differs from expected */
  phaseNeedsUpdate: boolean;
  /** Whether to show the phase confirmation dialog */
  shouldShowConfirmation: boolean;
  /** Suggested phase for confirmation (same as expectedPhase when phaseNeedsUpdate) */
  suggestedPhase: LifecyclePhase | null;
  /** Harvest-related information (for harvestable plants) */
  harvestInfo: HarvestInfo;
  /** Lifecycle type from species */
  lifecycleType: PlantLifecycleType | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Update the plant's phase */
  updatePhase: (newPhase: LifecyclePhase) => Promise<PhaseUpdateResult>;
  /** Check if a transition to target phase is allowed */
  canTransitionTo: (targetPhase: LifecyclePhase) => boolean;
  /** Dismiss the phase reminder (remind later) */
  dismissPhaseReminder: () => void;
  /** Refresh phase data */
  refresh: () => Promise<void>;
}

// Milestone phases that trigger celebration
const CELEBRATION_PHASES: LifecyclePhase[] = ['harvest_ready', 'harvested', 'mature'];

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useLifecyclePhase Hook
 *
 * Manages lifecycle phase state for a single plant.
 * Provides phase info, update capabilities, and harvest tracking.
 *
 * @param plantId - The ID of the plant to manage
 * @param plant - Optional plant object (if already fetched by parent)
 */
export function useLifecyclePhase(
  plantId: string | null | undefined,
  plant?: Plant | null
): UseLifecyclePhaseReturn {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  // State
  const [isLoading, setIsLoading] = useState(!plant);
  const [error, setError] = useState<string | null>(null);
  const [plantData, setPlantData] = useState<Plant | null>(plant || null);

  // Additional lifecycle data from species (not in Plant type but passed separately)
  const [lifecycleData, setLifecycleData] = useState<{
    lifecycleType: PlantLifecycleType | null;
    harvestDaysMin: number | null;
    harvestDaysMax: number | null;
  }>({ lifecycleType: null, harvestDaysMin: null, harvestDaysMax: null });

  // Derived values from plant data
  const currentPhase = (plantData?.currentPhase as LifecyclePhase) || null;
  const phaseStartedAt = plantData?.phaseStartedAt || null;
  const startedDate = plantData?.startedDate || null;

  // Use lifecycle data from state
  const { lifecycleType, harvestDaysMin, harvestDaysMax } = lifecycleData;

  // ============================================================================
  // Fetch Plant Data
  // ============================================================================

  const fetchPlantData = useCallback(async () => {
    if (!plantId) {
      setPlantData(null);
      setIsLoading(false);
      return;
    }

    // If plant was passed as prop, use it
    if (plant) {
      setPlantData(plant);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Try cache first if offline
    if (!isOnline) {
      const cached = getFromCache<Plant[]>(CACHE_KEYS.PLANTS);
      if (cached?.data) {
        const found = cached.data.find(p => p.id === plantId);
        if (found) {
          debug.log('OFFLINE: Using cached plant data');
          setPlantData(found);
          setIsLoading(false);
          return;
        }
      }
      setError('Tidak dapat memuat data tanaman saat offline');
      setIsLoading(false);
      return;
    }

    // Fetch from Supabase
    try {
      debug.log('Fetching plant data for:', plantId);

      const { data, error: fetchError } = await supabase
        .from('plants')
        .select(`
          *,
          plant_species (
            id,
            common_name,
            latin_name,
            category,
            lifecycle_type,
            harvest_days_min,
            harvest_days_max
          )
        `)
        .eq('id', plantId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        throw new Error('Tanaman tidak ditemukan');
      }

      // Transform to Plant type
      const species = data.plant_species;

      // Store lifecycle data separately
      setLifecycleData({
        lifecycleType: species?.lifecycle_type || null,
        harvestDaysMin: species?.harvest_days_min || null,
        harvestDaysMax: species?.harvest_days_max || null,
      });

      const transformed: Plant = {
        id: data.id,
        name: data.name || species?.common_name || 'Tanaman',
        customName: data.name,
        status: data.status || 'active',
        statusColor: '#7CB342',
        location: '',
        locationId: data.location_id,
        image: data.photo_url,
        species: species ? {
          id: species.id,
          name: species.common_name,
          scientific: species.latin_name,
          category: species.category,
          emoji: '🌱',
          wateringFrequencyDays: 3,
          fertilizingFrequencyDays: 14,
        } : {
          emoji: '🌱',
          wateringFrequencyDays: 3,
          fertilizingFrequencyDays: 14,
        },
        customWateringDays: data.custom_watering_days,
        customFertilizingDays: data.custom_fertilizing_days,
        startedDate: data.started_date || data.created_at,
        lastWatered: null,
        lastFertilized: null,
        wateringStatus: { status: 'unknown', label: '', daysUntilNext: null, daysSinceLast: null, doneToday: false },
        fertilizingStatus: { status: 'unknown', label: '', daysUntilNext: null, daysSinceLast: null, doneToday: false },
        harvestStatus: { isReadyToHarvest: false, daysUntilHarvest: null },
        precondition: data.precondition || null,
        currentPhase: data.current_phase,
        phaseStartedAt: data.phase_started_at ? new Date(data.phase_started_at) : null,
        expectedHarvestDate: data.expected_harvest_date ? new Date(data.expected_harvest_date) : null,
        firstHarvestAt: data.first_harvest_at ? new Date(data.first_harvest_at) : null,
        totalHarvests: data.total_harvests || 0,
        notes: data.notes || '',
        createdAt: data.created_at,
      };

      setPlantData(transformed);
      debug.log('Fetched plant data:', transformed.name);
    } catch (err) {
      const errorMessage = (err as Error).message;
      debug.error('Error fetching plant:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [plantId, plant, isOnline]);

  // Fetch on mount and when plant prop changes
  useEffect(() => {
    if (plant) {
      setPlantData(plant);
      // Extract lifecycle data from plant.species if available (using type assertion for extended fields)
      const speciesAny = plant.species as {
        lifecycleType?: PlantLifecycleType;
        harvestDaysMin?: number;
        harvestDaysMax?: number;
      } | undefined;
      if (speciesAny) {
        setLifecycleData({
          lifecycleType: speciesAny.lifecycleType || null,
          harvestDaysMin: speciesAny.harvestDaysMin || null,
          harvestDaysMax: speciesAny.harvestDaysMax || null,
        });
      }
      setIsLoading(false);
    } else {
      fetchPlantData();
    }
  }, [plant, fetchPlantData]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const plantAge = useMemo(() => {
    return getPlantAge(startedDate);
  }, [startedDate]);

  const daysInPhase = useMemo(() => {
    return getDaysInPhase(phaseStartedAt);
  }, [phaseStartedAt]);

  const phaseConfig = useMemo(() => {
    return getPhaseConfig(currentPhase);
  }, [currentPhase]);

  const phaseDisplay = useMemo(() => {
    return getPhaseDisplay(currentPhase);
  }, [currentPhase]);

  const validPhases = useMemo(() => {
    return getValidPhases(lifecycleType);
  }, [lifecycleType]);

  const expectedPhase = useMemo(() => {
    return calculateExpectedPhase(startedDate, harvestDaysMin, harvestDaysMax, lifecycleType);
  }, [startedDate, harvestDaysMin, harvestDaysMax, lifecycleType]);

  const phaseNeedsUpdate = useMemo(() => {
    if (!currentPhase) return true;
    // Check if expected phase is further along than current
    const currentIndex = validPhases.indexOf(currentPhase);
    const expectedIndex = validPhases.indexOf(expectedPhase);
    return expectedIndex > currentIndex;
  }, [currentPhase, expectedPhase, validPhases]);

  const phaseProgress = useMemo(() => {
    return getLifecycleProgress(currentPhase, lifecycleType);
  }, [currentPhase, lifecycleType]);

  const harvestInfo = useMemo((): HarvestInfo => {
    const daysUntil = getDaysUntilHarvest(plantAge, harvestDaysMin);
    const isOverdue = daysUntil !== null && daysUntil < 0;
    const timelineMessage = getHarvestTimelineMessage(plantAge, harvestDaysMin, harvestDaysMax, currentPhase);
    const showReminder = shouldShowHarvestReminder(plantAge, currentPhase, harvestDaysMin, lifecycleType);

    return {
      daysUntilHarvest: daysUntil,
      isOverdue,
      timelineMessage,
      showReminder,
    };
  }, [plantAge, harvestDaysMin, harvestDaysMax, currentPhase, lifecycleType]);

  // Suggested phase for confirmation (expected phase when needs update)
  const suggestedPhase = useMemo((): LifecyclePhase | null => {
    return phaseNeedsUpdate ? expectedPhase : null;
  }, [phaseNeedsUpdate, expectedPhase]);

  // Whether to show the phase confirmation dialog
  const shouldShowConfirmation = useMemo(() => {
    // Don't show if loading, no plant, or no phase update needed
    if (isLoading || !plantId || !phaseNeedsUpdate) return false;

    // Don't show if suggested phase is same as current
    if (!suggestedPhase || suggestedPhase === currentPhase) return false;

    // Check if reminder was dismissed recently (7-day cooldown)
    return shouldShowPhaseReminder(plantId, suggestedPhase);
  }, [isLoading, plantId, phaseNeedsUpdate, suggestedPhase, currentPhase]);

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Check if transition to target phase is allowed
   */
  const canTransitionTo = useCallback((targetPhase: LifecyclePhase): boolean => {
    return canManuallySetPhase(currentPhase, targetPhase, lifecycleType);
  }, [currentPhase, lifecycleType]);

  /**
   * Update the plant's lifecycle phase
   */
  const updatePhase = useCallback(async (newPhase: LifecyclePhase): Promise<PhaseUpdateResult> => {
    if (!plantId) {
      return { success: false, error: 'ID tanaman tidak valid' };
    }

    // Validate transition
    if (!canManuallySetPhase(currentPhase, newPhase, lifecycleType)) {
      return {
        success: false,
        error: 'Perubahan fase tidak diizinkan. Coba fase yang lebih dekat.',
      };
    }

    const oldPhase = currentPhase;
    const now = new Date();
    const isCelebration = CELEBRATION_PHASES.includes(newPhase);
    const message = getPhaseChangeMessage(oldPhase, newPhase);

    // Prepare update data
    const updateData: {
      current_phase: string;
      phase_started_at: string;
      updated_at: string;
      first_harvest_at?: string;
      total_harvests?: number;
    } = {
      current_phase: newPhase,
      phase_started_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Track harvest milestones
    if (newPhase === 'harvested') {
      const currentHarvests = plantData?.totalHarvests || 0;
      updateData.total_harvests = currentHarvests + 1;

      // First harvest tracking
      if (!plantData?.firstHarvestAt) {
        updateData.first_harvest_at = now.toISOString();
      }
    }

    debug.log('Updating phase:', { plantId, oldPhase, newPhase, isCelebration });

    // Optimistic update
    setPlantData(prev => prev ? {
      ...prev,
      currentPhase: newPhase,
      phaseStartedAt: now,
      totalHarvests: updateData.total_harvests ?? prev.totalHarvests,
      firstHarvestAt: updateData.first_harvest_at ? now : prev.firstHarvestAt,
    } : null);

    // OFFLINE MODE
    if (!isOnline) {
      debug.log('OFFLINE: Queueing phase update');

      addToSyncQueue({
        type: 'plant',
        action: 'update',
        data: {
          id: plantId,
          ...updateData,
        },
      });

      // Also queue the phase change action for timeline
      if (user?.id) {
        const actionDate = now.toISOString().split('T')[0];
        const phaseNotes = `${oldPhase || 'unknown'}→${newPhase}`;
        const tempId = generateTempId();

        addToSyncQueue({
          type: 'action',
          action: 'create',
          data: {
            id: tempId,
            tempId,
            plant_id: plantId,
            user_id: user.id,
            action_type: ACTION_TYPES.PHASE_CHANGE,
            action_date: actionDate,
            notes: phaseNotes,
            created_at: now.toISOString(),
          },
        });
      }

      // Update cache
      const cached = getFromCache<Plant[]>(CACHE_KEYS.PLANTS);
      if (cached?.data) {
        const updatedPlants = cached.data.map(p => {
          if (p.id === plantId) {
            return {
              ...p,
              currentPhase: newPhase,
              phaseStartedAt: now,
              totalHarvests: updateData.total_harvests ?? p.totalHarvests,
              firstHarvestAt: updateData.first_harvest_at ? now : p.firstHarvestAt,
            };
          }
          return p;
        });
        saveToCache(CACHE_KEYS.PLANTS, updatedPlants);
      }

      return {
        success: true,
        offline: true,
        isCelebration,
        message,
      };
    }

    // ONLINE MODE
    try {
      const { error: updateError } = await supabase
        .from('plants')
        .update(updateData)
        .eq('id', plantId);

      if (updateError) {
        throw updateError;
      }

      debug.log('Phase updated successfully');

      // Record phase change as an action for timeline
      if (user?.id) {
        try {
          const actionDate = now.toISOString().split('T')[0];
          // Notes format: "oldPhase→newPhase|optional additional info"
          const phaseNotes = `${oldPhase || 'unknown'}→${newPhase}`;

          const { error: actionError } = await supabase
            .from('actions')
            .insert({
              plant_id: plantId,
              user_id: user.id,
              action_type: ACTION_TYPES.PHASE_CHANGE,
              action_date: actionDate,
              notes: phaseNotes,
              created_at: now.toISOString(),
            });

          if (actionError) {
            // Log but don't fail - plant was updated successfully
            debug.warn('Failed to record phase change action:', actionError.message);
          } else {
            debug.log('Phase change action recorded');
          }
        } catch (actionErr) {
          debug.warn('Error recording phase change action:', actionErr);
        }
      }

      // Clear any phase reminder since user confirmed the phase change
      if (plantId) {
        clearPhaseReminder(plantId);
      }

      return {
        success: true,
        isCelebration,
        message,
      };
    } catch (err) {
      const errorMessage = (err as Error).message;
      debug.error('Error updating phase:', errorMessage);

      // Revert optimistic update on error
      setPlantData(prev => prev ? {
        ...prev,
        currentPhase: oldPhase,
        phaseStartedAt: phaseStartedAt,
      } : null);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [plantId, currentPhase, lifecycleType, plantData, phaseStartedAt, isOnline, user]);

  /**
   * Dismiss the phase reminder (user chose "Belum" / remind later)
   */
  const dismissPhaseReminder = useCallback(() => {
    if (!plantId || !suggestedPhase) return;
    debug.log('Dismissing phase reminder', { plantId, phase: suggestedPhase });
    dismissPhaseReminderUtil(plantId, suggestedPhase);
  }, [plantId, suggestedPhase]);

  /**
   * Refresh plant data
   */
  const refresh = useCallback(async () => {
    await fetchPlantData();
  }, [fetchPlantData]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    currentPhase,
    phaseConfig,
    phaseDisplay,
    phaseProgress,
    daysInPhase,
    plantAge,
    validPhases,
    expectedPhase,
    phaseNeedsUpdate,
    shouldShowConfirmation,
    suggestedPhase,
    harvestInfo,
    lifecycleType,
    isLoading,
    error,
    updatePhase,
    canTransitionTo,
    dismissPhaseReminder,
    refresh,
  };
}

export default useLifecyclePhase;
