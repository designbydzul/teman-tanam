/**
 * Daily Notifications Cron Job
 *
 * This endpoint is called by Vercel Cron at 00:00 UTC (07:00 WIB) daily.
 * It sends WhatsApp reminders to users whose plants need care.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsersNeedingNotification,
  logNotification,
  sendWhatsAppMessage,
  generateDailyDigestMessage,
  getMessagePreview,
  isFonnteConfigured,
} from '@/lib/notifications';

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
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron] Unauthorized request - invalid or missing token');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if Fonnte is configured
  if (!isFonnteConfigured()) {
    console.error('[cron] Fonnte API is not configured');
    return NextResponse.json(
      { error: 'WhatsApp API not configured' },
      { status: 500 }
    );
  }

  console.log('[cron] Starting daily notifications job...');
  const startTime = Date.now();

  try {
    // 1. Get all users needing notification
    const usersToNotify = await getAllUsersNeedingNotification();

    if (usersToNotify.length === 0) {
      console.log('[cron] No users need notifications today');
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[cron] Found ${usersToNotify.length} users to notify`);

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
        console.log(`[cron] Sent notification to user ${digest.user_id}`);
      } else {
        failed++;
        console.error(`[cron] Failed to send to user ${digest.user_id}: ${result.error}`);
      }

      // Small delay to avoid rate limiting
      if (usersToNotify.indexOf(digest) < usersToNotify.length - 1) {
        await sleep(MESSAGE_DELAY_MS);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[cron] Daily notifications completed: sent=${sent}, failed=${failed}, duration=${duration}ms`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: usersToNotify.length,
      duration_ms: duration,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron] Job error:', errorMessage);

    return NextResponse.json(
      {
        error: 'Internal error',
        message: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering (with same auth)
export async function POST(request: NextRequest) {
  return GET(request);
}
