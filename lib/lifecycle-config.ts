/**
 * Plant Lifecycle Configuration
 * Defines phases, colors, icons, and labels for the Plant Life Journey feature
 */

import { LifecyclePhase, PlantLifecycleType } from '@/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for a single lifecycle phase
 */
export interface PhaseConfig {
  /** Phase key identifier */
  key: LifecyclePhase;
  /** Indonesian label for display */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Hex color code */
  color: string;
  /** Indonesian description */
  description: string;
}

// ============================================================================
// Phase Configurations
// ============================================================================

/**
 * Configuration for each lifecycle phase
 * Keys match the LifecyclePhase type
 */
export const LIFECYCLE_PHASES: Record<LifecyclePhase, PhaseConfig> = {
  seedling: {
    key: 'seedling',
    label: 'Bibit',
    icon: '🌱',
    color: '#A5D6A7', // Light green
    description: 'Baru mulai tumbuh',
  },
  growing: {
    key: 'growing',
    label: 'Tumbuh',
    icon: '🌿',
    color: '#81C784', // Medium green
    description: 'Sedang tumbuh aktif',
  },
  flowering: {
    key: 'flowering',
    label: 'Berbunga',
    icon: '🌸',
    color: '#F48FB1', // Pink
    description: 'Mulai berbunga',
  },
  fruiting: {
    key: 'fruiting',
    label: 'Berbuah',
    icon: '🍅',
    color: '#FFCC80', // Orange
    description: 'Sedang berbuah',
  },
  harvest_ready: {
    key: 'harvest_ready',
    label: 'Siap Panen',
    icon: '✨',
    color: '#FFD54F', // Golden yellow
    description: 'Waktunya panen!',
  },
  harvested: {
    key: 'harvested',
    label: 'Dipanen',
    icon: '🎉',
    color: '#90CAF9', // Light blue
    description: 'Sudah dipanen',
  },
  resting: {
    key: 'resting',
    label: 'Istirahat',
    icon: '😴',
    color: '#BCAAA4', // Brown/tan
    description: 'Masa istirahat',
  },
  mature: {
    key: 'mature',
    label: 'Dewasa',
    icon: '🌳',
    color: '#2D5016', // Forest green (brand color)
    description: 'Tanaman dewasa',
  },
} as const;

// ============================================================================
// Lifecycle Type to Valid Phases Mapping
// ============================================================================

/**
 * Maps lifecycle types to their valid phase sequences
 * - annual_harvest: Plants that grow, harvest once, then die (vegetables, flowers)
 * - perennial_harvest: Plants that harvest multiple times with rest periods (herbs)
 * - perpetual: Plants that grow to maturity and stay there (ornamental plants)
 */
export const LIFECYCLE_TYPE_PHASES: Record<PlantLifecycleType, LifecyclePhase[]> = {
  annual_harvest: [
    'seedling',
    'growing',
    'flowering',
    'fruiting',
    'harvest_ready',
    'harvested',
  ],
  perennial_harvest: [
    'seedling',
    'growing',
    'flowering',
    'fruiting',
    'harvest_ready',
    'harvested',
    'resting',
    // Note: After resting, cycles back to growing
  ],
  perpetual: [
    'seedling',
    'growing',
    'mature',
  ],
} as const;

/**
 * Default phase for new plants
 */
export const DEFAULT_PHASE: LifecyclePhase = 'seedling';

/**
 * Default lifecycle type when species doesn't specify one
 */
export const DEFAULT_LIFECYCLE_TYPE: PlantLifecycleType = 'perpetual';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the configuration for a specific phase
 * @param phase - The lifecycle phase key
 * @returns PhaseConfig or undefined if not found
 */
export function getPhaseConfig(phase: LifecyclePhase | string | null | undefined): PhaseConfig | undefined {
  if (!phase) return undefined;
  return LIFECYCLE_PHASES[phase as LifecyclePhase];
}

