'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const checkOnboardingStatus = useCallback(async (userId: string | undefined, forceRefetch = false): Promise<boolean> => {
    console.log('🔍 [ONBOARDING] === checkOnboardingStatus START ===');
    console.log('🔍 [ONBOARDING] userId:', userId);
    console.log('🔍 [ONBOARDING] forceRefetch:', forceRefetch);
    console.log('🔍 [ONBOARDING] hasFetchedProfile.current:', hasFetchedProfile.current);
    console.log('🔍 [ONBOARDING] currentUserId.current:', currentUserId.current);

    if (!userId) {
      console.log('🔍 [ONBOARDING] No userId, returning false');
      setHasCompletedOnboarding(false);
      setProfile(null);
      return false;
    }

    // Prevent duplicate fetches - but log what's happening
    if (!forceRefetch && hasFetchedProfile.current && currentUserId.current === userId) {
      console.log('🔍 [ONBOARDING] SKIPPING fetch - using cached result:', hasCompletedOnboarding);
      return hasCompletedOnboarding;
    }

    currentUserId.current = userId;
    console.log('🔍 [ONBOARDING] Starting Supabase query...');

    try {
      // Direct query - no timeout wrapper for now to see what happens
      console.log('🔍 [ONBOARDING] Calling supabase.from(profiles).select()...');

      const result = await supabase
        .from('profiles')
        .select('id, display_name, onboarding_completed, avatar_url, show_statistics, updated_at')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔍 [ONBOARDING] Supabase returned:', JSON.stringify(result));

      const { data, error } = result;

      if (error) {
        console.log('❌ [ONBOARDING] Profile fetch error:', error.message);
        setHasCompletedOnboarding(false);
        setProfile(null);
        hasFetchedProfile.current = true;
        return false;
      }

      // No profile exists - show onboarding
      if (!data) {
        console.log('❌ [ONBOARDING] No profile found - SHOWING onboarding');
        setHasCompletedOnboarding(false);
        setProfile(null);
        hasFetchedProfile.current = true;
        return false;
      }

      // Check onboarding_completed column
      const completed = data.onboarding_completed === true;
      console.log('🔍 [ONBOARDING] onboarding_completed value:', data.onboarding_completed, '(type:', typeof data.onboarding_completed, ')');
      console.log(completed ? '✅ [ONBOARDING] Completed - going to Home' : '❌ [ONBOARDING] Not completed - SHOWING onboarding');

      setProfile(data as Profile);
      setHasCompletedOnboarding(completed);
      hasFetchedProfile.current = true;
      console.log('🔍 [ONBOARDING] === checkOnboardingStatus END (success) ===');
      return completed;
    } catch (err) {
      const errorMsg = (err as Error).message;
      console.log('🚨 [ONBOARDING] CATCH block - Error:', errorMsg);
      console.log('🚨 [ONBOARDING] Full error:', err);

      setHasCompletedOnboarding(false);
      setProfile(null);
      hasFetchedProfile.current = true;
      console.log('🔍 [ONBOARDING] === checkOnboardingStatus END (error) ===');
      return false;
    }
  }, [hasCompletedOnboarding]);

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
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          debug.log('User is authenticated:', currentSession.user?.email);
          // DEBUG: Log user_id for cross-device sync debugging
          console.log('🔑 [AUTH] USER_ID on login:', currentSession.user?.id);
          console.log('🔑 [AUTH] Email:', currentSession.user?.email);
          setUser(currentSession.user);
          await checkOnboardingStatus(currentSession.user?.id);
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
        // DEBUG: Log user_id for cross-device sync debugging
        console.log('🔑 [AUTH] SIGNED_IN - USER_ID:', newSession.user?.id);
        console.log('🔑 [AUTH] SIGNED_IN - Email:', newSession.user?.email);
        setUser(newSession.user);
        await checkOnboardingStatus(newSession.user?.id);
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
          await checkOnboardingStatus(newSession.user?.id);
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

    console.log('🔍 [ONBOARDING] completeOnboarding called:', { displayName, locationNames });

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
        console.log('❌ [ONBOARDING] Profile update error:', profileError.message);
        throw profileError;
      }

      console.log('✅ [ONBOARDING] Profile updated with onboarding_completed=true');

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
          console.log('⚠️ [ONBOARDING] Locations insert error:', locError.message);
        }
      }

      // Update local state
      setProfile(profileData as Profile);
      setHasCompletedOnboarding(true);
      localStorage.setItem('userName', displayName);

      return { success: true, profile: profileData as Profile };
    } catch (err) {
      const error = err as Error;
      console.log('❌ [ONBOARDING] completeOnboarding error:', error.message);
      return { success: false, error: error.message || 'Gagal menyimpan. Coba lagi.' };
    }
  };

  // Refresh onboarding status
  const refreshOnboardingStatus = async (): Promise<boolean> => {
    if (user) {
      return await checkOnboardingStatus(user.id);
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
    logout,
    completeOnboarding,
    refreshOnboardingStatus,
    updateProfile,
    updateShowStatistics,
  };
}

export default useAuth;
