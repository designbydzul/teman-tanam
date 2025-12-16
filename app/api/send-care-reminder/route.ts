/**
 * API Route: Send Care Reminder Emails
 *
 * POST /api/send-care-reminder
 *
 * Body options:
 * - { test: true } - Send test email to current user
 * - { userId: string } - Send care reminder to specific user
 * - { } - Send care reminders to all users with notifications enabled (for cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendCareReminderEmail, sendTestEmail, CareReminderEmailData } from '@/lib/email';

// Initialize Supabase with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For authenticated requests (test email)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlantSpeciesInfo {
  common_name: string;
  watering_frequency_days: number | null;
  fertilizing_frequency_days: number | null;
}

interface PlantFromDB {
  id: string;
  name: string | null;
  user_id: string;
  species_id: string | null;
  custom_watering_days: number | null;
  custom_fertilizing_days: number | null;
  plant_species: PlantSpeciesInfo | PlantSpeciesInfo[] | null;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  email_notifications: boolean;
  email_frequency: string;
}

/**
 * Get species info from plant (handles both array and single object from Supabase)
 */
function getSpeciesInfo(plant: PlantFromDB): PlantSpeciesInfo | null {
  if (!plant.plant_species) return null;
  if (Array.isArray(plant.plant_species)) {
    return plant.plant_species[0] || null;
  }
  return plant.plant_species;
}

/**
 * Calculate if a plant needs watering or fertilizing
 */