/**
 * Get the valid phases for a lifecycle type
 * @param lifecycleType - The lifecycle type
 * @returns Array of valid phases for that type
 */
export function getValidPhases(lifecycleType: PlantLifecycleType | string | null | undefined): LifecyclePhase[] {
  if (!lifecycleType) return LIFECYCLE_TYPE_PHASES[DEFAULT_LIFECYCLE_TYPE];
  return LIFECYCLE_TYPE_PHASES[lifecycleType as PlantLifecycleType] || LIFECYCLE_TYPE_PHASES[DEFAULT_LIFECYCLE_TYPE];
}

/**
 * Get the next phase in the lifecycle sequence
 * @param currentPhase - Current phase
 * @param lifecycleType - The plant's lifecycle type
 * @returns Next phase or null if at end of lifecycle
 */
export function getNextPhase(
  currentPhase: LifecyclePhase | string | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): LifecyclePhase | null {
  if (!currentPhase) return DEFAULT_PHASE;

  const validPhases = getValidPhases(lifecycleType);
  const currentIndex = validPhases.indexOf(currentPhase as LifecyclePhase);

  if (currentIndex === -1) return null;

  // For perennial_harvest, after resting cycle back to growing
  if (lifecycleType === 'perennial_harvest' && currentPhase === 'resting') {
    return 'growing';
  }

  // For annual_harvest, harvested is the final phase
  if (lifecycleType === 'annual_harvest' && currentPhase === 'harvested') {
    return null;
  }

  // For perpetual, mature is the final phase
  if (lifecycleType === 'perpetual' && currentPhase === 'mature') {
    return null;
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= validPhases.length) return null;

  return validPhases[nextIndex];
}

/**
 * Get the previous phase in the lifecycle sequence
 * @param currentPhase - Current phase
 * @param lifecycleType - The plant's lifecycle type
 * @returns Previous phase or null if at start
 */
export function getPreviousPhase(
  currentPhase: LifecyclePhase | string | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): LifecyclePhase | null {
  if (!currentPhase) return null;

  const validPhases = getValidPhases(lifecycleType);
  const currentIndex = validPhases.indexOf(currentPhase as LifecyclePhase);

  if (currentIndex <= 0) return null;

  return validPhases[currentIndex - 1];
}

/**
 * Check if a phase is valid for a given lifecycle type
 * @param phase - Phase to check
 * @param lifecycleType - The lifecycle type
 * @returns true if the phase is valid for the lifecycle type
 */
export function isValidPhaseForType(
  phase: LifecyclePhase | string | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): boolean {
  if (!phase) return false;
  const validPhases = getValidPhases(lifecycleType);
  return validPhases.includes(phase as LifecyclePhase);
}

/**
 * Get phase display info (label, icon, color) with fallback
 * @param phase - The phase to get display info for
 * @returns Object with label, icon, and color
 */
export function getPhaseDisplay(phase: LifecyclePhase | string | null | undefined): {
  label: string;
  icon: string;
  color: string;
} {
  const config = getPhaseConfig(phase);
  if (config) {
    return {
      label: config.label,
      icon: config.icon,
      color: config.color,
    };
  }
  // Fallback for unknown/null phases
  return {
    label: 'Tidak diketahui',
    icon: '❓',
    color: '#9E9E9E', // Gray
  };
}

/**
 * Calculate progress percentage through lifecycle
 * @param currentPhase - Current phase
 * @param lifecycleType - The plant's lifecycle type
 * @returns Progress percentage (0-100)
 */
