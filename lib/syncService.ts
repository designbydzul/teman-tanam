/**
 * Sync Service
 * Handles uploading offline data to Supabase when back online
 */

import { supabase } from '@/lib/supabase/client';
import { createDebugger } from '@/lib/debug';
import {
  getSyncQueue,
  removeFromSyncQueue,
  saveToCache,
  getFromCache,
  SyncQueueItem,
} from './offlineStorage';

const debug = createDebugger('syncService');
const TEMP_ID_MAP_KEY = 'temp_id_map';

// Type definitions
type TempIdMap = Record<string, string>;

interface SyncResult {
  success: boolean;
  realId?: string;
  url?: string;
  error?: string;
}

interface SyncError {
  id?: string;
  type?: string;
  action?: string;
  error: string;
}

interface SyncAllResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: SyncError[];
}

interface PhotoSyncData {
  base64: string;
  path: string;
  bucket?: string;
}

interface PlantSyncData {
  id?: string;
  user_id?: string;
  species_id?: string | null;
  location_id?: string | null;
  name?: string | null;
  photo_url?: string | null;
  started_date?: string | null;
  notes?: string | null;
  status?: string;
  offlinePhoto?: string;
  isOffline?: boolean;
  pendingSync?: boolean;
  created_at?: string;
}

interface ActionSyncData {
  id?: string;
  plant_id?: string;
  user_id?: string;
  action_type?: string;
  action_date?: string;
  notes?: string | null;
  photo_url?: string | null;
  offlinePhoto?: string;
  isOffline?: boolean;
  pendingSync?: boolean;
}