function calculateCareNeeds(
  plant: PlantFromDB,
  lastWatered: string | null,
  lastFertilized: string | null
): { needsWatering: boolean; needsFertilizing: boolean } {
  const now = new Date();
  const DEFAULT_WATERING_DAYS = 3;
  const DEFAULT_FERTILIZING_DAYS = 14;

  const speciesInfo = getSpeciesInfo(plant);

  // Get frequencies (custom > species > default)
  const wateringDays = plant.custom_watering_days
    ?? speciesInfo?.watering_frequency_days
    ?? DEFAULT_WATERING_DAYS;

  const fertilizingDays = plant.custom_fertilizing_days
    ?? speciesInfo?.fertilizing_frequency_days
    ?? DEFAULT_FERTILIZING_DAYS;

  // Calculate days since last action
  const daysSinceWatered = lastWatered
    ? Math.floor((now.getTime() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const daysSinceFertilized = lastFertilized
    ? Math.floor((now.getTime() - new Date(lastFertilized).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    needsWatering: daysSinceWatered === null || daysSinceWatered >= wateringDays,
    needsFertilizing: daysSinceFertilized === null || daysSinceFertilized >= fertilizingDays,
  };
}

/**
 * Get user's email from Supabase Auth
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      console.error('[send-care-reminder] Error getting user email:', error);
      return null;
    }
    return data.user.email || null;
  } catch (err) {
    console.error('[send-care-reminder] Error getting user email:', err);
    return null;
  }
}

/**
 * Get plants needing care for a user
 */
async function getPlantsNeedingCare(userId: string): Promise<{
  plantsNeedingWater: string[];
  plantsNeedingFertilizer: string[];
  totalPlants: number;
}> {
  // Get all active plants for user
  const { data: plants, error: plantsError } = await supabaseAdmin
    .from('plants')
    .select(`
      id,
      name,
      user_id,
      species_id,
      custom_watering_days,
      custom_fertilizing_days,
      plant_species (
        common_name,
        watering_frequency_days,
        fertilizing_frequency_days
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (plantsError || !plants) {
    console.error('[send-care-reminder] Error fetching plants:', plantsError);
    return { plantsNeedingWater: [], plantsNeedingFertilizer: [], totalPlants: 0 };
  }

  const plantsNeedingWater: string[] = [];
  const plantsNeedingFertilizer: string[] = [];

  // For each plant, get last watering and fertilizing dates
  for (const plant of plants) {
    // Get last watering action
    const { data: lastWaterAction } = await supabaseAdmin
      .from('actions')
      .select('action_date')
      .eq('plant_id', plant.id)
      .eq('action_type', 'siram')
      .order('action_date', { ascending: false })
      .limit(1)
      .single();

    // Get last fertilizing action
    const { data: lastFertilizeAction } = await supabaseAdmin
      .from('actions')
      .select('action_date')
      .eq('plant_id', plant.id)
      .eq('action_type', 'pupuk')
      .order('action_date', { ascending: false })
      .limit(1)
      .single();

    const typedPlant = plant as PlantFromDB;
    const { needsWatering, needsFertilizing } = calculateCareNeeds(
      typedPlant,
      lastWaterAction?.action_date || null,
      lastFertilizeAction?.action_date || null
    );

    const speciesInfo = getSpeciesInfo(typedPlant);
    const plantName = plant.name || speciesInfo?.common_name || 'Tanaman';

    if (needsWatering) {
      plantsNeedingWater.push(plantName);
    }
    if (needsFertilizing) {
      plantsNeedingFertilizer.push(plantName);
    }
  }

  return {
    plantsNeedingWater,
    plantsNeedingFertilizer,
    totalPlants: plants.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { test, userId, cronSecret } = body;

    // Verify cron secret for batch operations
    if (!test && !userId && cronSecret !== process.env.CRON_SECRET) {
      // For batch operations without userId, require cron secret
      // But allow if called internally without secret for development
      if (process.env.NODE_ENV === 'production' && !cronSecret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Handle test email
    if (test) {
      // Get current user from auth header
      const authHeader = request.headers.get('authorization');
      let currentUserId: string | null = null;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        currentUserId = user?.id || null;
      }

      // If no auth header, try to get from cookie
      if (!currentUserId) {
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
          // Parse the sb-access-token from cookies
          const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => c.split('='))
          );
          const accessToken = cookies['sb-access-token'] || cookies['sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token'];

          if (accessToken) {
            try {
              const parsed = JSON.parse(decodeURIComponent(accessToken));
              const { data: { user } } = await supabaseClient.auth.getUser(parsed.access_token || parsed[0]);
              currentUserId = user?.id || null;
            } catch {
              // Cookie parsing failed
            }
          }
        }
      }

      // As a fallback for development, check if there's a user ID in the request
      if (!currentUserId && userId) {
        currentUserId = userId;
      }

      if (!currentUserId) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Get user profile and email
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('id', currentUserId)
        .single();

      const userEmail = await getUserEmail(currentUserId);

      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: 'Could not get user email' },
          { status: 400 }
        );
      }

      const result = await sendTestEmail(userEmail, profile?.display_name || 'Pengguna');

      return NextResponse.json(result);
    }

    // Handle single user care reminder
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, email_notifications, email_frequency')
        .eq('id', userId)
        .single();

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const userEmail = await getUserEmail(userId);
      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: 'User email not found' },
          { status: 400 }
        );
      }

      const careData = await getPlantsNeedingCare(userId);

      const emailData: CareReminderEmailData = {
        userName: profile.display_name || 'Pengguna',
        userEmail,
        plantsNeedingWater: careData.plantsNeedingWater,
        plantsNeedingFertilizer: careData.plantsNeedingFertilizer,
        totalPlants: careData.totalPlants,
      };

      const result = await sendCareReminderEmail(emailData);
      return NextResponse.json(result);
    }

    // Handle batch send (for cron job)
    // Get all users with email notifications enabled
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email_notifications, email_frequency')
      .eq('email_notifications', true)
      .neq('email_frequency', 'none');

    if (usersError) {
      console.error('[send-care-reminder] Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with notifications enabled',
        sent: 0,
      });
    }

    // Determine which users should receive emails based on frequency
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday

    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const profile of users) {
      try {
        // Skip weekly users if not Sunday
        if (profile.email_frequency === 'weekly' && dayOfWeek !== 0) {
          results.skipped++;
          continue;
        }

        const userEmail = await getUserEmail(profile.id);
        if (!userEmail) {
          results.failed++;
          results.errors.push(`No email for user ${profile.id}`);
          continue;
        }

        const careData = await getPlantsNeedingCare(profile.id);

        // Skip if no plants need care
        if (careData.plantsNeedingWater.length === 0 && careData.plantsNeedingFertilizer.length === 0) {
          results.skipped++;
          continue;
        }

        const emailData: CareReminderEmailData = {
          userName: profile.display_name || 'Pengguna',
          userEmail,
          plantsNeedingWater: careData.plantsNeedingWater,
          plantsNeedingFertilizer: careData.plantsNeedingFertilizer,
          totalPlants: careData.totalPlants,
        };

        const result = await sendCareReminderEmail(emailData);

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Failed for ${profile.id}: ${result.error}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error for ${profile.id}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (err) {
    console.error('[send-care-reminder] Error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// GET endpoint for cron jobs (Vercel Cron)
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Call POST handler with empty body
  const response = await POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ cronSecret: process.env.CRON_SECRET }),
  }));

  return response;
}
