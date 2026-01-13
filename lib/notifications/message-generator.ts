/**
 * Message Generator Utility
 *
 * Generates WhatsApp notification messages for plant care reminders.
 */

import type { UserCareDigest, PlantCareStatus } from './care-checker';

/**
 * Generate daily digest message for a user
 *
 * @param digest - User's care digest with plants needing attention
 * @returns Formatted WhatsApp message
 */
export function generateDailyDigestMessage(digest: UserCareDigest): string {
  const lines: string[] = [];

  // Header
  lines.push('🌱 Teman Tanam');
  lines.push('');
  lines.push(`Hai! Ada ${digest.total_plants_needing_attention} tanaman butuh perhatian:`);
  lines.push('');

  // Plants needing water
  if (digest.plants_needing_water.length > 0) {
    lines.push('💧 Perlu disiram:');
    for (const plant of digest.plants_needing_water) {
      const daysText = formatDaysSince(plant.days_since_water);
      lines.push(`• ${plant.plant_name} ${daysText}`);
    }
    lines.push('');
  }

  // Plants needing fertilizer
  if (digest.plants_needing_fertilizer.length > 0) {
    lines.push('🌿 Perlu dipupuk:');
    for (const plant of digest.plants_needing_fertilizer) {
      const daysText = formatDaysSince(plant.days_since_fertilizer);
      lines.push(`• ${plant.plant_name} ${daysText}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('temantanam.app');

  return lines.join('\n');
}

/**
 * Format "days since" text for display
 *
 * @param days - Number of days since last action (null if never done)
 * @returns Formatted string like "(3 hari lalu)" or "(belum pernah)"
 */
function formatDaysSince(days: number | null): string {
  if (days === null) {
    return '(belum pernah)';
  }

  if (days === 0) {
    return '(hari ini)';
  }

  if (days === 1) {
    return '(kemarin)';
  }

  return `(${days} hari lalu)`;
}

/**
 * Get a preview of the message (first 100 characters)
 *
 * @param message - Full message content
 * @returns Truncated preview
 */
export function getMessagePreview(message: string): string {
  if (message.length <= 100) {
    return message;
  }
  return message.substring(0, 97) + '...';
}
