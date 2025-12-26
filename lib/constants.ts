/**
 * Application constants
 * Centralized place for all magic strings and configuration values
 */

// Action types for plant care
export const ACTION_TYPES = {
  WATER: 'siram',
  FERTILIZE: 'pupuk',
  PRUNE: 'pangkas',
  OTHER: 'lainnya',
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

// Plant status labels
export const PLANT_STATUS = {
  NEEDS_WATERING: 'Perlu disiram',
  NEEDS_FERTILIZING: 'Perlu dipupuk',
  HEALTHY: 'Terawat',
  READY_TO_HARVEST: 'Siap dipanen',
  WATERED_TODAY: 'Sudah disiram hari ini',
  FERTILIZED_TODAY: 'Sudah dipupuk hari ini',
} as const;

export type PlantStatus = typeof PLANT_STATUS[keyof typeof PLANT_STATUS];

// Status filter options
export const STATUS_FILTER_OPTIONS = [
  { value: 'Semua', label: 'Semua Status' },
  { value: PLANT_STATUS.NEEDS_WATERING, label: PLANT_STATUS.NEEDS_WATERING },
  { value: PLANT_STATUS.NEEDS_FERTILIZING, label: PLANT_STATUS.NEEDS_FERTILIZING },
  { value: PLANT_STATUS.READY_TO_HARVEST, label: PLANT_STATUS.READY_TO_HARVEST },
  { value: PLANT_STATUS.HEALTHY, label: PLANT_STATUS.HEALTHY },
] as const;

// Status colors
export const STATUS_COLORS = {
  [PLANT_STATUS.NEEDS_WATERING]: '#F57C00',
  [PLANT_STATUS.NEEDS_FERTILIZING]: '#F57C00',
  [PLANT_STATUS.READY_TO_HARVEST]: '#4CAF50',
  [PLANT_STATUS.HEALTHY]: '#7CB342',
} as const;

// Harvestable plant categories
export const HARVESTABLE_CATEGORIES = [
  'sayuran',
  'buah',
  'rempah',
  'vegetable',
  'fruit',
  'herb',
] as const;

// Default care frequencies (in days)
export const DEFAULT_CARE_FREQUENCY = {
  WATERING: 3,
  FERTILIZING: 14,
} as const;

// Species emoji mapping
export const SPECIES_EMOJI_MAP: Record<string, string> = {
  'labuh': '🎃',
  'kentang': '🥔',
  'wortel': '🥕',
  'brokoli': '🥦',
  'kacang hijau': '🫘',
  'paprika': '🫑',
  'bawang merah': '🧅',
  'bayam': '🥬',
  'kembang kol': '🥬',
  'tomat': '🍅',
  'kubis': '🥬',
  'terong': '🍆',
  'cabai': '🌶️',
  'jagung': '🌽',
  'selada': '🥗',
  'mentimun': '🥒',
  'timun': '🥒',
  'bawang putih': '🧄',
  'labu siam': '🥒',
  'kangkung': '🥬',
  'sawi': '🥬',
  'seledri': '🥬',
} as const;

export const DEFAULT_PLANT_EMOJI = '🌱';

/**
 * Get emoji for a species by name (case insensitive)
 */
export function getSpeciesEmoji(speciesName: string | null | undefined): string {
  if (!speciesName) return DEFAULT_PLANT_EMOJI;
  const normalized = speciesName.toLowerCase().trim();
  return SPECIES_EMOJI_MAP[normalized] || DEFAULT_PLANT_EMOJI;
}

// Cache keys for offline storage
export const CACHE_KEYS = {
  PLANTS: 'plants',
  LOCATIONS: 'locations',
  TEMP_ID_MAP: 'temp_id_map',
  SYNC_QUEUE: 'syncQueue',
} as const;

// Timeout values (in milliseconds)
export const TIMEOUTS = {
  PROFILE_FETCH: 10000, // Increased to 10 seconds for slow connections
  SAFETY_LOADING: 10000,
  ONBOARDING_REQUEST: 20000,
  ACTION_TOAST: 3000,
  NETWORK_TOAST: 3000,
  SYNC_STATUS_RESET: 3000,
} as const;

// Sync status
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type SyncStatus = typeof SYNC_STATUS[keyof typeof SYNC_STATUS];

// Network status
export const NETWORK_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECONNECTING: 'reconnecting',
} as const;

export type NetworkStatus = typeof NETWORK_STATUS[keyof typeof NETWORK_STATUS];

// Care status types
export const CARE_STATUS = {
  NEEDS_ACTION: 'needs_action',
  DONE_TODAY: 'done_today',
  ON_SCHEDULE: 'on_schedule',
} as const;

export type CareStatus = typeof CARE_STATUS[keyof typeof CARE_STATUS];

// Location filter default
export const DEFAULT_LOCATION_FILTER = 'Semua';

// UUID validation regex
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str);
}