export function getLifecycleProgress(
  currentPhase: LifecyclePhase | string | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): number {
  if (!currentPhase) return 0;

  const validPhases = getValidPhases(lifecycleType);
  const currentIndex = validPhases.indexOf(currentPhase as LifecyclePhase);

  if (currentIndex === -1) return 0;

  // For perennial_harvest, use phases up to harvest_ready as 100%
  // since resting is part of the cycle, not the end
  if (lifecycleType === 'perennial_harvest') {
    const harvestIndex = validPhases.indexOf('harvest_ready');
    if (currentIndex <= harvestIndex) {
      return Math.round((currentIndex / harvestIndex) * 100);
    }
    // harvested = 100%, resting resets cycle conceptually
    return 100;
  }

  return Math.round((currentIndex / (validPhases.length - 1)) * 100);
}

/**
 * Get all phases as an ordered array for UI display
 * @returns Array of all PhaseConfig objects in display order
 */
export function getAllPhasesOrdered(): PhaseConfig[] {
  return [
    LIFECYCLE_PHASES.seedling,
    LIFECYCLE_PHASES.growing,
    LIFECYCLE_PHASES.flowering,
    LIFECYCLE_PHASES.fruiting,
    LIFECYCLE_PHASES.harvest_ready,
    LIFECYCLE_PHASES.harvested,
    LIFECYCLE_PHASES.resting,
    LIFECYCLE_PHASES.mature,
  ];
}

// ============================================================================
// Phase Calculation & Transition Utilities
// ============================================================================

/**
 * Calculate the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date (defaults to now)
 * @returns Number of days
 */
function daysBetween(startDate: Date | string, endDate: Date | string = new Date()): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the expected phase based on plant age and lifecycle configuration
 * @param plantedDate - Date the plant was started/planted
 * @param harvestDaysMin - Minimum days to harvest (from species)
 * @param harvestDaysMax - Maximum days to harvest (from species)
 * @param lifecycleType - The plant's lifecycle type
 * @returns Expected lifecycle phase based on age
 */
export function calculateExpectedPhase(
  plantedDate: Date | string | null | undefined,
  harvestDaysMin: number | null | undefined,
  harvestDaysMax: number | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): LifecyclePhase {
  if (!plantedDate) return DEFAULT_PHASE;

  const age = daysBetween(plantedDate);
  const type = (lifecycleType as PlantLifecycleType) || DEFAULT_LIFECYCLE_TYPE;

  // Seedling phase: 0-14 days
  if (age <= 14) {
    return 'seedling';
  }

  // Growing phase: 15-30 days (or until flowering for harvestable)
  if (age <= 30) {
    return 'growing';
  }

  // For perpetual plants (ornamental), mature after 60 days
  if (type === 'perpetual') {
    if (age >= 60) {
      return 'mature';
    }
    return 'growing';
  }

  // For harvestable plants (annual_harvest and perennial_harvest)
  const minDays = harvestDaysMin || 60; // Default 60 days if not specified
  const maxDays = harvestDaysMax || minDays + 30;

  // Flowering: approaching harvest (70% of min days)
  const floweringThreshold = Math.floor(minDays * 0.7);
  if (age < floweringThreshold) {
    return 'growing';
  }

  // Fruiting: at 85% of min days
  const fruitingThreshold = Math.floor(minDays * 0.85);
  if (age < fruitingThreshold) {
    return 'flowering';
  }

  // Harvest ready: between min and max days
  if (age < minDays) {
    return 'fruiting';
  }

  // At or beyond harvest time
  // Note: We return harvest_ready even beyond maxDays - user should harvest
  return 'harvest_ready';
}

/**
 * Get the number of days since the phase was changed
 * @param phaseChangedAt - Timestamp when the phase was last changed
 * @returns Number of days in current phase, or 0 if not available
 */
export function getDaysInPhase(phaseChangedAt: Date | string | null | undefined): number {
  if (!phaseChangedAt) return 0;
  return daysBetween(phaseChangedAt);
}

/**
 * Get the plant's age in days since planting
 * @param plantedDate - Date the plant was started
 * @returns Number of days since planting
 */
export function getPlantAge(plantedDate: Date | string | null | undefined): number {
  if (!plantedDate) return 0;
  return daysBetween(plantedDate);
}

