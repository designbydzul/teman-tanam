/**
 * Hourly Notifications Cron Job
 *
 * This endpoint is called by Vercel Cron every hour.
 * It sends WhatsApp reminders to users whose reminder_time matches the current hour (in WIB)
 * and whose plants need care.
 */

import { NextRequest } from 'next/server';
import {
  getAllUsersNeedingNotification,
  logNotification,
  sendWhatsAppMessage,
  generateDailyDigestMessage,
  getMessagePreview,
  isFonnteConfigured,
} from '@/lib/notifications';
import { successResponse, errorResponse, HttpStatus } from '@/lib/api';

// Small delay between messages to avoid rate limiting
const MESSAGE_DELAY_MS = 100;

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron] CRON_SECRET is not configured');
    return errorResponse('Server misconfiguration', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron] Unauthorized request - invalid or missing token');
    return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  // Check if Fonnte is configured
  if (!isFonnteConfigured()) {
    console.error('[cron] Fonnte API is not configured');
    return errorResponse('WhatsApp API not configured', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  const startTime = Date.now();

  try {
    // 1. Get all users needing notification
    const usersToNotify = await getAllUsersNeedingNotification();

    if (usersToNotify.length === 0) {
      return successResponse({
        sent: 0,
        failed: 0,
        total: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    let sent = 0;
    let failed = 0;

    // 2. For each user, generate and send message
    for (const digest of usersToNotify) {
      const message = generateDailyDigestMessage(digest);
      const result = await sendWhatsAppMessage(digest.whatsapp_number, message);

      // 3. Log the result
      await logNotification({
        user_id: digest.user_id,
        plants_count: digest.total_plants_needing_attention,
        message_preview: getMessagePreview(message),
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      if (usersToNotify.indexOf(digest) < usersToNotify.length - 1) {
        await sleep(MESSAGE_DELAY_MS);
      }
    }

    const duration = Date.now() - startTime;

    return successResponse({
      sent,
      failed,
      total: usersToNotify.length,
      duration_ms: duration,
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron] Job error:', errMsg);

    return errorResponse(`Internal error: ${errMsg}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Also support POST for manual triggering (with same auth)
export async function POST(_request: NextRequest) {
  return GET(_request);
}
