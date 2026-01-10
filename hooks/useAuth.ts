'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase';
import { createDebugger } from '@/lib/debug';
import { TIMEOUTS } from '@/lib/constants';
import type { Profile, UseAuthReturn } from '@/types';

const debug = createDebugger('useAuth');

/**
 * useAuth Hook
 *
 * Manages authentication state and provides auth functions.
 * Checks if user has completed onboarding by looking at onboarding_completed column in profiles table.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Ref to prevent multiple fetches
  const hasFetchedProfile = useRef(false);
  const currentUserId = useRef<string | null>(null);

  // Simple onboarding check - just look at onboarding_completed column
  // Pass accessToken to avoid Supabase client auth issues
  const checkOnboardingStatus = useCallback(async (userId: string | undefined, accessToken?: string, forceRefetch = false): Promise<boolean> => {
    if (!userId) {
      setHasCompletedOnboarding(false);
      setProfile(null);
      return false;
    }

    // Prevent duplicate fetches
    if (!forceRefetch && hasFetchedProfile.current && currentUserId.current === userId) {
      return hasCompletedOnboarding;
    }

    currentUserId.current = userId;

    // Check if offline - skip network request and use cached state
    if (!navigator.onLine) {
      debug.log('Offline - skipping profile fetch, using cached onboarding state');
      // Keep existing state if we have it, otherwise assume completed to allow offline usage
      if (!hasFetchedProfile.current) {
        // First time and offline - assume completed so user can use app offline
        // Use startTransition to mark cached data updates as lower priority than animations
        startTransition(() => {
          setHasCompletedOnboarding(true);
        });
        hasFetchedProfile.current = true;
      }
      return hasCompletedOnboarding;
    }

    try {
      debug.log('Fetching profile for onboarding check...');

      // Use fetch directly with access token to avoid Supabase client hanging
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,display_name,onboarding_completed,avatar_url,show_statistics,updated_at`,
        {
          headers: {
            'apikey': supabaseKey || '',
            'Authorization': `Bearer ${accessToken || supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      // Result is an array, get first item
      const data = Array.isArray(result) ? result[0] : null;

      if (!response.ok) {
        debug.error('Profile fetch error:', result.message);
        setHasCompletedOnboarding(false);
        setProfile(null);
        hasFetchedProfile.current = true;
        return false;
      }

      // No profile exists - show onboarding
      if (!data) {
        debug.log('No profile found - showing onboarding');
        setHasCompletedOnboarding(false);
        setProfile(null);
        hasFetchedProfile.current = true;
        return false;
      }

      // Check onboarding_completed column
      const completed = data.onboarding_completed === true;
      debug.log('Onboarding status:', completed ? 'completed' : 'not completed');

      setProfile(data as Profile);
      setHasCompletedOnboarding(completed);
      hasFetchedProfile.current = true;
      return completed;
    } catch (err) {
      // Handle offline/network errors gracefully
      if (!navigator.onLine) {
        debug.log('Network error while offline - using cached state');
        if (!hasFetchedProfile.current) {
          // Use startTransition to mark cached data updates as lower priority than animations
          startTransition(() => {
            setHasCompletedOnboarding(true);
          });
          hasFetchedProfile.current = true;
        }
        return hasCompletedOnboarding;
      }
      debug.error('Profile fetch error:', err);
      setHasCompletedOnboarding(false);
      setProfile(null);
      hasFetchedProfile.current = true;
      return false;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    debug.log('Initializing auth...');

    const initAuth = async () => {
      try {
        debug.log('Getting session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        debug.log('Session result:', {
          hasSession: !!currentSession,
          error: error?.message,
        });

        if (error) {
          debug.error('Session error:', error);
          // Clear invalid session (e.g., invalid refresh token)
          if (error.message?.includes('Refresh Token') || error.message?.includes('Invalid')) {
            debug.log('Clearing invalid session...');
            await supabase.auth.signOut();
          }
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          debug.log('User is authenticated:', currentSession.user?.email);
          setUser(currentSession.user);
          await checkOnboardingStatus(currentSession.user?.id, currentSession.access_token);
        } else {
          debug.log('No session found - user not authenticated');
        }
        setLoading(false);
      } catch (err) {
        debug.error('Auth init error:', err);
        setLoading(false);
      }
    };

    initAuth();

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      debug.log('Safety timeout triggered - forcing loading to false');
      setLoading(false);
    }, TIMEOUTS.SAFETY_LOADING);

    // Listen for auth state changes
    debug.log('Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      debug.log('Auth state changed:', { event, email: newSession?.user?.email });

      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession) {
        debug.log('User signed in:', newSession.user?.email);
        setUser(newSession.user);
        await checkOnboardingStatus(newSession.user?.id, newSession.access_token);
        // Clear any OAuth tokens from URL hash
        if (window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        debug.log('User signed out');
        setUser(null);
        setProfile(null);
        setHasCompletedOnboarding(false);
        hasFetchedProfile.current = false;
        currentUserId.current = null;
        setLoading(false);
      } else if (event === 'USER_UPDATED' && newSession) {
        setUser(newSession.user);
      } else if (event === 'INITIAL_SESSION') {
        debug.log('Initial session event');
        if (newSession) {
          setUser(newSession.user);
          await checkOnboardingStatus(newSession.user?.id, newSession.access_token);
        }
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, [checkOnboardingStatus]);

  // Login with magic link
  const loginWithMagicLink = async (email: string) => {
    debug.log('loginWithMagicLink called with email:', email);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        debug.error('Supabase returned error:', error.message);
        throw error;
      }

      debug.log('Magic link sent successfully!');
      return { success: true, data };
    } catch (err) {
      const error = err as Error;
      debug.error('Magic link error:', error);
      return {
        success: false,
        error: error.message || 'Gagal mengirim magic link. Coba lagi.'
      };
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string) => {
    debug.log('signUpWithEmail called with email:', email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        debug.error('Sign up error:', error.message);
        // Map common Supabase errors to Indonesian
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'Email ini sudah terdaftar. Coba login atau gunakan email lain.';
        } else if (error.message.includes('Password should be')) {
          errorMessage = 'Password harus minimal 8 karakter.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Format email tidak valid.';
        }
        return { success: false, error: errorMessage };
      }

      debug.log('Sign up successful!');
      return { success: true, data, needsConfirmation: !data.session };
    } catch (err) {
      const error = err as Error;
      debug.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Gagal mendaftar. Coba lagi.'
      };
    }
  };

  // Login with email and password
  const loginWithEmail = async (email: string, password: string) => {
    debug.log('loginWithEmail called with email:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        debug.error('Login error:', error.message);
        // Map common Supabase errors to Indonesian
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email atau password salah. Coba lagi.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email belum dikonfirmasi. Cek inbox kamu.';
        }
        return { success: false, error: errorMessage };
      }

      debug.log('Login successful!');
      return { success: true, data };
    } catch (err) {
      const error = err as Error;
      debug.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Gagal login. Coba lagi.'
      };
    }
  };

  // Send password reset email
  const resetPassword = async (email: string) => {
    debug.log('resetPassword called with email:', email);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        debug.error('Reset password error:', error.message);
        return { success: false, error: 'Gagal mengirim email reset. Coba lagi.' };
      }

      debug.log('Password reset email sent!');
      return { success: true };
    } catch (err) {
      const error = err as Error;
      debug.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Gagal mengirim email reset. Coba lagi.'
      };
    }
  };

  // Update password (for reset password flow)
  const updatePassword = async (newPassword: string) => {
    debug.log('updatePassword called');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        debug.error('Update password error:', error.message);
        let errorMessage = error.message;
        if (error.message.includes('Password should be')) {
          errorMessage = 'Password harus minimal 8 karakter.';
        }
        return { success: false, error: errorMessage };
      }

      debug.log('Password updated successfully!');
      return { success: true };
    } catch (err) {
      const error = err as Error;
      debug.error('Update password error:', error);
      return {
        success: false,
        error: error.message || 'Gagal mengubah password. Coba lagi.'
      };
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      await auth.signInWithGoogle();
      return { success: true };
    } catch (err) {
      const error = err as Error;
      debug.error('Google login error:', error);
      return {
        success: false,
        error: error.message || 'Gagal login dengan Google. Coba lagi.'
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (user?.id) {
        localStorage.removeItem(`onboarding_complete_${user.id}`);
      }
      await auth.signOut();
      localStorage.removeItem('userName');
      localStorage.removeItem('userLocations');
      setUser(null);
      setSession(null);
      setProfile(null);
      setHasCompletedOnboarding(false);
      return { success: true };
    } catch (err) {
      const error = err as Error;
      debug.error('Logout error:', error);
      return {
        success: false,
        error: error.message || 'Gagal keluar. Coba lagi.'
      };
    }
  };

  // Complete onboarding
  const completeOnboarding = async (displayName: string, locationNames: string[] = []) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    debug.log('completeOnboarding called:', { displayName, locationCount: locationNames.length });

    try {
      // 1. Update profile with display_name AND onboarding_completed = true
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        debug.error('Profile update error:', profileError);
        throw profileError;
      }

      debug.log('Profile updated with onboarding_completed=true');

      // 2. Insert locations into the locations table
      if (locationNames && locationNames.length > 0) {
        const locationsToInsert = locationNames.map((name, index) => ({
          user_id: user.id,
          name: name,
          order_index: index,
        }));

        const { error: locError } = await supabase
          .from('locations')
          .insert(locationsToInsert);

        if (locError) {
          debug.error('Locations insert error:', locError);
        }
      }

      // Update local state
      setProfile(profileData as Profile);
      setHasCompletedOnboarding(true);
      localStorage.setItem('userName', displayName);

      return { success: true, profile: profileData as Profile };
    } catch (err) {
      const error = err as Error;
      debug.error('completeOnboarding error:', error);
      return { success: false, error: error.message || 'Gagal menyimpan. Coba lagi.' };
    }
  };

  // Refresh onboarding status
  const refreshOnboardingStatus = async (): Promise<boolean> => {
    if (user && session) {
      return await checkOnboardingStatus(user.id, session.access_token);
    }
    return false;
  };

  // Update profile
  const updateProfile = async ({ displayName, photoUrl }: { displayName?: string; photoUrl?: string }) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    debug.log('updateProfile called:', { displayName, hasPhoto: !!photoUrl });

    try {
      const updateData: Record<string, unknown> = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (displayName !== undefined) {
        updateData.display_name = displayName;
      }

      if (photoUrl !== undefined) {
        updateData.avatar_url = photoUrl;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        debug.error('Profile update error:', profileError);
        throw profileError;
      }

      debug.log('Profile updated:', profileData);
      setProfile(profileData as Profile);

      if (displayName) {
        localStorage.setItem('userName', displayName);
        localStorage.setItem('temanTanamUserName', displayName);
      }

      return { success: true, profile: profileData as Profile };
    } catch (err) {
      const error = err as Error;
      debug.error('Profile update error:', error);
      return {
        success: false,
        error: error.message || 'Gagal menyimpan profil. Coba lagi.'
      };
    }
  };

  // Update show statistics setting
  const updateShowStatistics = async (showStatistics: boolean) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    debug.log('updateShowStatistics called:', showStatistics);

    // Save to localStorage immediately for fast feedback
    localStorage.setItem('showHomeStats', JSON.stringify(showStatistics));

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          show_statistics: showStatistics,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        debug.error('Show statistics update error:', profileError);
        // Don't throw - localStorage already updated as fallback
        return { success: false, error: profileError.message };
      }

      debug.log('Show statistics updated:', profileData);
      setProfile(profileData as Profile);

      return { success: true, profile: profileData as Profile };
    } catch (err) {
      const error = err as Error;
      debug.error('Show statistics update error:', error);
      // localStorage already set, so user sees the change
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    hasCompletedOnboarding,
    loginWithMagicLink,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    logout,
    completeOnboarding,
    refreshOnboardingStatus,
    updateProfile,
    updateShowStatistics,
  };
}

export default useAuth;
