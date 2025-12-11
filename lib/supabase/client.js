import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Browser client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions for browser
export const auth = {
  // Send magic link to email
  async sendMagicLink(email) {
    console.log('[Supabase Client] sendMagicLink called with email:', email);
    console.log('[Supabase Client] Redirect URL:', `${window.location.origin}/auth/callback`);

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    console.log('[Supabase Client] signInWithOtp response:');
    console.log('[Supabase Client] - data:', JSON.stringify(data, null, 2));
    console.log('[Supabase Client] - error:', error);

    if (error) {
      console.error('[Supabase Client] Error sending magic link:', error.message);
      throw error;
    }

    console.log('[Supabase Client] Magic link sent successfully!');
    return data;
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
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
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
