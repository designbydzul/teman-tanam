'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, auth } from '@/lib/supabase';

/**
 * useAuth Hook
 *
 * Manages authentication state and provides auth functions.
 * Checks if user has completed onboarding by looking for display_name in profiles table.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [profile, setProfile] = useState(null);

  // Ref to prevent multiple fetches
  const hasFetchedProfile = useRef(false);
  const currentUserId = useRef(null);

  // Check if user has a profile with display_name (completed onboarding)
  const checkOnboardingStatus = useCallback(async (userId, userEmail, forceRefetch = false) => {
    console.log('[useAuth] checkOnboardingStatus called with userId:', userId);

    if (!userId) {
      console.log('[useAuth] No userId, setting hasCompletedOnboarding to false');
      setHasCompletedOnboarding(false);
      setProfile(null);
      return false;
    }

    // Prevent duplicate fetches for the same user
    if (!forceRefetch && hasFetchedProfile.current && currentUserId.current === userId) {
      console.log('[useAuth] Already fetched profile for this user, skipping');
      return hasCompletedOnboarding;
    }

    currentUserId.current = userId;

    try {
      console.log('[useAuth] Fetching profile from Supabase...');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no row

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[useAuth] Profile fetch result:', { data, error: error?.message, errorCode: error?.code });

      if (error) {
        console.error('[useAuth] Profile check error:', error);
        setHasCompletedOnboarding(false);
        setProfile(null);
        return false;
      }

      // No profile found - create one
      if (!data) {
        console.log('[useAuth] No profile found, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('[useAuth] Error creating profile:', createError);
          setHasCompletedOnboarding(false);
          setProfile(null);
          return false;
        }

        console.log('[useAuth] Profile created:', newProfile);
        setProfile(newProfile);
        setHasCompletedOnboarding(false); // New profile, needs onboarding
        hasFetchedProfile.current = true;
        return false;
      }

      if (data.display_name) {
        console.log('[useAuth] Profile has display_name, onboarding complete');
        setProfile(data);
        setHasCompletedOnboarding(true);
        hasFetchedProfile.current = true;
        return true;
      } else {
        console.log('[useAuth] Profile exists but no display_name, needs onboarding');
        setProfile(data);
        setHasCompletedOnboarding(false);
        hasFetchedProfile.current = true;
        return false;
      }
    } catch (err) {
      console.error('[useAuth] Onboarding check error:', err.message);
      // On any error (including timeout), assume user needs onboarding
      setHasCompletedOnboarding(false);
      setProfile(null);
      hasFetchedProfile.current = true; // Mark as fetched even on error to prevent loops
      return false;
    }
  }, [hasCompletedOnboarding]);

  // Initialize auth state
  useEffect(() => {
    console.log('[useAuth] Initializing auth...');

    const initAuth = async () => {
      try {
        // Get current session using supabase directly
        console.log('[useAuth] Getting session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        console.log('[useAuth] Session result:', {
          hasSession: !!currentSession,
          error: error?.message,
        });

        if (error) {
          console.error('[useAuth] Session error:', error);
          setSession(null);
          setUser(null);
          console.log('[useAuth] Setting loading to false (error path)');
          setLoading(false);
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          console.log('[useAuth] User is authenticated:', currentSession.user?.email);
          setUser(currentSession.user);
          console.log('[useAuth] About to check onboarding status...');
          await checkOnboardingStatus(currentSession.user?.id, currentSession.user?.email);
          console.log('[useAuth] Onboarding status check complete');
        } else {
          console.log('[useAuth] No session found - user not authenticated');
        }
      } catch (err) {
        console.error('[useAuth] Auth init error:', err);
      }
      // Always set loading to false after everything completes
      console.log('[useAuth] Setting loading to false (init complete)');
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    console.log('[useAuth] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[useAuth] Auth state changed:', event, newSession?.user?.email);

      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession) {
        console.log('[useAuth] User signed in:', newSession.user?.email);
        setUser(newSession.user);
        await checkOnboardingStatus(newSession.user?.id, newSession.user?.email);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuth] User signed out');
        setUser(null);
        setProfile(null);
        setHasCompletedOnboarding(false);
        hasFetchedProfile.current = false;
        currentUserId.current = null;
        setLoading(false);
      } else if (event === 'USER_UPDATED' && newSession) {
        setUser(newSession.user);
      } else if (event === 'INITIAL_SESSION') {
        // Handle initial session event (fired on page load with existing session)
        console.log('[useAuth] Initial session event');
        if (newSession) {
          setUser(newSession.user);
          await checkOnboardingStatus(newSession.user?.id, newSession.user?.email);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkOnboardingStatus]);

  // Login with magic link
  const loginWithMagicLink = async (email) => {
    console.log('[useAuth] loginWithMagicLink called with email:', email);

    try {
      console.log('[useAuth] Calling supabase.auth.signInWithOtp...');

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('[useAuth] Supabase response - data:', data);
      console.log('[useAuth] Supabase response - error:', error);

      if (error) {
        console.error('[useAuth] Supabase returned error:', error.message);
        throw error;
      }

      console.log('[useAuth] Magic link sent successfully!');
      return { success: true, data };
    } catch (err) {
      console.error('[useAuth] Magic link error:', err);
      console.error('[useAuth] Error details:', {
        message: err.message,
        status: err.status,
        code: err.code,
      });
      return {
        success: false,
        error: err.message || 'Gagal mengirim magic link. Coba lagi.'
      };
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      await auth.signInWithGoogle();
      return { success: true };
    } catch (err) {
      console.error('Google login error:', err);
      return {
        success: false,
        error: err.message || 'Gagal login dengan Google. Coba lagi.'
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await auth.signOut();
      // Clear local storage
      localStorage.removeItem('userName');
      localStorage.removeItem('userLocations');
      setUser(null);
      setSession(null);
      setProfile(null);
      setHasCompletedOnboarding(false);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return {
        success: false,
        error: err.message || 'Gagal keluar. Coba lagi.'
      };
    }
  };

  // Complete onboarding - update profile with display_name and add locations to separate table
  const completeOnboarding = async (displayName, locationNames = []) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    console.log('[useAuth] completeOnboarding called:', { displayName, locationNames });

    try {
      // 1. Update profile with display_name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('[useAuth] Profile update error:', profileError);
        throw profileError;
      }

      console.log('[useAuth] Profile updated:', profileData);

      // 2. Insert locations into the locations table (if any)
      if (locationNames && locationNames.length > 0) {
        const locationsToInsert = locationNames.map((name, index) => ({
          user_id: user.id,
          name: name,
          icon: '📍', // Default icon
          order_index: index,
        }));

        console.log('[useAuth] Inserting locations:', locationsToInsert);

        const { error: locationsError } = await supabase
          .from('locations')
          .insert(locationsToInsert);

        if (locationsError) {
          console.error('[useAuth] Locations INSERT ERROR:', locationsError);
          console.error('[useAuth] Locations error code:', locationsError.code);
          console.error('[useAuth] Locations error message:', locationsError.message);
          console.error('[useAuth] Locations error details:', locationsError.details);
          console.error('[useAuth] Locations error hint:', locationsError.hint);
          // Don't fail the whole onboarding if locations fail
          // User can add locations later
        } else {
          console.log('[useAuth] Locations inserted successfully!');
        }
      }

      setProfile(profileData);
      setHasCompletedOnboarding(true);

      // Also save to localStorage for backward compatibility
      localStorage.setItem('userName', displayName);

      return { success: true, profile: profileData };
    } catch (err) {
      console.error('[useAuth] Onboarding error:', err);
      return {
        success: false,
        error: err.message || 'Gagal menyimpan profil. Coba lagi.'
      };
    }
  };

  // Refresh onboarding status
  const refreshOnboardingStatus = async () => {
    if (user) {
      return await checkOnboardingStatus(user.id);
    }
    return false;
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
  };
}

export default useAuth;
