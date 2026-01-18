import { NextRequest } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { sendWhatsAppMessage } from '@/lib/notifications/fonnte';
import { successResponse, errorResponse, HttpStatus } from '@/lib/api';
import { testNotificationSchema, formatZodError } from '@/lib/validations';

/**
 * POST /api/notifications/test
 * Send a test WhatsApp notification to verify setup
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get the authorization token from the header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const { supabase } = createApiClient(request);

    // Get authenticated user (using token if provided)
    const {
      data: { user },
      error: authError,
    } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Parse and validate request body with Zod
    const body = await request.json();
    const validationResult = testNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(formatZodError(validationResult.error), HttpStatus.BAD_REQUEST);
    }

    const { phone_number } = validationResult.data;

    // Get user profile for personalization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    // Profile error is non-critical - just use fallback name
    if (profileError) {
      console.warn('[test-notification] Could not fetch profile:', profileError.message);
    }

    const userName = profile?.name || 'Teman';

    // Compose test message
    const testMessage = `🌱 *Halo ${userName}!*

Ini adalah pesan test dari *Teman Tanam* 🪴

Notifikasi WhatsApp kamu sudah aktif! Kamu akan menerima pengingat untuk merawat tanaman-tanamanmu setiap hari.

_Pesan ini dikirim dari sistem notifikasi Teman Tanam_`;

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(phone_number, testMessage);

    if (!result.success) {
      console.error('[test-notification] Failed to send:', result.error);
      return errorResponse(result.error || 'Gagal mengirim pesan test', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Log the test notification
    const { error: logError } = await supabase.from('notification_logs').insert({
      user_id: user.id,
      notification_type: 'test',
      recipient_number: phone_number,
      message_content: testMessage,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('[test-notification] Failed to log notification:', logError.message);
      // Don't fail the request - the notification was sent successfully
    }

    return successResponse({
      message: 'Pesan test berhasil dikirim! Cek WhatsApp kamu ya 📱',
    });
  } catch (error) {
    console.error('[test-notification] Error:', error);
    return errorResponse('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
