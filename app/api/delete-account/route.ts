import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { successResponse, errorResponse, HttpStatus } from '@/lib/api';
import { deleteAccountSchema, formatZodError } from '@/lib/validations';

/**
 * API Route: Delete User Account
 *
 * This route uses the service role key to delete a user's auth account.
 * It requires authentication and verifies the user can only delete their own account.
 */
export async function POST(request: NextRequest) {
  try {
    // First, verify the user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors in server components
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('Unauthorized - You must be logged in to delete your account', HttpStatus.UNAUTHORIZED);
    }

    const body = await request.json();

    // Validate request body with Zod
    const validationResult = deleteAccountSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(formatZodError(validationResult.error), HttpStatus.BAD_REQUEST);
    }

    const { userId } = validationResult.data;

    // CRITICAL: Verify the authenticated user is deleting their OWN account
    if (user.id !== userId) {
      return errorResponse('Forbidden - You can only delete your own account', HttpStatus.UNAUTHORIZED);
    }

    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Delete the auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting auth user:', error);
      return errorResponse('Gagal menghapus akun. Coba lagi ya!', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error in delete-account API:', error);
    return errorResponse('Oops, ada masalah. Coba lagi nanti ya!', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
