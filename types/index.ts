/**
 * Shared type definitions for Teman Tanam
 */

import { User, Session } from '@supabase/supabase-js';

// Profile from Supabase
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  show_statistics: boolean;
  onboarding_completed: boolean;
  updated_at: string;
}

// Location from Supabase
export interface Location {
  id: string;
  user_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

// Plant species category type
export type PlantSpeciesCategory = 'Sayuran' | 'Rempah' | 'Bunga' | 'Tanaman Hias';

// Plant species from Supabase
export interface PlantSpecies {
  id: string;
  common_name: string;
  latin_name: string;
  category: PlantSpeciesCategory;
  image_url: string | null;

  // Care frequency
  watering_frequency_days: number;
  fertilizing_frequency_days: number;

  // Basic care info
  sun_requirement: string;
  difficulty_level: string;
  growing_season: string;

  // Detailed care
  water_needs: string;
  common_problems: string;
  harvest_signs: string | null;

  // Growing context
  container_friendly: boolean;
  space_needed: string;
  companion_plants: string;

  // AI helper
  care_summary: string;

  created_at: string;
}

// Raw plant data from Supabase
export interface PlantRaw {
  id: string;
  user_id: string;
  species_id: string | null;
  location_id: string | null;
  name: string | null;
  photo_url: string | null;
  started_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  // Custom care frequencies (overrides species defaults)
  custom_watering_days: number | null;
  custom_fertilizing_days: number | null;
  plant_species?: PlantSpecies | null;
  locations?: Location | null;
  // Offline flags
  isOffline?: boolean;
  pendingSync?: boolean;
}

// Care status for watering/fertilizing
export interface CareStatus {
  status: 'needs_action' | 'done_today' | 'on_schedule';
  label: string;
  daysUntilNext: number;
  daysSinceLast: number | null;
  doneToday: boolean;
}

// Harvest status
export interface HarvestStatus {
  isReadyToHarvest: boolean;
  daysUntilHarvest: number | null;
  daysSinceStarted?: number;
}

// Transformed plant for UI
export interface Plant {
  id: string;
  name: string;
  customName: string | null;
  status: string;
  statusColor: string;
  location: string;
  locationId: string | null;
  image: string | null;
  species: {
    id?: string;
    name?: string;
    scientific?: string | null;
    category?: PlantSpeciesCategory | null;
    imageUrl?: string | null;
    emoji: string;
    wateringFrequencyDays: number;
    fertilizingFrequencyDays: number;
    // New fields from updated schema
    difficultyLevel?: string;
    sunRequirement?: string;
    growingSeason?: string;
    harvestSigns?: string | null;
    careSummary?: string;
  };
  // Custom care frequencies (overrides species defaults when set)
  customWateringDays: number | null;
  customFertilizingDays: number | null;
  startedDate: Date;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  wateringStatus: CareStatus;
  fertilizingStatus: CareStatus;
  harvestStatus: HarvestStatus;
  notes: string;
  createdAt: Date;
  isOffline?: boolean;
  pendingSync?: boolean;
}

// Action from Supabase
export interface Action {
  id: string;
  plant_id: string;
  user_id: string;
  action_type: 'siram' | 'pupuk';
  action_date: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

// Sync queue item
export interface SyncQueueItem {
  id: string;
  type: 'plant' | 'action' | 'location' | 'photo';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: string;
}

// Auth hook return type
export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; data?: unknown; needsConfirmation?: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (displayName: string, locationNames?: string[]) => Promise<{ success: boolean; profile?: Profile; error?: string }>;
  refreshOnboardingStatus: () => Promise<boolean>;
  updateProfile: (updates: { displayName?: string; photoUrl?: string }) => Promise<{ success: boolean; profile?: Profile; error?: string }>;
  updateShowStatistics: (showStatistics: boolean) => Promise<{ success: boolean; profile?: Profile; error?: string }>;
}

// Plants hook return type
export interface UsePlantsReturn {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addPlant: (plantData: AddPlantData) => Promise<{ success: boolean; plant?: unknown; error?: string; offline?: boolean }>;
  updatePlant: (plantId: string, updates: UpdatePlantData) => Promise<{ success: boolean; plant?: unknown; error?: string }>;
  deletePlant: (plantId: string) => Promise<{ success: boolean; error?: string }>;
  recordAction: (plantId: string, actionType: 'siram' | 'pupuk' | 'pangkas' | 'lainnya', notes?: string | null, photoFile?: File | null) => Promise<{ success: boolean; action?: unknown; error?: string; offline?: boolean }>;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  pendingCount: number;
  syncNow: () => Promise<{ success: boolean; synced: number; failed: number; errors: unknown[] }>;
}

// Add plant input data
export interface AddPlantData {
  name?: string;
  customName?: string;
  speciesId?: string | null;
  speciesName?: string;
  speciesEmoji?: string;
  locationId?: string | null;
  startedDate?: string;
  notes?: string;
  photoBlob?: Blob;
}

// Update plant input data
export interface UpdatePlantData {
  name?: string;
  customName?: string;
  locationId?: string | null;
  photoUrl?: string;
  notes?: string;
  status?: string;
  customWateringDays?: number | null;
  customFertilizingDays?: number | null;
}

// Locations hook return type
export interface UseLocationsReturn {
  locations: Location[];
  locationNames: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addLocation: (name: string) => Promise<{ success: boolean; location?: Location; error?: string; offline?: boolean }>;
  updateLocation: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteLocation: (id: string) => Promise<{ success: boolean; error?: string }>;
  reorderLocations: (orderedIds: string[]) => Promise<{ success: boolean; error?: string }>;
}
