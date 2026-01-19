/**
 * PlantDetail Utility Functions
 * Helper functions for PlantDetail and its sub-components
 */

import { differenceInDays, isToday, startOfDay } from 'date-fns';
import { getPhaseDisplay } from '@/lib/lifecycle-config';
import type { ActionStatusStyle, TimelineEntry, TimelineGroup, PlantUI, CareStatusUI, ActionHistoryEntry } from './types';

/**
 * Validates if a string is a valid UUID format
 */
export const isValidUUID = (str: string | number | undefined | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Formats a date string in Indonesian format (e.g., "15 Januari 2024")
 */
export const formatDateIndonesian = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Formats a timestamp to HH.mm format
 */
export const formatTime = (timestamp: string | null | undefined): string | null => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}.${minutes}`;
};

/**
 * Gets action label in Indonesian based on action type
 */
export const getActionLabel = (actionType: string, notes: string | null | undefined = ''): string => {
  switch (actionType) {
    case 'siram':
      return 'Penyiraman';
    case 'pupuk':
      return 'Pemupukan';
    case 'pangkas':
      return 'Pemangkasan';
    case 'panen':
      return 'Panen';
    case 'fase':
      // Phase change - extract phases from notes (format: "oldPhase→newPhase")
      return getPhaseChangeLabel(notes);
    case 'lainnya':
      // Extract custom action name from notes (format: "[CustomName] optional notes")
      const match = notes?.match(/^\[([^\]]+)\]/);
      if (match) {
        return match[1];
      }
      return 'Lainnya';
    default:
      return actionType.charAt(0).toUpperCase() + actionType.slice(1);
  }
};

/**
 * Gets phase change label from notes
 * Notes format: "oldPhase→newPhase" or "oldPhase→newPhase|additionalInfo"
 */
export const getPhaseChangeLabel = (notes: string | null | undefined): string => {
  if (!notes) return 'Perubahan Fase';

  // Parse notes format: "oldPhase→newPhase" or with additional info
  const phasePart = notes.split('|')[0];
  const phases = phasePart?.split('→');

  if (phases && phases.length === 2) {
    const oldDisplay = getPhaseDisplay(phases[0].trim());
    const newDisplay = getPhaseDisplay(phases[1].trim());
    return `${oldDisplay.icon} ${oldDisplay.label} → ${newDisplay.icon} ${newDisplay.label}`;
  }

  return 'Perubahan Fase';
};

/**
 * Extracts clean notes without the [CustomName] prefix for 'lainnya' actions
 * For 'fase' actions, extracts additional info after the pipe character
 */
export const getCleanNotes = (actionType: string, notes: string | null | undefined): string | null => {
  if (actionType === 'lainnya' && notes) {
    return notes.replace(/^\[[^\]]+\]\s*/, '').trim() || null;
  }
  if (actionType === 'fase' && notes) {
    // Notes format: "oldPhase→newPhase|additionalInfo"
    const parts = notes.split('|');
    return parts.length > 1 ? parts[1].trim() : null;
  }
  return notes || null;
};

/**
 * Maps DB action type to UI type for icons
 */
export const mapActionTypeForIcon = (actionType: string): string => {
  switch (actionType) {
    case 'siram':
      return 'water';
    case 'pupuk':
      return 'fertilize';
    case 'pangkas':
      return 'prune';
    case 'panen':
      return 'harvest';
    case 'fase':
      return 'phase_change';
    default:
      return actionType;
  }
};

/**
 * Gets subtitle text, color, and icon style for action cards
 * Colors: Green (#7CB342) - just done, Orange (#FF9800) - attention soon, Red (#F44336) - needs action
 */
export const getActionSubtitle = (
  daysSince: number | null | undefined,
  frequencyDays: number | null,
  actionType: 'water' | 'fertilize'
): ActionStatusStyle => {
  const pastTense = actionType === 'water' ? 'Disiram' : 'Dipupuk';
  const needsText = actionType === 'water' ? 'Perlu disiram' : 'Perlu dipupuk';
  const neverText = actionType === 'water' ? 'Belum pernah disiram' : 'Belum pernah dipupuk';
  const justNowText = actionType === 'water' ? 'Baru saja disiram' : 'Baru saja dipupuk';
  const yesterdayText = actionType === 'water' ? 'Disiram kemarin' : 'Dipupuk kemarin';

  // Default frequencies if not specified
  const defaultFrequency = actionType === 'water' ? 3 : 14;
  const effectiveFrequency = frequencyDays || defaultFrequency;

  // Calculate warning threshold (when to show orange - about 70% of frequency)
  const warningThreshold = Math.max(2, Math.floor(effectiveFrequency * 0.7));

  // Never done - show red
  if (daysSince === null || daysSince === undefined) {
    return {
      text: neverText,
      color: '#F44336',
      iconBg: 'rgba(244, 67, 54, 0.1)',
      iconColor: '#F44336',
      borderColor: '#F44336'
    };
  }

  // Done today - green
  if (daysSince === 0) {
    return {
      text: justNowText,
      color: '#7CB342',
      iconBg: 'rgba(124, 179, 66, 0.1)',
      iconColor: '#7CB342',
      borderColor: '#7CB342'
    };
  }

  // Done yesterday - green
  if (daysSince === 1) {
    return {
      text: yesterdayText,
      color: '#7CB342',
      iconBg: 'rgba(124, 179, 66, 0.1)',
      iconColor: '#7CB342',
      borderColor: '#7CB342'
    };
  }

  // Check if overdue - red
  if (daysSince >= effectiveFrequency) {
    return {
      text: needsText,
      color: '#F44336',
      iconBg: 'rgba(244, 67, 54, 0.1)',
      iconColor: '#F44336',
      borderColor: '#F44336'
    };
  }

  // Check if attention needed soon - orange
  if (daysSince >= warningThreshold) {
    return {
      text: `${pastTense} ${daysSince} hari lalu`,
      color: '#FF9800',
      iconBg: 'rgba(255, 152, 0, 0.1)',
      iconColor: '#FF9800',
      borderColor: '#FF9800'
    };
  }

  // Recently done - green
  return {
    text: `${pastTense} ${daysSince} hari lalu`,
    color: '#7CB342',
    iconBg: 'rgba(124, 179, 66, 0.1)',
    iconColor: '#7CB342',
    borderColor: '#7CB342'
  };
};

/**
 * Calculates care status based on last action date
 */
export const calculateLocalCareStatus = (
  lastActionDate: string | Date | null | undefined,
  frequencyDays: number | null,
  actionType: 'siram' | 'pupuk'
): CareStatusUI => {
  const actionLabel = actionType === 'siram' ? 'disiram' : 'dipupuk';
  const needsLabel = actionType === 'siram' ? 'Perlu disiram' : 'Perlu dipupuk';

  if (!lastActionDate) {
    return {
      status: frequencyDays !== null ? 'needs_action' : 'unknown',
      label: needsLabel,
      daysUntilNext: 0,
      daysSinceLast: null,
      doneToday: false,
    };
  }

  const lastAction = new Date(lastActionDate);
  const today = startOfDay(new Date());
  const lastActionDay = startOfDay(lastAction);

  const daysSinceLast = differenceInDays(today, lastActionDay);
  const doneToday = isToday(lastAction);
  const daysUntilNext = frequencyDays !== null ? Math.max(0, frequencyDays - daysSinceLast) : null;

  if (doneToday) {
    return {
      status: 'done_today',
      label: `Sudah ${actionLabel} hari ini`,
      daysUntilNext: frequencyDays,
      daysSinceLast: 0,
      doneToday: true,
    };
  }

  // Only mark as needs_action if we have frequency data
  if (frequencyDays !== null && daysSinceLast >= frequencyDays) {
    return {
      status: 'needs_action',
      label: needsLabel,
      daysUntilNext: 0,
      daysSinceLast,
      doneToday: false,
    };
  }

  return {
    status: 'on_schedule',
    label: daysUntilNext !== null ? `${daysUntilNext} hari lagi` : `${daysSinceLast} hari lalu`,
    daysUntilNext,
    daysSinceLast,
    doneToday: false,
  };
};

/**
 * Calculates days since started caring for a plant
 */
export const calculateDaysSinceStarted = (startedDate: Date | string | null | undefined): number | null => {
  if (!startedDate) return null;
  const startDate = new Date(startedDate);
  if (isNaN(startDate.getTime())) return null;
  const days = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
};

/**
 * Normalizes plant data for display
 */
export const normalizePlantData = (
  sourcePlant: PlantUI,
  lastActionOverrides: { lastWatered: Date | null; lastFertilized: Date | null }
) => {
  return {
    id: sourcePlant.id,
    customName: sourcePlant.customName || sourcePlant.name,
    species: sourcePlant.species || {
      name: null,
      scientific: null,
      emoji: '🌱',
    },
    location: sourcePlant.location,
    startedDate: sourcePlant.startedDate || sourcePlant.createdAt || new Date(),
    photoUrl: sourcePlant.photoUrl || sourcePlant.photoPreview || sourcePlant.image || null,
    lastWatered: lastActionOverrides.lastWatered || sourcePlant.lastWatered || null,
    lastFertilized: lastActionOverrides.lastFertilized || sourcePlant.lastFertilized || null,
    notes: sourcePlant.notes || '',
    difficultyLevel: sourcePlant.species?.difficultyLevel || null,
    sunRequirement: sourcePlant.species?.sunRequirement || null,
    harvestSigns: sourcePlant.species?.harvestSigns || null,
  };
};

/**
 * Groups actions by date for timeline display
 */
export const groupActionsByDate = (actionsHistory: ActionHistoryEntry[]): TimelineGroup[] => {
  const grouped = actionsHistory.reduce((groups: Record<string, ActionHistoryEntry[]>, action) => {
    const dateKey = action.action_date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(action);
    return groups;
  }, {} as Record<string, ActionHistoryEntry[]>);

  return Object.entries(grouped).map(([date, actions]) => ({
    date: formatDateIndonesian(date),
    rawDate: date,
    entries: actions.map(action => ({
      type: mapActionTypeForIcon(action.action_type),
      actionType: action.action_type,
      label: getActionLabel(action.action_type, action.notes),
      notes: getCleanNotes(action.action_type, action.notes),
      id: action.id,
      time: formatTime(action.created_at),
      createdAt: action.created_at,
      photoUrl: action.photo_url,
    })),
  }));
};
