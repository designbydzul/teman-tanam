/**
 * Phase Reminder Utilities for Plant Life Journey
 *
 * Manages localStorage-based tracking for phase update reminders.
 * When users dismiss a phase suggestion with "Belum", we wait 7 days
 * before showing the suggestion again.
 */

import type { LifecyclePhase } from '@/types';

const REMINDER_KEY_PREFIX = 'tt_phase_reminder_';
const REMIND_LATER_DAYS = 7;

interface PhaseReminderData {
  dismissedAt: string; // ISO date string
  phase: LifecyclePhase;
  plantId: string;
}

/**
 * Get the localStorage key for a plant's phase reminder
 */
function getReminderKey(plantId: string): string {
  return `${REMINDER_KEY_PREFIX}${plantId}`;
}

/**
 * Dismiss a phase reminder for a plant
 * Called when user clicks "Belum" on phase confirmation dialog
 */
export function dismissPhaseReminder(plantId: string, phase: LifecyclePhase): void {
  try {
    const data: PhaseReminderData = {
      dismissedAt: new Date().toISOString(),
      phase,
      plantId,
    };
    localStorage.setItem(getReminderKey(plantId), JSON.stringify(data));
  } catch (error) {
    // localStorage might be full or unavailable
    console.warn('Failed to save phase reminder dismissal:', error);
  }
}

/**
 * Check if we should show the phase reminder for a plant
 * Returns true if:
 * - No previous dismissal exists, OR
 * - Previous dismissal was for a different phase, OR
 * - 7+ days have passed since dismissal
 */
export function shouldShowPhaseReminder(
  plantId: string,
  suggestedPhase: LifecyclePhase
): boolean {
  try {
    const stored = localStorage.getItem(getReminderKey(plantId));
    if (!stored) return true;

    const data: PhaseReminderData = JSON.parse(stored);

    // If the suggested phase is different from what was dismissed, show it
    if (data.phase !== suggestedPhase) return true;

    // Check if 7 days have passed
    const dismissedAt = new Date(data.dismissedAt);
    const now = new Date();
    const daysSinceDismissed = Math.floor(
      (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceDismissed >= REMIND_LATER_DAYS;
  } catch (error) {
    // If parsing fails, show the reminder
    console.warn('Failed to read phase reminder data:', error);
    return true;
  }
}

/**
 * Clear the phase reminder for a plant
 * Called when user confirms a phase update
 */
export function clearPhaseReminder(plantId: string): void {
  try {
    localStorage.removeItem(getReminderKey(plantId));
  } catch (error) {
    console.warn('Failed to clear phase reminder:', error);
  }
}

/**
 * Get the phase reminder info for a plant (for debugging/display)
 */
export function getPhaseReminderInfo(plantId: string): PhaseReminderData | null {
  try {
    const stored = localStorage.getItem(getReminderKey(plantId));
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

/**
 * Get the number of days until the reminder will be shown again
 * Returns null if no reminder is dismissed or if it should show now
 */
export function getDaysUntilReminder(plantId: string): number | null {
  try {
    const stored = localStorage.getItem(getReminderKey(plantId));
    if (!stored) return null;

    const data: PhaseReminderData = JSON.parse(stored);
    const dismissedAt = new Date(data.dismissedAt);
    const now = new Date();
    const daysSinceDismissed = Math.floor(
      (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDismissed >= REMIND_LATER_DAYS) return null;

    return REMIND_LATER_DAYS - daysSinceDismissed;
  } catch (error) {
    return null;
  }
}

/**
 * Clear all phase reminders (for testing/debugging)
 */
export function clearAllPhaseReminders(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(REMINDER_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear all phase reminders:', error);
  }
}
