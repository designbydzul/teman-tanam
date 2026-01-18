/**
 * Care Checker Utility
 *
 * Calculates which plants need attention based on:
 * - Last watering date vs species watering frequency
 * - Last fertilizing date vs species fertilizing frequency
 */

import { createClient } from '@supabase/supabase-js';
import { differenceInDays, startOfDay } from 'date-fns';

// Create a service role client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Default care frequency if not specified
const DEFAULT_WATERING_DAYS = 3;
const DEFAULT_FERTILIZING_DAYS = 30;

export interface PlantCareStatus {
  plant_id: string;
  plant_name: string;
  needs_water: boolean;
  days_since_water: number | null;
  needs_fertilizer: boolean;
  days_since_fertilizer: number | null;
}

export interface UserCareDigest {
  user_id: string;
  whatsapp_number: string;
  plants_needing_water: PlantCareStatus[];
  plants_needing_fertilizer: PlantCareStatus[];
  total_plants_needing_attention: number;
}

interface PlantWithCareInfo {
  id: string;
  name: string | null;
  user_id: string;
  custom_watering_days: number | null;
  custom_fertilizing_days: number | null;
  plant_species: {
    common_name: string;
    watering_frequency_days: number;
    fertilizing_frequency_days: number;
  } | null;
}

interface ActionRecord {
  plant_id: string;
  action_type: string;
  action_date: string;
}

/**
 * Calculate care needs for a specific user's plants
 */
export async function calculateUserCareNeeds(
  userId: string,
  whatsappNumber: string
): Promise<UserCareDigest | null> {
  try {
    // 1. Get user's active plants with their species info
    const { data: plantsData, error: plantsError } = await supabaseAdmin
      .from('plants')
      .select(`
        id,
        name,
        user_id,
        custom_watering_days,
        custom_fertilizing_days,
        plant_species (
          common_name,
          watering_frequency_days,
          fertilizing_frequency_days
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (plantsError) {
      console.error(`[care-checker] Error fetching plants for user ${userId}:`, plantsError);
      return null;
    }

    if (!plantsData || plantsData.length === 0) {
      return null;
    }

    const plants = plantsData as unknown as PlantWithCareInfo[];
    const plantIds = plants.map(p => p.id);

    // 2. Get last actions for each plant
    const { data: actionsData, error: actionsError } = await supabaseAdmin
      .from('actions')
      .select('plant_id, action_type, action_date')
      .in('plant_id', plantIds)
      .order('action_date', { ascending: false });

    if (actionsError) {
      console.error(`[care-checker] Error fetching actions for user ${userId}:`, actionsError);
      return null;
    }

    // Build a map of last action dates per plant
    const lastActions: Record<string, Record<string, string>> = {};
    (actionsData as ActionRecord[] || []).forEach(action => {
      if (!lastActions[action.plant_id]) {
        lastActions[action.plant_id] = {};
      }
      // Only keep the most recent action of each type
      if (!lastActions[action.plant_id][action.action_type]) {
        lastActions[action.plant_id][action.action_type] = action.action_date;
      }
    });

    // 3. Calculate care status for each plant
    const today = startOfDay(new Date());
    const plantsNeedingWater: PlantCareStatus[] = [];
    const plantsNeedingFertilizer: PlantCareStatus[] = [];

    for (const plant of plants) {
      const species = plant.plant_species;
      const plantName = plant.name || species?.common_name || 'Tanaman';

      // Use custom frequency if set, otherwise use species default
      const wateringFrequency = plant.custom_watering_days ??
        species?.watering_frequency_days ??
        DEFAULT_WATERING_DAYS;
      const fertilizingFrequency = plant.custom_fertilizing_days ??
        species?.fertilizing_frequency_days ??
        DEFAULT_FERTILIZING_DAYS;

      const plantActions = lastActions[plant.id] || {};

      // Check watering
      const lastWatered = plantActions['siram'];
      let daysSinceWater: number | null = null;
      let needsWater = true; // Default to needing water if never watered

      if (lastWatered) {
        const lastWateredDate = startOfDay(new Date(lastWatered));
        daysSinceWater = differenceInDays(today, lastWateredDate);
        needsWater = daysSinceWater >= wateringFrequency;
      }

      // Check fertilizing
      const lastFertilized = plantActions['pupuk'];
      let daysSinceFertilizer: number | null = null;
      let needsFertilizer = true; // Default to needing fertilizer if never fertilized

      if (lastFertilized) {
        const lastFertilizedDate = startOfDay(new Date(lastFertilized));
        daysSinceFertilizer = differenceInDays(today, lastFertilizedDate);
        needsFertilizer = daysSinceFertilizer >= fertilizingFrequency;
      }

      const careStatus: PlantCareStatus = {
        plant_id: plant.id,
        plant_name: plantName,
        needs_water: needsWater,
        days_since_water: daysSinceWater,
        needs_fertilizer: needsFertilizer,
        days_since_fertilizer: daysSinceFertilizer,
      };

      if (needsWater) {
        plantsNeedingWater.push(careStatus);
      }

      if (needsFertilizer) {
        plantsNeedingFertilizer.push(careStatus);
      }
    }

    // 4. Only return if there are plants needing attention
    const totalNeedingAttention = new Set([
      ...plantsNeedingWater.map(p => p.plant_id),
      ...plantsNeedingFertilizer.map(p => p.plant_id),
    ]).size;

    if (totalNeedingAttention === 0) {
      return null;
    }

    return {
      user_id: userId,
      whatsapp_number: whatsappNumber,
      plants_needing_water: plantsNeedingWater,
      plants_needing_fertilizer: plantsNeedingFertilizer,
      total_plants_needing_attention: totalNeedingAttention,
    };
  } catch (error) {
    console.error(`[care-checker] Error calculating care needs for user ${userId}:`, error);
    return null;
  }
}

interface NotificationSettingsRecord {
  user_id: string;
  whatsapp_number: string;
}

/**
 * Get all users who need notification today
 */
export async function getAllUsersNeedingNotification(): Promise<UserCareDigest[]> {
  try {
    // 1. Get all users with WhatsApp notifications enabled
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('notification_settings')
      .select('user_id, whatsapp_number')
      .eq('whatsapp_enabled', true)
      .not('whatsapp_number', 'is', null);

    if (usersError) {
      console.error('[care-checker] Error fetching users with notifications:', usersError);
      return [];
    }

    if (!usersData || usersData.length === 0) {
      return [];
    }

    const users = usersData as NotificationSettingsRecord[];

    // 2. Calculate care needs for each user
    const usersNeedingNotification: UserCareDigest[] = [];

    for (const user of users) {
      const digest = await calculateUserCareNeeds(user.user_id, user.whatsapp_number);
      if (digest) {
        usersNeedingNotification.push(digest);
      }
    }

    return usersNeedingNotification;
  } catch (error) {
    console.error('[care-checker] Error getting users needing notification:', error);
    return [];
  }
}

/**
 * Log notification result to database
 */
export async function logNotification(data: {
  user_id: string;
  plants_count: number;
  message_preview: string;
  status: 'sent' | 'failed';
  error_message: string | null;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('notification_logs')
      .insert({
        user_id: data.user_id,
        plants_count: data.plants_count,
        message_preview: data.message_preview,
        status: data.status,
        error_message: data.error_message,
        sent_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[care-checker] Error logging notification:', error);
    }
  } catch (error) {
    console.error('[care-checker] Error logging notification:', error);
  }
}
