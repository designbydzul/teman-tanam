import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/notifications/settings
 * Fetch notification settings for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiClient(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch notification settings
    const { data: settings, error: fetchError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      // If no settings found, return default settings
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          whatsapp_enabled: false,
          whatsapp_number: null,
          reminder_time: '07:00:00',
        });
      }

      console.error('[notification-settings] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[notification-settings] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/settings
 * Update notification settings for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createApiClient(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { whatsapp_enabled, whatsapp_number, reminder_time } = body;

    // Validate required fields
    if (typeof whatsapp_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'whatsapp_enabled is required and must be a boolean' },
        { status: 400 }
      );
    }

    // If enabled, validate phone number
    if (whatsapp_enabled) {
      if (!whatsapp_number) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp harus diisi' },
          { status: 400 }
        );
      }

      // Validate Indonesian phone number format (628xxx)
      const phoneRegex = /^628\d{8,12}$/;
      if (!phoneRegex.test(whatsapp_number)) {
        return NextResponse.json(
          { error: 'Format nomor tidak valid. Harus dimulai dengan 628' },
          { status: 400 }
        );
      }
    }

    // Validate reminder_time format (HH:MM:SS)
    if (reminder_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRegex.test(reminder_time)) {
        return NextResponse.json(
          { error: 'Format waktu tidak valid. Gunakan HH:MM:SS' },
          { status: 400 }
        );
      }
    }

    // Upsert settings
    const { data, error: upsertError } = await supabase
      .from('notification_settings')
      .upsert(
        {
          user_id: user.id,
          whatsapp_enabled,
          whatsapp_number: whatsapp_enabled ? whatsapp_number : null,
          reminder_time: reminder_time || '07:00:00',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[notification-settings] Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error('[notification-settings] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
