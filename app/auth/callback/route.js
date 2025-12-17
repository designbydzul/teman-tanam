import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Route Handler
 *
 * Handles the OAuth/magic link callback from Supabase.
 * Exchanges the code for a session and redirects to home.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, origin)
    );
  }

  if (code) {
    const cookieStore = await cookies();

    // Debug: Log env vars and cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('[Auth Callback] URL:', supabaseUrl);
    console.log('[Auth Callback] Key exists:', !!supabaseKey, 'Length:', supabaseKey?.length);

    // Debug: Log all cookies to see if code verifier is present
    const allCookies = cookieStore.getAll();
    console.log('[Auth Callback] Cookies:', allCookies.map(c => ({ name: c.name, valueLength: c.value?.length })));

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/?auth_error=${encodeURIComponent(exchangeError.message)}`, origin)
        );
      }

      // Successfully authenticated - redirect to home
      return NextResponse.redirect(new URL('/', origin));
    } catch (err) {
      console.error('Auth callback exception:', err);
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent('Terjadi kesalahan saat login')}`, origin)
      );
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL('/', origin));
}
