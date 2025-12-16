'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase';
import { createDebugger } from '@/lib/debug';
import { TIMEOUTS } from '@/lib/constants';
import type { Profile, UseAuthReturn, EmailFrequency } from '@/types';

const debug = createDebugger('useAuth');

/**
 * useAuth Hook
 *
 * Manages authentication state and provides auth functions.
 * Checks if user has completed onboarding by looking for display_name in profiles table.
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

  // Check if user has a profile with display_name (completed onboarding)
  const checkOnboardingStatus = useCallback(async (userId: string | undefined, forceRefetch = false): Promise<boolean> => {
    debug.log('checkOnboardingStatus called with userId:', userId);

    if (!userId) {
      debug.log('No userId, setting hasCompletedOnboarding to false');
      setHasCompletedOnboarding(false);
      setProfile(null);
      return false;
    }

    // Prevent duplicate fetches for the same user within the same session
    if (!forceRefetch && hasFetchedProfile.current && currentUserId.current === userId) {
      debug.log('Already fetched profile for this user this session, skipping');
      return localStorage.getItem(`onboarding_complete_${userId}`) === 'true';
    }

    currentUserId.current = userId;

    // Use timeout instead of AbortController to avoid browser console errors
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), TIMEOUTS.PROFILE_FETCH);
    });

    try {
      debug.log('Fetching profile from Supabase...');

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      debug.log('Profile fetch result:', { data, error: error?.message });

      // Check if there's a real error
      const hasError = error && (error.message || error.code || Object.keys(error).length > 0);
      if (hasError) {
        debug.error('Profile check error:', error);
        setHasCompletedOnboarding(false);
        setProfile(null);
        return false;
      }

      // No profile found - create one
      if (!data) {
        debug.log('No profile found, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          debug.error('Error creating profile:', createError);
          setHasCompletedOnboarding(false);
          setProfile(null);
          hasFetchedProfile.current = true;
          return false;
        }

        debug.log('Profile created:', newProfile);
        setProfile(newProfile as Profile);
        setHasCompletedOnboarding(false);
        hasFetchedProfile.current = true;
        return false;
      }

      if (data.display_name) {
        debug.log('Profile has display_name, onboarding complete');
        setProfile(data as Profile);
        setHasCompletedOnboarding(true);
        localStorage.setItem(`onboarding_complete_${userId}`, 'true');
        hasFetchedProfile.current = true;
        return true;
      } else {
        debug.log('Profile exists but no display_name, needs onboarding');
        setProfile(data as Profile);
        setHasCompletedOnboarding(false);
        hasFetchedProfile.current = true;
        return false;
      }
    } catch (err) {
      const error = err as Error;
      const isTimeoutError = error.message?.includes('timeout') || error.message?.includes('abort');

      // Check localStorage cache before assuming not onboarded
      const cachedStatus = localStorage.getItem(`onboarding_complete_${userId}`);
      if (cachedStatus === 'true') {
        if (!isTimeoutError) {
          debug.log('Profile fetch failed but using cached onboarding status');
        }
        setHasCompletedOnboarding(true);
        hasFetchedProfile.current = true;
        return true;
      }

      if (!isTimeoutError) {
        debug.warn('Profile fetch failed and no cached status:', error.message);
      }
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
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          debug.log('User is authenticated:', currentSession.user?.email);
          setUser(currentSession.user);
          await checkOnboardingStatus(currentSession.user?.id);
        } else {
          debug.log('No session found - user not authenticated');
        }
      } catch (err) {
        debug.error('Auth init error:', err);
      }
      setLoading(false);
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
        await checkOnboardingStatus(newSession.user?.id);
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

  // Helper to add timeout to promises
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  // Complete onboarding
  const completeOnboarding = async (displayName: string, locationNames: string[] = []) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    debug.log('completeOnboarding called:', { displayName, locationNames });

    try {
      // 1. Update profile with display_name
      let profileData: Profile | null = null;
      try {
        const result = await withTimeout(
          Promise.resolve(
            supabase
              .from('profiles')
              .upsert({
                id: user.id,
                display_name: displayName,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' })
              .select()
              .single()
          ),
          TIMEOUTS.ONBOARDING_REQUEST
        );

        if (result.error) {
          debug.error('Profile update error:', result.error);
          throw result.error;
        }
        profileData = result.data as Profile;
        debug.log('Profile updated:', profileData);
      } catch (profileErr) {
        debug.error('Profile update failed or timed out:', profileErr);
        profileData = { id: user.id, display_name: displayName, avatar_url: null, show_statistics: true, email_notifications: false, email_frequency: 'none' as const, updated_at: new Date().toISOString() };
        debug.log('Using fallback profile data');
      }

      // 2. Insert locations into the locations table
      debug.log('locationNames received:', locationNames);

      if (locationNames && locationNames.length > 0) {
        const locationsToInsert = locationNames.map((name, index) => ({
          user_id: user.id,
          name: name,
          order_index: index,
        }));

        debug.log('Inserting locations:', locationsToInsert);

        try {
          const locResult = await withTimeout(
            Promise.resolve(
              supabase
                .from('locations')
                .insert(locationsToInsert)
                .select()
            ),
            TIMEOUTS.ONBOARDING_REQUEST
          );

          if (locResult.error) {
            debug.error('Locations INSERT ERROR:', locResult.error);
          } else {
            debug.log('Locations inserted successfully!', locResult.data);
          }
        } catch (locErr) {
          debug.error('Locations insert timed out or failed:', locErr);
        }
      }

      // Always set onboarding as complete
      setProfile(profileData);
      setHasCompletedOnboarding(true);
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      localStorage.setItem('userName', displayName);

      return { success: true, profile: profileData };
    } catch (err) {
      const error = err as Error;
      debug.error('Onboarding error:', error);

      // Even on error, try to complete onboarding locally
      debug.log('Attempting local fallback for onboarding');
      const fallbackProfile: Profile = { id: user.id, display_name: displayName, avatar_url: null, show_statistics: true, email_notifications: false, email_frequency: 'none', updated_at: new Date().toISOString() };
      setProfile(fallbackProfile);
      setHasCompletedOnboarding(true);
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      localStorage.setItem('userName', displayName);

      return { success: true, profile: fallbackProfile };
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

  // Update email notification settings
  const updateEmailNotifications = async (enabled: boolean, frequency: EmailFrequency) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    debug.log('updateEmailNotifications called:', { enabled, frequency });

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email_notifications: enabled,
          email_frequency: frequency,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        debug.error('Email notifications update error:', profileError);
        return { success: false, error: profileError.message };
      }

      debug.log('Email notifications updated:', profileData);
      setProfile(profileData as Profile);

      return { success: true, profile: profileData as Profile };
    } catch (err) {
      const error = err as Error;
      debug.error('Email notifications update error:', error);
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
    updateEmailNotifications,
  };
}

export default useAuth;
