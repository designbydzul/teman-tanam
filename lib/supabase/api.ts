import { createServerClient as createSSRClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create Supabase client for API routes
 * This handles cookies properly for authentication in API routes
 * Based on the pattern from middleware.ts
 */
export function createApiClient(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response };
}
