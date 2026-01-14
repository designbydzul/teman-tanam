import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { sendWhatsAppMessage } from '@/lib/notifications/fonnte';

/**
 * POST /api/notifications/test
 * Send a test WhatsApp notification to verify setup
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get the authorization token from the header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('[test-notification] Auth header present:', !!authHeader);

    const { supabase, response } = createApiClient(request);

    // Get authenticated user (using token if provided)
    const {
      data: { user },
      error: authError,
    } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    console.log('[test-notification] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('[test-notification] Unauthorized:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { phone_number } = body;

    // Validate phone number
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp harus diisi' },
        { status: 400 }
      );
    }

    // Validate Indonesian phone number format (628xxx)
    const phoneRegex = /^628\d{8,12}$/;
    if (!phoneRegex.test(phone_number)) {
      return NextResponse.json(
        { error: 'Format nomor tidak valid. Harus dimulai dengan 628' },
        { status: 400 }
      );
    }

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

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
      return NextResponse.json(
        { error: result.error || 'Gagal mengirim pesan test' },
        { status: 500 }
      );
    }

    // Log the test notification
    await supabase.from('notification_logs').insert({
      user_id: user.id,
      notification_type: 'test',
      recipient_number: phone_number,
      message_content: testMessage,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Pesan test berhasil dikirim! Cek WhatsApp kamu ya 📱',
    });
  } catch (error) {
    console.error('[test-notification] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
