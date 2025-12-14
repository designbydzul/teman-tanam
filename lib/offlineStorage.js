/**
 * Offline Storage Utility
 * Handles caching data for offline viewing and queuing actions for sync
 */

const CACHE_PREFIX = 'tt_cache_';
const SYNC_QUEUE_KEY = 'tt_sync_queue';

// ============================================
// CACHE FUNCTIONS (for viewing data offline)
// ============================================

/**
 * Saves data to localStorage with timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @returns {boolean} Success status
 */
export function saveToCache(key, data) {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
    return true;
  } catch (error) {
    console.warn('Failed to save to cache:', error);
    return false;
  }
}

/**
 * Retrieves cached data
 * @param {string} key - Cache key
 * @returns {{ data: any, timestamp: number } | null} Cached item or null
 */
export function getFromCache(key) {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;
    return JSON.parse(item);
  } catch (error) {
    console.warn('Failed to get from cache:', error);
    return null;
  }
}

/**
 * Removes specific cache entry
 * @param {string} key - Cache key
 * @returns {boolean} Success status
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.warn('Failed to clear cache:', error);
    return false;
  }
}

/**
 * Removes all cached data (only tt_cache_ prefixed items)
 * @returns {boolean} Success status
 */
export function clearAllCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.warn('Failed to clear all cache:', error);
    return false;
  }
}

// ============================================
// SYNC QUEUE FUNCTIONS (for pending actions)
// ============================================

/**
 * Gets the current sync queue
 * @returns {Array} Sync queue items
 */
export function getSyncQueue() {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!queue) return [];
    return JSON.parse(queue);
  } catch (error) {
    console.warn('Failed to get sync queue:', error);
    return [];
  }
}

/**
 * Saves the sync queue to localStorage
 * @param {Array} queue - Queue to save
 * @returns {boolean} Success status
 */
function saveSyncQueue(queue) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.warn('Failed to save sync queue:', error);
    return false;
  }
}

/**
 * Adds item to sync queue
 * @param {Object} item - Item to add
 * @param {string} item.type - Type: 'action' | 'plant' | 'photo'
 * @param {string} item.action - Action: 'create' | 'update' | 'delete'
 * @param {Object} item.data - Associated data
 * @returns {Object | null} Added item with id and timestamp, or null on failure
 */
export function addToSyncQueue(item) {
  try {
    const queue = getSyncQueue();
    const newItem = {
      id: generateTempId(),
      type: item.type,
      action: item.action,
      data: item.data,
      createdAt: Date.now(),
    };
    queue.push(newItem);
    saveSyncQueue(queue);
    return newItem;
  } catch (error) {
    console.warn('Failed to add to sync queue:', error);
    return null;
  }
}

/**
 * Removes synced item from queue
 * @param {string} id - Item ID to remove
 * @returns {boolean} Success status
 */
export function removeFromSyncQueue(id) {
  try {
    const queue = getSyncQueue();
    const filteredQueue = queue.filter((item) => item.id !== id);
    return saveSyncQueue(filteredQueue);
  } catch (error) {
    console.warn('Failed to remove from sync queue:', error);
    return false;
  }
}

/**
 * Clears all pending items from sync queue
 * @returns {boolean} Success status
 */
export function clearSyncQueue() {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear sync queue:', error);
    return false;
  }
}

/**
 * Returns number of pending items in sync queue
 * @returns {number} Queue count
 */
export function getSyncQueueCount() {
  return getSyncQueue().length;
}

// ============================================
// HELPER
// ============================================

/**
 * Generates a temporary ID for offline-created items
 * @returns {string} Temporary ID like 'temp-xxx'
 */
export function generateTempId() {
  const random = Math.random().toString(36).substring(2, 9);
  return `temp-${random}`;
}
