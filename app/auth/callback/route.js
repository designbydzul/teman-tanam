import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Route Handler
 *
 * Handles the magic link callback from Supabase.
 * Exchanges the code for a session and redirects to home.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    // Redirect to login with error message
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = createServerClient();

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/?auth_error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      // Successfully authenticated
      // The client-side will handle checking onboarding status
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    } catch (err) {
      console.error('Auth callback exception:', err);
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent('Terjadi kesalahan saat login')}`, requestUrl.origin)
      );
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
