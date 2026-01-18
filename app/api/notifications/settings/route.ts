import { NextRequest } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { successResponse, errorResponse, HttpStatus } from '@/lib/api';
import { notificationSettingsSchema, formatZodError } from '@/lib/validations';

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
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
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
        return successResponse({
          whatsapp_enabled: false,
          whatsapp_number: null,
          reminder_time: '07:00:00',
        });
      }

      console.error('[notification-settings] Fetch error:', fetchError);
      return errorResponse('Failed to fetch settings', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return successResponse(settings);
  } catch (error) {
    console.error('[notification-settings] GET error:', error);
    return errorResponse('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
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
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Parse and validate request body with Zod
    const body = await request.json();
    const validationResult = notificationSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(formatZodError(validationResult.error), HttpStatus.BAD_REQUEST);
    }

    const { whatsapp_enabled, whatsapp_number, reminder_time } = validationResult.data;

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
      return errorResponse('Failed to save settings', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return successResponse({ settings: data });
  } catch (error) {
    console.error('[notification-settings] POST error:', error);
    return errorResponse('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
