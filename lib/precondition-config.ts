/**
 * Precondition Configuration for Plant Life Journey
 *
 * Defines the starting conditions users can choose when adding a plant,
 * and maps them to initial lifecycle phases.
 */

import type { PlantSpeciesCategory } from '@/types';
import type { LifecyclePhase } from '@/types';

// Precondition types matching the spec
export type Precondition = 'benih' | 'bibit' | 'stek' | 'rimpang' | 'umbi' | 'anakan' | 'dewasa';

/**
 * Available precondition options per species category
 * Based on the spec's categorization of how plants are commonly started
 */
export const PRECONDITION_OPTIONS: Record<PlantSpeciesCategory, Precondition[]> = {
  'Sayuran': ['benih', 'bibit', 'dewasa'],
  'Rempah': ['benih', 'stek', 'bibit', 'rimpang', 'dewasa'],
  'Bunga': ['benih', 'stek', 'bibit', 'dewasa'],
  'Tanaman Hias': ['stek', 'anakan', 'bibit', 'umbi', 'dewasa'],
};

/**
 * Indonesian display labels for preconditions
 */
export const PRECONDITION_LABELS: Record<Precondition, string> = {
  benih: 'Benih',
  bibit: 'Bibit',
  stek: 'Stek',
  rimpang: 'Rimpang',
  umbi: 'Umbi',
  anakan: 'Anakan',
  dewasa: 'Dewasa',
};

/**
 * Helper text descriptions for each precondition
 */
export const PRECONDITION_DESCRIPTIONS: Record<Precondition, string> = {
  benih: 'Dari biji, belum berkecambah',
  bibit: 'Tanaman muda siap tanam',
  stek: 'Potongan batang untuk ditanam',
  rimpang: 'Dari umbi akar (seperti kunyit, jahe)',
  umbi: 'Dari umbi batang (seperti keladi)',
  anakan: 'Tunas dari tanaman induk',
  dewasa: 'Tanaman sudah dewasa/berbuah',
};

/**
 * Maps precondition to starting lifecycle phase
 * This determines what phase the plant starts at based on user's choice
 */
export const PRECONDITION_STARTING_PHASE: Record<Precondition, LifecyclePhase> = {
  benih: 'seedling',      // Start from very beginning
  bibit: 'growing',       // Skip seedling phase
  stek: 'growing',        // Skip seedling, start at rooting/growing
  rimpang: 'seedling',    // Rhizomes need to sprout first
  umbi: 'seedling',       // Bulbs need to sprout first
  anakan: 'growing',      // Already has roots, skip seedling
  dewasa: 'mature',       // Already mature, minimal tracking
};

/**
 * Get precondition options for a given species category
 */
export function getPreconditionOptions(category: PlantSpeciesCategory | string | null | undefined): Precondition[] {
  if (!category) return ['bibit']; // Default fallback
  const options = PRECONDITION_OPTIONS[category as PlantSpeciesCategory];
  return options || ['bibit'];
}

/**
 * Get the display label for a precondition
 */
export function getPreconditionLabel(precondition: Precondition | string): string {
  return PRECONDITION_LABELS[precondition as Precondition] || precondition;
}

/**
 * Get the description for a precondition
 */
export function getPreconditionDescription(precondition: Precondition | string): string {
  return PRECONDITION_DESCRIPTIONS[precondition as Precondition] || '';
}

/**
 * Get the starting phase for a precondition
 */
export function getStartingPhase(precondition: Precondition | string | null | undefined): LifecyclePhase {
  if (!precondition) return 'seedling';
  return PRECONDITION_STARTING_PHASE[precondition as Precondition] || 'seedling';
}

/**
 * Check if a precondition is valid for a category
 */
export function isValidPrecondition(precondition: string, category: PlantSpeciesCategory | string | null): boolean {
  const options = getPreconditionOptions(category);
  return options.includes(precondition as Precondition);
}

/**
 * Get the default precondition for a category (first option)
 */
export function getDefaultPrecondition(category: PlantSpeciesCategory | string | null | undefined): Precondition {
  const options = getPreconditionOptions(category);
  return options[0] || 'bibit';
}
