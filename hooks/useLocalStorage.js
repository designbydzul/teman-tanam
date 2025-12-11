'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for centralized localStorage access with caching
 * Prevents redundant JSON.parse calls and provides consistent API
 *
 * @param {string} key - localStorage key
 * @param {any} initialValue - default value if key doesn't exist
 * @returns {[any, function, function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Initialize state with lazy initialization to avoid JSON.parse on every render
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Memoized setter that updates both state and localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function for functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch custom event to sync across components
        window.dispatchEvent(new CustomEvent('local-storage-change', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Memoized remover
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);

        window.dispatchEvent(new CustomEvent('local-storage-change', {
          detail: { key, value: null }
        }));
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes from other components using the same key
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.detail?.key === key) {
        setStoredValue(event.detail.value ?? initialValue);
      }
    };

    // Listen for custom events (same tab)
    window.addEventListener('local-storage-change', handleStorageChange);

    // Listen for storage events (other tabs)
    const handleNativeStorageChange = (event) => {
      if (event.key === key) {
        try {
          setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleNativeStorageChange);

    return () => {
      window.removeEventListener('local-storage-change', handleStorageChange);
      window.removeEventListener('storage', handleNativeStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Default storage keys used across the app
export const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  LOCATIONS: 'plantLocations',
  PLANTS: 'plants',
};

export default useLocalStorage;
