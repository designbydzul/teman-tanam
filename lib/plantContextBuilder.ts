/**
 * Plant Context Builder for Tanya Tanam AI
 * Builds rich context about a plant including care history and patterns
 */

import { supabase } from '@/lib/supabase/client';

// Types
interface ActionRecord {
  id: string;
  plant_id: string;
  action_type: string;
  action_date: string;
  notes?: string | null;
  photo_url?: string | null;
  created_at: string;
}

interface PlantData {
  id: string;
  name: string;
  species?: {
    name?: string;
    scientific?: string;
    category?: string;
    wateringFrequencyDays?: number;
    fertilizingFrequencyDays?: number;
    // New fields from updated schema
    difficultyLevel?: string;
    sunRequirement?: string;
    growingSeason?: string;
    harvestSigns?: string | null;
    careSummary?: string;
  } | null;
  location?: string | null;
  startedDate?: Date | null;
  notes?: string | null;
  lastWatered?: Date | null;
  lastFertilized?: Date | null;
  // Custom care frequencies (override species defaults)
  customWateringDays?: number | null;
  customFertilizingDays?: number | null;
}

interface CareHistoryEntry {
  date: string;
  type: string;
  label: string;
  notes?: string | null;
}

interface CarePattern {
  averageDaysBetween: number | null;
  totalActions: number;
  lastAction: string | null;
  longestGap: number | null;
}

export interface EnhancedPlantContext {
  // Basic info
  name: string;
  species: string | null;
  speciesCommon: string | null;
  category: string | null;
  careDuration: number | null;
  location: string | null;
  notes: string | null;

  // Species knowledge (new fields for AI)
  difficultyLevel: string | null;
  sunRequirement: string | null;
  growingSeason: string | null;
  harvestSigns: string | null;
  careSummary: string | null;

  // Care timing
  lastWatered: string | null;
  lastFertilized: string | null;
  daysSinceWatered: number | null;
  daysSinceFertilized: number | null;

  // Recommended frequencies (custom if set, otherwise species default)
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  // Track if using custom frequencies
  isCustomWatering: boolean;
  isCustomFertilizing: boolean;

  // Care status
  needsWatering: boolean;
  needsFertilizing: boolean;
  daysUntilWatering: number | null;
  daysUntilFertilizing: number | null;

  // Care history (last 30 days)
  recentHistory: CareHistoryEntry[];

  // Care patterns
  wateringPattern: CarePattern;
  fertilizingPattern: CarePattern;

  // Action notes from history
  recentNotes: string[];
}

// Action type mapping
const ACTION_LABELS: Record<string, string> = {
  siram: 'Disiram',
  pupuk: 'Dipupuk',
  pangkas: 'Dipangkas',
  panen: 'Dipanen',
};

/**
 * Format date for AI context (relative to today)
 */
function formatDateRelative(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hari ini';
  if (diffDays === 1) return 'kemarin';
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
  return `${Math.floor(diffDays / 30)} bulan yang lalu`;
}

/**
 * Format date as Indonesian short date (e.g., "15 Des")
 */
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate care pattern from action history
 */
function calculateCarePattern(actions: ActionRecord[], actionType: string): CarePattern {
  const filtered = actions
    .filter(a => a.action_type === actionType)
    .sort((a, b) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime());

  if (filtered.length === 0) {
    return {
      averageDaysBetween: null,
      totalActions: 0,
      lastAction: null,
      longestGap: null,
    };
  }

  const lastAction = filtered[0].action_date;

  if (filtered.length === 1) {
    return {
      averageDaysBetween: null,
      totalActions: 1,
      lastAction,
      longestGap: null,
    };
  }

  // Calculate gaps between actions
  const gaps: number[] = [];
  for (let i = 0; i < filtered.length - 1; i++) {
    const date1 = new Date(filtered[i].action_date);
    const date2 = new Date(filtered[i + 1].action_date);
    gaps.push(daysBetween(date1, date2));
  }

  const averageDaysBetween = gaps.length > 0
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : null;

  const longestGap = gaps.length > 0 ? Math.max(...gaps) : null;

  return {
    averageDaysBetween,
    totalActions: filtered.length,
    lastAction,
    longestGap,
  };
}