/**
 * Calculate progress percentage through lifecycle based on plant age
 * @param currentPhase - Current phase
 * @param lifecycleType - The plant's lifecycle type
 * @param plantAge - Age of plant in days
 * @param harvestDaysMin - Minimum days to harvest
 * @returns Progress percentage (0-100)
 */
export function getPhaseProgressPercentage(
  currentPhase: LifecyclePhase | string | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined,
  plantAge: number,
  harvestDaysMin: number | null | undefined
): number {
  if (!currentPhase || plantAge < 0) return 0;

  const type = (lifecycleType as PlantLifecycleType) || DEFAULT_LIFECYCLE_TYPE;
  const targetDays = harvestDaysMin || 60;

  // For perpetual plants, 100% at mature (60 days)
  if (type === 'perpetual') {
    const matureDays = 60;
    if (currentPhase === 'mature') return 100;
    return Math.min(100, Math.round((plantAge / matureDays) * 100));
  }

  // For harvestable plants, use harvest days as 100%
  if (currentPhase === 'harvested' || currentPhase === 'harvest_ready') {
    return 100;
  }

  // Calculate progress based on age vs target harvest days
  const progress = Math.min(100, Math.round((plantAge / targetDays) * 100));
  return progress;
}

/**
 * Check if user can manually set a phase
 * Rules:
 * - Can go forward or back one phase
 * - Can skip to harvest_ready if plant looks ready (but not past it)
 * - Cannot skip backward more than one phase
 * @param currentPhase - Current phase
 * @param targetPhase - Desired phase to change to
 * @param lifecycleType - The plant's lifecycle type
 * @returns true if the phase change is allowed
 */
export function canManuallySetPhase(
  currentPhase: LifecyclePhase | string | null | undefined,
  targetPhase: LifecyclePhase | string | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): boolean {
  if (!currentPhase || !targetPhase) return false;
  if (currentPhase === targetPhase) return true; // Same phase is always allowed

  const validPhases = getValidPhases(lifecycleType);
  const currentIndex = validPhases.indexOf(currentPhase as LifecyclePhase);
  const targetIndex = validPhases.indexOf(targetPhase as LifecyclePhase);

  // Invalid phases
  if (currentIndex === -1 || targetIndex === -1) return false;

  // Going forward one step is always allowed
  if (targetIndex === currentIndex + 1) return true;

  // Going backward one step is allowed
  if (targetIndex === currentIndex - 1) return true;

  // Can skip forward to harvest_ready (user says plant looks ready)
  if (targetPhase === 'harvest_ready' && targetIndex > currentIndex) {
    return true;
  }

  // For perennial_harvest, can cycle from resting back to growing
  if (lifecycleType === 'perennial_harvest') {
    if (currentPhase === 'resting' && targetPhase === 'growing') {
      return true;
    }
  }

  return false;
}

/**
 * Get an encouraging Indonesian message for phase transitions
 * @param oldPhase - Previous phase
 * @param newPhase - New phase
 * @returns Encouraging message in Indonesian
 */
export function getPhaseChangeMessage(
  oldPhase: LifecyclePhase | string | null | undefined,
  newPhase: LifecyclePhase | string | null | undefined
): string {
  if (!newPhase) return '';

  // Messages based on new phase
  const messages: Record<LifecyclePhase, string> = {
    seedling: 'Selamat menanam! Semangat merawat bibit baru! 🌱',
    growing: 'Wah, tanamanmu mulai tumbuh! Terus rawat ya! 🌿',
    flowering: 'Cantiknya, udah mulai berbunga! 🌸',
    fruiting: 'Keren, udah mulai berbuah! 🍅',
    harvest_ready: 'Siap panen nih! Waktunya memetik hasil! ✨',
    harvested: 'Selamat panen! Kerja kerasmu berbuah hasil! 🎉',
    resting: 'Tanamanmu istirahat dulu. Siap-siap siklus berikutnya! 😴',
    mature: 'Tanamanmu sudah dewasa dan sehat! 🌳',
  };

  // Special messages for specific transitions
  if (oldPhase === 'seedling' && newPhase === 'growing') {
    return 'Wah, bibitmu tumbuh jadi tanaman! Terus semangat! 🌿';
  }

  if (oldPhase === 'flowering' && newPhase === 'fruiting') {
    return 'Dari bunga jadi buah! Sebentar lagi panen! 🍅';
  }

  if (oldPhase === 'resting' && newPhase === 'growing') {
    return 'Tanamanmu bangun dan siap tumbuh lagi! 🌿';
  }

  return messages[newPhase as LifecyclePhase] || 'Fase tanaman berubah!';
}

