import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveToCache,
  getFromCache,
  clearCache,
  clearAllCache,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
} from '@/lib/offlineStorage';

describe('Offline Storage - Cache Functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveToCache', () => {
    it('should save data to localStorage', () => {
      const testData = { name: 'Test Plant', id: '123' };
      const result = saveToCache('test-key', testData);

      expect(result).toBe(true);
    });

    it('should save with timestamp metadata', () => {
      const testData = { name: 'Test Plant' };
      saveToCache('test-key', testData);

      const stored = localStorage.getItem('tt_cache_test-key');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.data).toEqual(testData);
      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe('number');
    });
  });

  describe('getFromCache', () => {
    it('should retrieve cached data', () => {
      const testData = { name: 'Test Plant', id: '456' };
      saveToCache('test-key', testData);

      const retrieved = getFromCache<typeof testData>('test-key');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.data).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = getFromCache('non-existent-key');
      expect(retrieved).toBeNull();
    });

    it('should return cached data regardless of age (no expiration)', () => {
      // The implementation doesn't have automatic cache expiration
      // This tests that old cached data is still retrievable
      const oldData = {
        data: { name: 'Old Plant' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };
      localStorage.setItem('tt_cache_old-key', JSON.stringify(oldData));

      const retrieved = getFromCache('old-key');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.data).toEqual({ name: 'Old Plant' });
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('tt_cache_invalid', 'not-valid-json');
      const retrieved = getFromCache('invalid');
      expect(retrieved).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear a specific cache entry', () => {
      saveToCache('key1', { data: 'one' });
      saveToCache('key2', { data: 'two' });

      clearCache('key1');

      expect(getFromCache('key1')).toBeNull();
      expect(getFromCache('key2')).not.toBeNull();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache entries', () => {
      saveToCache('key1', { data: 'one' });
      saveToCache('key2', { data: 'two' });

      clearAllCache();

      expect(getFromCache('key1')).toBeNull();
      expect(getFromCache('key2')).toBeNull();
    });

    it('should not affect non-cache localStorage items', () => {
      localStorage.setItem('other-key', 'other-value');
      saveToCache('cache-key', { data: 'cached' });

      clearAllCache();

      expect(localStorage.getItem('other-key')).toBe('other-value');
      expect(getFromCache('cache-key')).toBeNull();
    });
  });
});

describe('Offline Storage - Sync Queue Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('addToSyncQueue', () => {
    it('should add item to sync queue', () => {
      const item = addToSyncQueue({
        type: 'plant',
        action: 'create',
        data: { name: 'New Plant' },
      });

      expect(item).not.toBeNull();
      expect(item?.id).toBeDefined();
      expect(item?.type).toBe('plant');
      expect(item?.action).toBe('create');
      expect(item?.createdAt).toBeDefined();
    });

    it('should generate unique IDs for each item', () => {
      const item1 = addToSyncQueue({
        type: 'plant',
        action: 'create',
        data: { name: 'Plant 1' },
      });

      const item2 = addToSyncQueue({
        type: 'plant',
        action: 'create',
        data: { name: 'Plant 2' },
      });

      expect(item1?.id).not.toBe(item2?.id);
    });
  });

  describe('getSyncQueue', () => {
    it('should return empty array when queue is empty', () => {
      const queue = getSyncQueue();
      expect(queue).toEqual([]);
    });

    it('should return all queued items', () => {
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Plant 1', user_id: 'user-1' } });
      addToSyncQueue({ type: 'action', action: 'create', data: { plant_id: 'plant-1', action_type: 'siram', action_date: '2024-01-01' } });

      const queue = getSyncQueue();

      expect(queue).toHaveLength(2);
    });

    it('should return items in order added', () => {
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'First', user_id: 'user-1' } });
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Second', user_id: 'user-1' } });

      const queue = getSyncQueue();

      expect((queue[0].data as { name: string }).name).toBe('First');
      expect((queue[1].data as { name: string }).name).toBe('Second');
    });
  });

  describe('removeFromSyncQueue', () => {
    it('should remove specific item from queue', () => {
      const item1 = addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Plant 1' } });
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Plant 2' } });

      const result = removeFromSyncQueue(item1!.id);

      expect(result).toBe(true);
      const queue = getSyncQueue();
      expect(queue).toHaveLength(1);
      expect((queue[0].data as { name: string }).name).toBe('Plant 2');
    });

    it('should return true even for non-existent item (saves unchanged queue)', () => {
      // The implementation doesn't distinguish between removing an existing vs non-existent item
      // It simply filters and saves, returning true if save succeeds
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Plant 1' } });

      const result = removeFromSyncQueue('non-existent-id');

      expect(result).toBe(true);
      // The queue should still have the original item
      const queue = getSyncQueue();
      expect(queue).toHaveLength(1);
    });
  });

  describe('clearSyncQueue', () => {
    it('should clear all items from queue', () => {
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Plant 1' } });
      addToSyncQueue({ type: 'plant', action: 'create', data: { name: 'Plant 2' } });

      clearSyncQueue();

      const queue = getSyncQueue();
      expect(queue).toEqual([]);
    });
  });
});