interface LocationSyncData {
  id?: string;
  user_id?: string;
  name?: string;
  order_index?: number;
  tempId?: string;
  isOffline?: boolean;
  pendingSync?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retrieves mapping of temp IDs to real Supabase IDs
 * @returns Map of tempId -> realId
 */
export function getTempToRealIdMap(): TempIdMap {
  const cached = getFromCache<TempIdMap>(TEMP_ID_MAP_KEY);
  return cached?.data || {};
}

/**
 * Saves mapping after sync
 * @param tempId - Temporary ID
 * @param realId - Real Supabase ID
 */
export function saveTempToRealIdMap(tempId: string, realId: string): void {
  const map = getTempToRealIdMap();
  map[tempId] = realId;
  saveToCache(TEMP_ID_MAP_KEY, map);
}

/**
 * Converts base64 data URL to Blob
 * @param base64 - Base64 data URL
 * @returns Blob object
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Resolves a potentially temp ID to real ID
 * @param id - ID that might be temporary
 * @returns Real ID or original if not found
 */
function resolveId(id: string | undefined): string | undefined {
  if (!id || !id.startsWith('temp-')) return id;
  const map = getTempToRealIdMap();
  return map[id] || id;
}

// ============================================
// PHOTO SYNC
// ============================================

/**
 * Uploads photo to Supabase storage
 * @param item - Sync queue item
 * @returns Result with success status and optional URL
 */
export async function syncPhoto(item: { data: PhotoSyncData }): Promise<SyncResult> {
  try {
    const { base64, path, bucket = 'plant-photos' } = item.data;

    if (!base64 || !path) {
      return { success: false, error: 'Missing base64 or path' };
    }

    // Convert base64 to blob
    const blob = base64ToBlob(base64);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      debug.warn('Photo upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    debug.warn('syncPhoto error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Uploads a base64 photo and returns the URL
 * @param base64 - Base64 image data
 * @param userId - User ID
 * @param plantId - Plant ID
 * @returns Public URL or null on failure
 */
async function uploadOfflinePhoto(
  base64: string,
  userId: string,
  plantId: string
): Promise<string | null> {
  const timestamp = Date.now();
  const path = `${userId}/${plantId}/${timestamp}.jpg`;

  const result = await syncPhoto({
    data: { base64, path, bucket: 'plant-photos' },
  });

  return result.success ? result.url || null : null;
}

// ============================================
// PLANT SYNC
// ============================================

/**
 * Syncs a plant to Supabase
 * @param item - Sync queue item
 * @returns Result with success status and optional real ID
 */
export async function syncPlant(item: SyncQueueItem): Promise<SyncResult> {
  try {
    const { action, data } = item;
    const plantData = { ...data } as PlantSyncData;

    // Handle offline photo if present
    if (plantData.offlinePhoto && plantData.user_id) {
      const plantId = plantData.id?.startsWith('temp-') ? 'pending' : plantData.id || 'pending';
      const photoUrl = await uploadOfflinePhoto(
        plantData.offlinePhoto,
        plantData.user_id,
        plantId
      );
      if (photoUrl) {
        plantData.photo_url = photoUrl;
      }
    }

    // Remove temp fields that shouldn't go to database
    delete plantData.offlinePhoto;
    delete plantData.isOffline;
    delete plantData.pendingSync;
    delete plantData.created_at;

    if (action === 'create') {
      // Remove temp ID for insert
      const tempId = plantData.id;
      delete plantData.id;

      const { data: newPlant, error } = await supabase
        .from('plants')
        .insert(plantData)
        .select()
        .single();

      if (error) {
        debug.warn('Plant create error:', error);
        return { success: false, error: error.message };
      }

      // Save temp -> real ID mapping
      if (tempId?.startsWith('temp-')) {
        saveTempToRealIdMap(tempId, newPlant.id);
      }

      // Update photo path with real ID if we uploaded to 'pending'
      if (newPlant.photo_url?.includes('/pending/') && (data as PlantSyncData).offlinePhoto) {
        const newPhotoUrl = await uploadOfflinePhoto(
          (data as PlantSyncData).offlinePhoto!,
          newPlant.user_id,
          newPlant.id
        );
        if (newPhotoUrl) {
          await supabase
            .from('plants')
            .update({ photo_url: newPhotoUrl })
            .eq('id', newPlant.id);
        }
      }

      return { success: true, realId: newPlant.id };
    }

    if (action === 'update') {
      const realId = resolveId(plantData.id);
      delete plantData.id;

      const { error } = await supabase
        .from('plants')
        .update(plantData)
        .eq('id', realId!);

      if (error) {
        debug.warn('Plant update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    if (action === 'delete') {
      const realId = resolveId(plantData.id);

      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', realId!);

      if (error) {
        debug.warn('Plant delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    return { success: false, error: `Unknown action: ${action}` };
  } catch (error) {
    debug.warn('syncPlant error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ============================================
// ACTION SYNC
// ============================================

/**
 * Syncs a care action to Supabase
 * @param item - Sync queue item
 * @returns Result with success status and optional real ID
 */
export async function syncAction(item: SyncQueueItem): Promise<SyncResult> {
  try {
    const { action, data } = item;
    const actionData = { ...data } as ActionSyncData;

    // Resolve temp plant ID to real ID
    if (actionData.plant_id) {
      actionData.plant_id = resolveId(actionData.plant_id);
    }

    // Handle offline photo if present
    if (actionData.offlinePhoto && actionData.user_id && actionData.plant_id) {
      const photoUrl = await uploadOfflinePhoto(
        actionData.offlinePhoto,
        actionData.user_id,
        actionData.plant_id
      );
      if (photoUrl) {
        actionData.photo_url = photoUrl;
      }
    }

    // Remove temp fields that shouldn't go to database
    delete actionData.offlinePhoto;
    delete actionData.isOffline;
    delete actionData.pendingSync;

    if (action === 'create') {
      // Remove temp ID for insert
      const tempId = actionData.id;
      delete actionData.id;

      const { data: newAction, error } = await supabase
        .from('actions')
        .insert(actionData)
        .select()
        .single();

      if (error) {
        debug.warn('Action create error:', error);
        return { success: false, error: error.message };
      }

      // Save temp -> real ID mapping
      if (tempId?.startsWith('temp-')) {
        saveTempToRealIdMap(tempId, newAction.id);
      }

      return { success: true, realId: newAction.id };
    }

    if (action === 'update') {
      const realId = resolveId(actionData.id);
      delete actionData.id;

      const { error } = await supabase
        .from('actions')
        .update(actionData)
        .eq('id', realId!);

      if (error) {
        debug.warn('Action update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    if (action === 'delete') {
      const realId = resolveId(actionData.id);

      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', realId!);

      if (error) {
        debug.warn('Action delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    return { success: false, error: `Unknown action: ${action}` };
  } catch (error) {
    debug.warn('syncAction error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ============================================
// LOCATION SYNC
// ============================================

/**
 * Syncs a location to Supabase
 * @param item - Sync queue item
 * @returns Result with success status and optional real ID
 */
export async function syncLocation(item: SyncQueueItem): Promise<SyncResult> {
  try {
    const { action, data } = item;
    const locationData = { ...data } as LocationSyncData;

    debug.log('syncLocation starting:', { action, name: locationData.name });

    // Remove temp fields
    delete locationData.isOffline;
    delete locationData.pendingSync;
    const tempId = locationData.tempId;
    delete locationData.tempId;

    if (action === 'create') {
      debug.log('Creating location:', { name: locationData.name });

      const { data: newLocation, error } = await supabase
        .from('locations')
        .insert({
          user_id: locationData.user_id,
          name: locationData.name,
          order_index: locationData.order_index,
        })
        .select()
        .single();

      if (error) {
        debug.warn('Location create error:', error);
        return { success: false, error: error.message };
      }

      // Save temp -> real ID mapping
      if (tempId?.startsWith('temp-')) {
        saveTempToRealIdMap(tempId, newLocation.id);
      }

      return { success: true, realId: newLocation.id };
    }

    if (action === 'update') {
      const realId = resolveId(locationData.id);

      const { error } = await supabase
        .from('locations')
        .update({ name: locationData.name })
        .eq('id', realId!);

      if (error) {
        debug.warn('Location update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    if (action === 'delete') {
      const realId = resolveId(locationData.id);

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', realId!);

      if (error) {
        debug.warn('Location delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    return { success: false, error: `Unknown action: ${action}` };
  } catch (error) {
    debug.warn('syncLocation error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

/**
 * Processes entire sync queue
 * @returns Result with counts of synced and failed items
 */
export async function syncAll(): Promise<SyncAllResult> {
  const result: SyncAllResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  try {
    const queue = getSyncQueue();

    if (queue.length === 0) {
      return result;
    }

    debug.log(`Starting sync of ${queue.length} items`);

    // Process items in order (important for dependencies like plant -> action)
    for (const item of queue) {
      let syncResult: SyncResult;

      debug.log(`Processing item: ${item.type} ${item.action}`);

      try {
        switch (item.type) {
          case 'location':
            syncResult = await syncLocation(item);
            break;
          case 'plant':
            syncResult = await syncPlant(item);
            break;
          case 'action':
            syncResult = await syncAction(item);
            break;
          case 'photo':
            syncResult = await syncPhoto({ data: item.data as unknown as PhotoSyncData });
            break;
          default:
            syncResult = { success: false, error: `Unknown type: ${item.type}` };
        }

        if (syncResult.success) {
          removeFromSyncQueue(item.id);
          result.synced++;
          debug.log(`Synced ${item.type} (${item.action})`);
        } else {
          result.failed++;
          result.errors.push({
            id: item.id,
            type: item.type,
            action: item.action,
            error: syncResult.error || 'Unknown error',
          });
          debug.warn(`Failed to sync ${item.type}: ${syncResult.error}`);
        }
      } catch (itemError) {
        result.failed++;
        result.errors.push({
          id: item.id,
          type: item.type,
          action: item.action,
          error: (itemError as Error).message,
        });
        debug.warn('Error syncing item:', itemError);
      }
    }

    result.success = result.failed === 0;
    debug.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);

    return result;
  } catch (error) {
    debug.warn('syncAll error:', error);
    return {
      success: false,
      synced: result.synced,
      failed: result.failed,
      errors: [...result.errors, { error: (error as Error).message }],
    };
  }
}
