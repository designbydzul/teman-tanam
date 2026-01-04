/**
 * Offline Storage Utility
 * Handles caching data for offline viewing and queuing actions for sync
 */

import { createDebugger } from '@/lib/debug';

const debug = createDebugger('offlineStorage');

const CACHE_PREFIX = 'tt_cache_';
const SYNC_QUEUE_KEY = 'tt_sync_queue';

// Type definitions
interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'action' | 'plant' | 'photo' | 'location';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: number;
}

interface AddSyncQueueInput {
  type: 'action' | 'plant' | 'photo' | 'location';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
}

// ============================================
// CACHE FUNCTIONS (for viewing data offline)
// ============================================

/**
 * Saves data to localStorage with timestamp
 * @param key - Cache key
 * @param data - Data to cache
 * @returns Success status
 */
export function saveToCache<T>(key: string, data: T): boolean {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
    return true;
  } catch (error) {
    debug.warn('Failed to save to cache:', error);
    return false;
  }
}

/**
 * Retrieves cached data
 * @param key - Cache key
 * @returns Cached item or null
 */
export function getFromCache<T = unknown>(key: string): CacheItem<T> | null {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;
    return JSON.parse(item) as CacheItem<T>;
  } catch (error) {
    debug.warn('Failed to get from cache:', error);
    return null;
  }
}

/**
 * Removes specific cache entry
 * @param key - Cache key
 * @returns Success status
 */
export function clearCache(key: string): boolean {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return true;
  } catch (error) {
    debug.warn('Failed to clear cache:', error);
    return false;
  }
}

/**
 * Removes all cached data (only tt_cache_ prefixed items)
 * @returns Success status
 */
export function clearAllCache(): boolean {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch (error) {
    debug.warn('Failed to clear all cache:', error);
    return false;
  }
}

// ============================================
// SYNC QUEUE FUNCTIONS (for pending actions)
// ============================================

/**
 * Gets the current sync queue
 * @returns Sync queue items
 */
export function getSyncQueue(): SyncQueueItem[] {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!queue) return [];
    return JSON.parse(queue) as SyncQueueItem[];
  } catch (error) {
    debug.warn('Failed to get sync queue:', error);
    return [];
  }
}

/**
 * Saves the sync queue to localStorage
 * @param queue - Queue to save
 * @returns Success status
 */
function saveSyncQueue(queue: SyncQueueItem[]): boolean {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    debug.warn('Failed to save sync queue:', error);
    return false;
  }
}

/**
 * Adds item to sync queue
 * @param item - Item to add
 * @returns Added item with id and timestamp, or null on failure
 */
export function addToSyncQueue(item: AddSyncQueueInput): SyncQueueItem | null {
  try {
    const queue = getSyncQueue();
    const newItem: SyncQueueItem = {
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
    debug.warn('Failed to add to sync queue:', error);
    return null;
  }
}

/**
 * Removes synced item from queue
 * @param id - Item ID to remove
 * @returns Success status
 */
export function removeFromSyncQueue(id: string): boolean {
  try {
    const queue = getSyncQueue();
    const filteredQueue = queue.filter((item) => item.id !== id);
    return saveSyncQueue(filteredQueue);
  } catch (error) {
    debug.warn('Failed to remove from sync queue:', error);
    return false;
  }
}

/**
 * Clears all pending items from sync queue
 * @returns Success status
 */
export function clearSyncQueue(): boolean {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    return true;
  } catch (error) {
    debug.warn('Failed to clear sync queue:', error);
    return false;
  }
}

/**
 * Returns number of pending items in sync queue
 * @returns Queue count
 */
export function getSyncQueueCount(): number {
  return getSyncQueue().length;
}

// ============================================
// HELPER
// ============================================

/**
 * Generates a temporary ID for offline-created items
 * @returns Temporary ID like 'temp-xxx'
 */
export function generateTempId(): string {
  const random = Math.random().toString(36).substring(2, 9);
  return `temp-${random}`;
}
