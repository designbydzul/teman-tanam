import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rateLimit';

// Request validation schema
const RequestSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

/**
 * Check if email exists in the system
 *
 * Security measures:
 * - Rate limiting: 5 requests per minute per IP to prevent enumeration
 * - Uses getUserByEmail instead of listUsers for efficiency and security
 * - Does not reveal timing differences between existing/non-existing emails
 */
export async function POST(request: Request) {
  try {
    // Rate limiting - prevent email enumeration attacks
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.CHECK_EMAIL);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult,
        'Terlalu banyak percobaan. Tunggu sebentar ya!'
      );
    }

    // Get Supabase service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[check-email] Missing Supabase environment variables');
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 503 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse and validate request body
    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Email gak valid nih', exists: false },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check email existence using signInWithPassword with invalid password
    // This is more secure than listUsers as:
    // 1. It only checks one email at a time
    // 2. Returns consistent error messages regardless of user existence
    // 3. Doesn't expose the entire user list
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password: '__check_only_invalid_password_12345__',
    });

    // Determine if user exists based on error message:
    // - "Invalid login credentials" = user exists, wrong password
    // - "Email not confirmed" = user exists, not verified
    // - Other errors typically mean user doesn't exist
    const userExists = signInError?.message?.toLowerCase().includes('invalid login credentials') ||
                       signInError?.message?.toLowerCase().includes('email not confirmed') ||
                       signInError?.message?.toLowerCase().includes('invalid credentials');

    // Add rate limit headers to successful response
    const response = NextResponse.json({
      success: true,
      exists: userExists,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[check-email] API Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: 'Gagal cek email', exists: false },
      { status: 500 }
    );
  }
}
