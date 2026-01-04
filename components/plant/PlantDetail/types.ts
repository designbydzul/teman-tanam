'use client';

/**
 * Shared Types for PlantDetail Components
 */

export interface PlantSpecies {
  id?: string;
  name: string | null;
  scientific: string | null;
  emoji: string;
  imageUrl?: string | null;
  wateringFrequencyDays?: number | null;
  fertilizingFrequencyDays?: number | null;
  difficultyLevel?: string | null;
  sunRequirement?: string | null;
  harvestSigns?: string | null;
}

export interface PlantData {
  id: string;
  customName: string;
  species: PlantSpecies;
  location: string;
  startedDate: string | Date;
  photoUrl: string | null;
  lastWatered: string | null;
  lastFertilized: string | null;
  lastPruned?: string | null;
  notes: string;
  difficultyLevel?: string | null;
  sunRequirement?: string | null;
  harvestSigns?: string | null;
}

export interface CareStatus {
  status: 'done_today' | 'on_schedule' | 'needs_action' | 'unknown';
  label: string;
  daysUntilNext: number | null;
  daysSinceLast: number | null;
  doneToday: boolean;
}

export interface ActionStyle {
  text: string;
  color: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

export interface ActionHistoryEntry {
  id: string;
  plant_id: string;
  action_type: string;
  action_date: string;
  notes?: string | null;
  photo_url?: string | null;
  created_at: string;
}

export type ActionType = 'siram' | 'pupuk' | 'pangkas' | 'lainnya';