/**
 * Check if we should show a gentle harvest reminder
 * Returns true if plant age exceeds minimum harvest days but phase is still early
 * @param plantAge - Age of plant in days
 * @param currentPhase - Current phase
 * @param harvestDaysMin - Minimum days to harvest
 * @param lifecycleType - The plant's lifecycle type
 * @returns true if harvest reminder should be shown
 */
export function shouldShowHarvestReminder(
  plantAge: number,
  currentPhase: LifecyclePhase | string | null | undefined,
  harvestDaysMin: number | null | undefined,
  lifecycleType: PlantLifecycleType | string | null | undefined
): boolean {
  // No reminder for perpetual plants (they don't harvest)
  if (lifecycleType === 'perpetual') return false;

  // No reminder if no harvest days configured
  if (!harvestDaysMin) return false;

  // No reminder if already at harvest_ready or later
  if (currentPhase === 'harvest_ready' || currentPhase === 'harvested' || currentPhase === 'resting') {
    return false;
  }

  // Show reminder if plant age exceeds minimum harvest days
  // but phase hasn't been updated to harvest_ready
  return plantAge >= harvestDaysMin;
}

/**
 * Get days until expected harvest
 * @param plantAge - Current age of plant in days
 * @param harvestDaysMin - Minimum days to harvest
 * @returns Days until harvest (negative if overdue), or null if not applicable
 */
export function getDaysUntilHarvest(
  plantAge: number,
  harvestDaysMin: number | null | undefined
): number | null {
  if (!harvestDaysMin) return null;
  return harvestDaysMin - plantAge;
}

/**
 * Get a human-readable harvest timeline message
 * @param plantAge - Current age of plant in days
 * @param harvestDaysMin - Minimum days to harvest
 * @param harvestDaysMax - Maximum days to harvest
 * @param currentPhase - Current phase
 * @returns Indonesian message about harvest timeline
 */
export function getHarvestTimelineMessage(
  plantAge: number,
  harvestDaysMin: number | null | undefined,
  harvestDaysMax: number | null | undefined,
  currentPhase: LifecyclePhase | string | null | undefined
): string {
  if (!harvestDaysMin) return '';

  const daysUntil = harvestDaysMin - plantAge;

  if (currentPhase === 'harvested') {
    return 'Sudah dipanen';
  }

  if (currentPhase === 'harvest_ready') {
    return 'Siap dipanen sekarang!';
  }

  if (daysUntil > 30) {
    return `Sekitar ${Math.round(daysUntil / 7)} minggu lagi`;
  }

  if (daysUntil > 7) {
    return `Sekitar ${Math.round(daysUntil / 7)} minggu lagi`;
  }

  if (daysUntil > 1) {
    return `Sekitar ${daysUntil} hari lagi`;
  }

  if (daysUntil === 1) {
    return 'Besok bisa dipanen!';
  }

  if (daysUntil === 0) {
    return 'Hari ini bisa dipanen!';
  }

  // Overdue
  const overdueDays = Math.abs(daysUntil);
  if (overdueDays <= 7) {
    return 'Sudah bisa dipanen!';
  }

  return 'Sebaiknya segera dipanen';
}
