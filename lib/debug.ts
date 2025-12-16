/**
 * Debug utility for development logging
 * Only logs in development mode, silent in production
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'warn' | 'error';

interface DebugOptions {
  /** Force logging even in production (use sparingly) */
  force?: boolean;
}

/**
 * Create a namespaced debug logger
 * @param namespace - The namespace for this logger (e.g., 'useAuth', 'usePlants')
 * @returns Debug functions for this namespace
 */
export function createDebugger(namespace: string) {
  const formatMessage = (message: string) => `[${namespace}] ${message}`;

  const shouldLog = (options?: DebugOptions) => isDev || options?.force;

  return {
    /**
     * Log a debug message (only in development)
     */
    log: (message: string, data?: unknown, options?: DebugOptions) => {
      if (shouldLog(options)) {
        if (data !== undefined) {
          console.log(formatMessage(message), data);
        } else {
          console.log(formatMessage(message));
        }
      }
    },

    /**
     * Log a warning (only in development)
     */
    warn: (message: string, data?: unknown, options?: DebugOptions) => {
      if (shouldLog(options)) {
        if (data !== undefined) {
          console.warn(formatMessage(message), data);
        } else {
          console.warn(formatMessage(message));
        }
      }
    },

    /**
     * Log an error (always logs, but with less detail in production)
     */
    error: (message: string, error?: unknown) => {
      if (isDev) {
        console.error(formatMessage(message), error);
      } else {
        // In production, log without potentially sensitive error details
        console.error(formatMessage(message));
      }
    },

    /**
     * Group related logs together (only in development)
     */
    group: (label: string, fn: () => void, options?: DebugOptions) => {
      if (shouldLog(options)) {
        console.group(formatMessage(label));
        fn();
        console.groupEnd();
      }
    },

    /**
     * Log timing information (only in development)
     */
    time: (label: string, options?: DebugOptions) => {
      if (shouldLog(options)) {
        console.time(formatMessage(label));
      }
    },

    timeEnd: (label: string, options?: DebugOptions) => {
      if (shouldLog(options)) {
        console.timeEnd(formatMessage(label));
      }
    },
  };
}

// Pre-created debuggers for common namespaces
export const debugAuth = createDebugger('useAuth');
export const debugPlants = createDebugger('usePlants');
export const debugLocations = createDebugger('useLocations');
export const debugSync = createDebugger('syncService');
export const debugOffline = createDebugger('offlineStorage');
export const debugSupabase = createDebugger('supabase');

// Default export for quick usage
export default createDebugger;
