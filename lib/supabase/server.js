import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server client for server-side operations (API routes, Server Components)
// Uses cookies for session management
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
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
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

// Helper for getting user in server components
export async function getServerUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

// Helper for getting session in server components
export async function getServerSession() {
  const supabase = await createServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session;
}
