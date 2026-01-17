/**
 * Debug utility for development logging
 * Only logs in development mode, silent in production
 *
 * SECURITY: This utility automatically sanitizes sensitive data
 * to prevent accidental exposure of secrets in logs.
 */

const isDev = process.env.NODE_ENV === 'development';

interface DebugOptions {
  /** Force logging even in production (use sparingly) */
  force?: boolean;
}

/**
 * Patterns that indicate sensitive data
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /private[_-]?key/i,
];

/**
 * Keys that should have their values masked
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'authorization',
  'auth',
  'otp',
  'otp_code',
  'pin',
  'cvv',
  'ssn',
  'credit_card',
]);

/**
 * Sanitize data to remove or mask sensitive information
 */
function sanitizeData(data: unknown, depth: number = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[max depth]';

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Mask if it looks like an email
    if (data.includes('@') && data.includes('.')) {
      const [localPart, domain] = data.split('@');
      if (localPart && domain) {
        return `${localPart.substring(0, 2)}***@${domain}`;
      }
    }
    // Mask if it looks like a phone number (10+ digits)
    if (/^\+?\d{10,}$/.test(data.replace(/[\s-]/g, ''))) {
      return `${data.substring(0, 4)}****${data.slice(-2)}`;
    }
    // Mask if it looks like a JWT or API key
    if (data.length > 20 && (data.startsWith('ey') || data.startsWith('sk-') || data.startsWith('pk-'))) {
      return `${data.substring(0, 10)}...[REDACTED]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      // Check if key is sensitive
      if (SENSITIVE_KEYS.has(lowerKey) || SENSITIVE_PATTERNS.some(p => p.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
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
     * Data is automatically sanitized to remove sensitive information
     */
    log: (message: string, data?: unknown, options?: DebugOptions) => {
      if (shouldLog(options)) {
        if (data !== undefined) {
          // Sanitize data to prevent accidental exposure of secrets
          const sanitizedData = sanitizeData(data);
          console.log(formatMessage(message), sanitizedData);
        } else {
          console.log(formatMessage(message));
        }
      }
    },

    /**
     * Log a warning (only in development)
     * Data is automatically sanitized to remove sensitive information
     */
    warn: (message: string, data?: unknown, options?: DebugOptions) => {
      if (shouldLog(options)) {
        if (data !== undefined) {
          const sanitizedData = sanitizeData(data);
          console.warn(formatMessage(message), sanitizedData);
        } else {
          console.warn(formatMessage(message));
        }
      }
    },

    /**
     * Log an error (always logs, but with less detail in production)
     * Error details are sanitized and minimized in production
     */
    error: (message: string, error?: unknown) => {
      if (isDev) {
        // In development, log sanitized error details
        const sanitizedError = sanitizeData(error);
        console.error(formatMessage(message), sanitizedError);
      } else {
        // In production, log without potentially sensitive error details
        // Only log the error type/name if it's an Error object
        if (error instanceof Error) {
          console.error(formatMessage(message), `[${error.name}]`);
        } else {
          console.error(formatMessage(message));
        }
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