/**
 * Fetch care history for a plant (last 30 days)
 * Returns empty array if offline or on error (graceful degradation)
 */
export async function fetchPlantCareHistory(plantId: string): Promise<ActionRecord[]> {
  // Check if we're offline first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    // Silently return empty - we're offline
    return [];
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('plant_id', plantId)
      .gte('action_date', thirtyDaysAgoStr)
      .order('action_date', { ascending: false });

    if (error) {
      // Only log if it's a real error (not empty object from offline)
      if (error.message || error.code) {
        console.warn('[plantContextBuilder] Error fetching history:', error.message || error.code);
      }
      return [];
    }

    return data || [];
  } catch (err) {
    // Network error or offline - silently return empty
    return [];
  }
}

/**
 * Build enhanced plant context for AI
 */
export function buildEnhancedPlantContext(
  plant: PlantData,
  careHistory: ActionRecord[]
): EnhancedPlantContext {
  const now = new Date();

  // Basic info
  const name = plant.name;
  const species = plant.species?.scientific || null;
  const speciesCommon = plant.species?.name || null;
  const category = plant.species?.category || null;
  const location = plant.location || null;
  const notes = plant.notes || null;

  // Species knowledge (new fields)
  const difficultyLevel = plant.species?.difficultyLevel || null;
  const sunRequirement = plant.species?.sunRequirement || null;
  const growingSeason = plant.species?.growingSeason || null;
  const harvestSigns = plant.species?.harvestSigns || null;
  const careSummary = plant.species?.careSummary || null;

  // Care duration calculation
  const careDuration = plant.startedDate
    ? Math.floor((now.getTime() - new Date(plant.startedDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Watering info
  const lastWatered = plant.lastWatered ? formatDateRelative(plant.lastWatered) : null;
  const daysSinceWatered = plant.lastWatered ? daysBetween(now, plant.lastWatered) : null;

  // Fertilizing info
  const lastFertilized = plant.lastFertilized ? formatDateRelative(plant.lastFertilized) : null;
  const daysSinceFertilized = plant.lastFertilized ? daysBetween(now, plant.lastFertilized) : null;

  // Frequencies - use custom if set, otherwise species default
  const speciesWateringDays = plant.species?.wateringFrequencyDays || 3;
  const speciesFertilizingDays = plant.species?.fertilizingFrequencyDays || 14;
  const isCustomWatering = plant.customWateringDays != null;
  const isCustomFertilizing = plant.customFertilizingDays != null;
  const wateringFrequencyDays = plant.customWateringDays ?? speciesWateringDays;
  const fertilizingFrequencyDays = plant.customFertilizingDays ?? speciesFertilizingDays;

  // Care status
  const needsWatering = daysSinceWatered === null || daysSinceWatered >= wateringFrequencyDays;
  const needsFertilizing = daysSinceFertilized === null || daysSinceFertilized >= fertilizingFrequencyDays;

  const daysUntilWatering = daysSinceWatered !== null
    ? Math.max(0, wateringFrequencyDays - daysSinceWatered)
    : null;
  const daysUntilFertilizing = daysSinceFertilized !== null
    ? Math.max(0, fertilizingFrequencyDays - daysSinceFertilized)
    : null;

  // Build recent history
  const recentHistory: CareHistoryEntry[] = careHistory.map(action => ({
    date: formatDateShort(action.action_date),
    type: action.action_type,
    label: ACTION_LABELS[action.action_type] || action.action_type,
    notes: action.notes || null,
  }));

  // Calculate patterns
  const wateringPattern = calculateCarePattern(careHistory, 'siram');
  const fertilizingPattern = calculateCarePattern(careHistory, 'pupuk');

  // Collect notes from recent actions
  const recentNotes = careHistory
    .filter(a => a.notes && a.notes.trim())
    .map(a => {
      const label = ACTION_LABELS[a.action_type] || a.action_type;
      return `${formatDateShort(a.action_date)} (${label}): ${a.notes}`;
    })
    .slice(0, 5); // Max 5 notes

  return {
    name,
    species,
    speciesCommon,
    category,
    careDuration,
    location,
    notes,
    // Species knowledge
    difficultyLevel,
    sunRequirement,
    growingSeason,
    harvestSigns,
    careSummary,
    // Care timing
    lastWatered,
    lastFertilized,
    daysSinceWatered,
    daysSinceFertilized,
    wateringFrequencyDays,
    fertilizingFrequencyDays,
    isCustomWatering,
    isCustomFertilizing,
    needsWatering,
    needsFertilizing,
    daysUntilWatering,
    daysUntilFertilizing,
    recentHistory,
    wateringPattern,
    fertilizingPattern,
    recentNotes,
  };
}

/**
 * Format enhanced context as text for AI prompt
 */
export function formatContextForAI(context: EnhancedPlantContext): string {
  const parts: string[] = [];

  // Plant context section
  parts.push('<plant_context>');
  parts.push(`- Nama: ${context.name}`);

  // Species
  if (context.speciesCommon && context.species) {
    parts.push(`- Spesies: ${context.speciesCommon} (${context.species})`);
  } else if (context.speciesCommon) {
    parts.push(`- Spesies: ${context.speciesCommon}`);
  } else if (context.species) {
    parts.push(`- Spesies: ${context.species}`);
  }

  if (context.category) {
    parts.push(`- Kategori: ${context.category}`);
  }

  // Care duration and location
  if (context.careDuration !== null) {
    parts.push(`- Umur: ${context.careDuration} hari`);
  }
  if (context.location) {
    parts.push(`- Lokasi: ${context.location}`);
  }

  // Last care actions
  if (context.lastWatered) {
    parts.push(`- Terakhir disiram: ${context.lastWatered}`);
  }
  if (context.lastFertilized) {
    parts.push(`- Terakhir dipupuk: ${context.lastFertilized}`);
  }

  // User notes
  if (context.notes) {
    parts.push(`- Catatan user: ${context.notes}`);
  }
  parts.push('</plant_context>');
  parts.push('');

  // Species knowledge section (new!)
  if (context.careSummary || context.difficultyLevel || context.sunRequirement) {
    parts.push('<species_knowledge>');

    if (context.sunRequirement) {
      parts.push(`- Kebutuhan cahaya: ${context.sunRequirement}`);
    }
    if (context.difficultyLevel) {
      parts.push(`- Tingkat kesulitan: ${context.difficultyLevel}`);
    }
    if (context.growingSeason) {
      parts.push(`- Musim tanam: ${context.growingSeason}`);
    }
    parts.push(`- Frekuensi siram: Setiap ${context.wateringFrequencyDays} hari`);
    parts.push(`- Frekuensi pupuk: Setiap ${context.fertilizingFrequencyDays} hari`);
    if (context.harvestSigns) {
      parts.push(`- Tanda panen: ${context.harvestSigns}`);
    } else if (context.category === 'Bunga' || context.category === 'Tanaman Hias') {
      parts.push(`- Tanda panen: Tanaman hias, tidak dipanen`);
    }
    if (context.careSummary) {
      parts.push(`- Ringkasan perawatan: ${context.careSummary}`);
    }

    parts.push('</species_knowledge>');
    parts.push('');
  }

  // Care status section
  parts.push('<care_status>');

  // Watering status
  if (context.daysSinceWatered !== null) {
    const status = context.needsWatering ? '⚠️ PERLU DISIRAM' : '✓';
    parts.push(`- Penyiraman: ${context.lastWatered} (${context.daysSinceWatered} hari lalu) ${status}`);
    if (!context.needsWatering && context.daysUntilWatering !== null && context.daysUntilWatering > 0) {
      parts.push(`  → Siram lagi dalam ${context.daysUntilWatering} hari`);
    }
  } else {
    parts.push('- Penyiraman: Belum pernah tercatat ⚠️');
  }

  // Fertilizing status
  if (context.daysSinceFertilized !== null) {
    const status = context.needsFertilizing ? '⚠️ PERLU DIPUPUK' : '✓';
    parts.push(`- Pemupukan: ${context.lastFertilized} (${context.daysSinceFertilized} hari lalu) ${status}`);
    if (!context.needsFertilizing && context.daysUntilFertilizing !== null && context.daysUntilFertilizing > 0) {
      parts.push(`  → Pupuk lagi dalam ${context.daysUntilFertilizing} hari`);
    }
  } else {
    parts.push('- Pemupukan: Belum pernah tercatat');
  }
  parts.push('</care_status>');

  parts.push(''); // Empty line

  // Care history (last 30 days)
  if (context.recentHistory.length > 0) {
    parts.push('Riwayat 30 hari terakhir:');
    // Group by date and show max 10 entries
    const historyEntries = context.recentHistory.slice(0, 10);
    for (const entry of historyEntries) {
      let line = `- ${entry.date}: ${entry.label}`;
      if (entry.notes) {
        line += ` (${entry.notes})`;
      }
      parts.push(line);
    }
    if (context.recentHistory.length > 10) {
      parts.push(`  ... dan ${context.recentHistory.length - 10} aksi lainnya`);
    }
    parts.push(''); // Empty line
  }

  // Care patterns
  parts.push('Pola Perawatan User:');

  if (context.wateringPattern.totalActions > 1) {
    const avg = context.wateringPattern.averageDaysBetween;
    const rec = context.wateringFrequencyDays;
    let patternNote = '';
    if (avg !== null) {
      if (avg < rec - 1) {
        patternNote = ' (lebih sering dari rekomendasi)';
      } else if (avg > rec + 1) {
        patternNote = ' (lebih jarang dari rekomendasi)';
      } else {
        patternNote = ' (sesuai rekomendasi)';
      }
    }
    parts.push(`- Penyiraman: rata-rata setiap ${avg || '?'} hari${patternNote}`);
    if (context.wateringPattern.longestGap && context.wateringPattern.longestGap > rec * 2) {
      parts.push(`  ⚠️ Pernah tidak disiram ${context.wateringPattern.longestGap} hari`);
    }
  } else if (context.wateringPattern.totalActions === 1) {
    parts.push('- Penyiraman: baru 1x tercatat');
  } else {
    parts.push('- Penyiraman: belum ada data');
  }

  if (context.fertilizingPattern.totalActions > 1) {
    const avg = context.fertilizingPattern.averageDaysBetween;
    const rec = context.fertilizingFrequencyDays;
    let patternNote = '';
    if (avg !== null) {
      if (avg < rec - 3) {
        patternNote = ' (lebih sering dari rekomendasi)';
      } else if (avg > rec + 3) {
        patternNote = ' (lebih jarang dari rekomendasi)';
      } else {
        patternNote = ' (sesuai rekomendasi)';
      }
    }
    parts.push(`- Pemupukan: rata-rata setiap ${avg || '?'} hari${patternNote}`);
  } else if (context.fertilizingPattern.totalActions === 1) {
    parts.push('- Pemupukan: baru 1x tercatat');
  } else {
    parts.push('- Pemupukan: belum ada data');
  }

  // Frequency settings
  parts.push('');
  const wateringNote = context.isCustomWatering ? ' (kustom user)' : ' (default jenis)';
  const fertilizingNote = context.isCustomFertilizing ? ' (kustom user)' : ' (default jenis)';
  parts.push(`Frekuensi perawatan: siram setiap ${context.wateringFrequencyDays} hari${wateringNote}, pupuk setiap ${context.fertilizingFrequencyDays} hari${fertilizingNote}`);

  // Notes from actions
  if (context.recentNotes.length > 0) {
    parts.push('');
    parts.push('Catatan dari aksi terakhir:');
    for (const note of context.recentNotes) {
      parts.push(`- ${note}`);
    }
  }

  return parts.join('\n');
}
