import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Request validation schema
const RequestSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export async function POST(request: Request) {
  try {
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

    // Get all users and check if email exists
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('[check-email] Error listing users:', listError);
      return NextResponse.json(
        { success: false, error: 'Gagal cek email', exists: false },
        { status: 500 }
      );
    }

    const userExists = usersData?.users?.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    ) || false;

    return NextResponse.json({
      success: true,
      exists: userExists,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[check-email] API Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: 'Gagal cek email', exists: false },
      { status: 500 }
    );
  }
}
