import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createDebugger } from '../debug';

const debug = createDebugger('supabase');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug: Log env vars on client
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] URL:', supabaseUrl);
  console.log('[Supabase Client] Key exists:', !!supabaseAnonKey, 'Length:', supabaseAnonKey?.length);
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Browser client for client-side operations
// Using PKCE flow - more secure for server-side rendered apps
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Auth helper functions for browser
export const auth = {
  // Send magic link to email
  async sendMagicLink(email: string) {
    debug.log('sendMagicLink called with email:', email);

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      debug.error('Error sending magic link:', error.message);
      throw error;
    }

    debug.log('Magic link sent successfully!');
    return data;
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // For PKCE flow, redirect to callback route for code exchange
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Listen for auth changes
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
