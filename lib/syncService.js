/**
 * Sync Service
 * Handles uploading offline data to Supabase when back online
 */

import { supabase } from '@/lib/supabase/client';
import {
  getSyncQueue,
  removeFromSyncQueue,
  saveToCache,
  getFromCache,
  clearCache,
} from './offlineStorage';

const TEMP_ID_MAP_KEY = 'temp_id_map';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retrieves mapping of temp IDs to real Supabase IDs
 * @returns {Object} Map of tempId -> realId
 */
export function getTempToRealIdMap() {
  const cached = getFromCache(TEMP_ID_MAP_KEY);
  return cached?.data || {};
}

/**
 * Saves mapping after sync
 * @param {string} tempId - Temporary ID
 * @param {string} realId - Real Supabase ID
 */
export function saveTempToRealIdMap(tempId, realId) {
  const map = getTempToRealIdMap();
  map[tempId] = realId;
  saveToCache(TEMP_ID_MAP_KEY, map);
}

/**
 * Converts base64 data URL to Blob
 * @param {string} base64 - Base64 data URL
 * @returns {Blob} Blob object
 */
function base64ToBlob(base64) {
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
 * @param {string} id - ID that might be temporary
 * @returns {string} Real ID or original if not found
 */
function resolveId(id) {
  if (!id || !id.startsWith('temp-')) return id;
  const map = getTempToRealIdMap();
  return map[id] || id;
}

// ============================================
// PHOTO SYNC
// ============================================

/**
 * Uploads photo to Supabase storage
 * @param {Object} item - Sync queue item
 * @param {string} item.data.base64 - Base64 image data
 * @param {string} item.data.path - Storage path
 * @param {string} item.data.bucket - Storage bucket name (default: 'plant-photos')
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
export async function syncPhoto(item) {
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
      console.warn('[syncService] Photo upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.warn('[syncService] syncPhoto error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Uploads a base64 photo and returns the URL
 * @param {string} base64 - Base64 image data
 * @param {string} userId - User ID
 * @param {string} plantId - Plant ID
 * @returns {Promise<string | null>} Public URL or null on failure
 */
async function uploadOfflinePhoto(base64, userId, plantId) {
  const timestamp = Date.now();
  const path = `${userId}/${plantId}/${timestamp}.jpg`;

  const result = await syncPhoto({
    data: { base64, path, bucket: 'plant-photos' },
  });

  return result.success ? result.url : null;
}

// ============================================
// PLANT SYNC
// ============================================

/**
 * Syncs a plant to Supabase
 * @param {Object} item - Sync queue item
 * @returns {Promise<{ success: boolean, realId?: string, error?: string }>}
 */
export async function syncPlant(item) {
  try {
    const { action, data } = item;
    const plantData = { ...data };

    // Handle offline photo if present
    if (plantData.offlinePhoto && plantData.user_id) {
      const plantId = plantData.id?.startsWith('temp-') ? 'pending' : plantData.id;
      const photoUrl = await uploadOfflinePhoto(
        plantData.offlinePhoto,
        plantData.user_id,
        plantId
      );
      if (photoUrl) {
        plantData.photo_url = photoUrl;
      }
      delete plantData.offlinePhoto;
    }

    // Remove temp fields that shouldn't go to database
    delete plantData.isOffline;
    delete plantData.pendingSync;

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
        console.warn('[syncService] Plant create error:', error);
        return { success: false, error: error.message };
      }

      // Save temp -> real ID mapping
      if (tempId?.startsWith('temp-')) {
        saveTempToRealIdMap(tempId, newPlant.id);
      }

      // Update photo path with real ID if we uploaded to 'pending'
      if (newPlant.photo_url?.includes('/pending/')) {
        const newPhotoUrl = await uploadOfflinePhoto(
          data.offlinePhoto,
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
        .eq('id', realId);

      if (error) {
        console.warn('[syncService] Plant update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    if (action === 'delete') {
      const realId = resolveId(plantData.id);

      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', realId);

      if (error) {
        console.warn('[syncService] Plant delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    return { success: false, error: `Unknown action: ${action}` };
  } catch (error) {
    console.warn('[syncService] syncPlant error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ACTION SYNC
// ============================================

/**
 * Syncs a care action to Supabase
 * @param {Object} item - Sync queue item
 * @returns {Promise<{ success: boolean, realId?: string, error?: string }>}
 */
export async function syncAction(item) {
  try {
    const { action, data } = item;
    const actionData = { ...data };

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
      delete actionData.offlinePhoto;
    }

    // Remove temp fields
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
        console.warn('[syncService] Action create error:', error);
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
        .eq('id', realId);

      if (error) {
        console.warn('[syncService] Action update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    if (action === 'delete') {
      const realId = resolveId(actionData.id);

      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', realId);

      if (error) {
        console.warn('[syncService] Action delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    return { success: false, error: `Unknown action: ${action}` };
  } catch (error) {
    console.warn('[syncService] syncAction error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// LOCATION SYNC
// ============================================

/**
 * Syncs a location to Supabase
 * @param {Object} item - Sync queue item
 * @returns {Promise<{ success: boolean, realId?: string, error?: string }>}
 */
export async function syncLocation(item) {
  try {
    const { action, data } = item;
    const locationData = { ...data };

    // Remove temp fields
    delete locationData.isOffline;
    delete locationData.pendingSync;
    delete locationData.tempId;

    if (action === 'create') {
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
        console.warn('[syncService] Location create error:', error);
        return { success: false, error: error.message };
      }

      // Save temp -> real ID mapping
      if (data.tempId?.startsWith('temp-')) {
        saveTempToRealIdMap(data.tempId, newLocation.id);
      }

      return { success: true, realId: newLocation.id };
    }

    if (action === 'update') {
      const realId = resolveId(locationData.id);

      const { error } = await supabase
        .from('locations')
        .update({ name: locationData.name })
        .eq('id', realId);

      if (error) {
        console.warn('[syncService] Location update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    if (action === 'delete') {
      const realId = resolveId(locationData.id);

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', realId);

      if (error) {
        console.warn('[syncService] Location delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, realId };
    }

    return { success: false, error: `Unknown action: ${action}` };
  } catch (error) {
    console.warn('[syncService] syncLocation error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

/**
 * Processes entire sync queue
 * @returns {Promise<{ success: boolean, synced: number, failed: number, errors: Array }>}
 */
export async function syncAll() {
  const result = {
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

    console.log(`[syncService] Starting sync of ${queue.length} items`);

    // Process items in order (important for dependencies like plant -> action)
    for (const item of queue) {
      let syncResult;

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
            syncResult = await syncPhoto(item);
            break;
          default:
            syncResult = { success: false, error: `Unknown type: ${item.type}` };
        }

        if (syncResult.success) {
          removeFromSyncQueue(item.id);
          result.synced++;
          console.log(`[syncService] Synced ${item.type} (${item.action}): ${item.id}`);
        } else {
          result.failed++;
          result.errors.push({
            id: item.id,
            type: item.type,
            action: item.action,
            error: syncResult.error,
          });
          console.warn(`[syncService] Failed to sync ${item.type}: ${syncResult.error}`);
        }
      } catch (itemError) {
        result.failed++;
        result.errors.push({
          id: item.id,
          type: item.type,
          action: item.action,
          error: itemError.message,
        });
        console.warn(`[syncService] Error syncing item ${item.id}:`, itemError);
      }
    }

    result.success = result.failed === 0;
    console.log(`[syncService] Sync complete: ${result.synced} synced, ${result.failed} failed`);

    return result;
  } catch (error) {
    console.warn('[syncService] syncAll error:', error);
    return {
      success: false,
      synced: result.synced,
      failed: result.failed,
      errors: [...result.errors, { error: error.message }],
    };
  }
}
