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
  lines.push('Pagi! Tanaman kamu kangen nih~');
  lines.push('');

  // Plants needing water
  if (digest.plants_needing_water.length > 0) {
    lines.push('💧 Mau disiram:');
    for (const plant of digest.plants_needing_water) {
      lines.push(`- ${plant.plant_name}`);
    }
    lines.push('');
  }

  // Plants needing fertilizer
  if (digest.plants_needing_fertilizer.length > 0) {
    lines.push('🌿 Mau dipupuk:');
    for (const plant of digest.plants_needing_fertilizer) {
      lines.push(`- ${plant.plant_name}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('Semangat merawat hari ini! 💚');
  lines.push('');
  lines.push('temantanam.app');

  return lines.join('\n');
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
