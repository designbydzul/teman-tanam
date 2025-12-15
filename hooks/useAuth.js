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
  // Note: Empty dependency array to prevent infinite loops - we use refs for state that changes
  const checkOnboardingStatus = useCallback(async (userId, forceRefetch = false) => {
    console.log('[useAuth] checkOnboardingStatus called with userId:', userId);

    if (!userId) {
      console.log('[useAuth] No userId, setting hasCompletedOnboarding to false');
      setHasCompletedOnboarding(false);
      setProfile(null);
      return false;
    }

    // Prevent duplicate fetches for the same user within the same session
    // NOTE: We no longer trust localStorage cache alone - we ALWAYS verify with database
    // on first load to prevent stale cache issues where cache says complete but DB says not
    if (!forceRefetch && hasFetchedProfile.current && currentUserId.current === userId) {
      console.log('[useAuth] Already fetched profile for this user this session, skipping');
      // Return current cached value from localStorage or false
      return localStorage.getItem(`onboarding_complete_${userId}`) === 'true';
    }

    currentUserId.current = userId;

    // Use AbortController for proper timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced from 15s to 5s

    try {
      console.log('[useAuth] Fetching profile from Supabase...');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      console.log('[useAuth] Profile fetch result:', { data, error: error?.message, errorCode: error?.code });

      if (error) {
        console.error('[useAuth] Profile check error:', error);
        setHasCompletedOnboarding(false);
        setProfile(null);
        return false;
      }

      // No profile found - the handle_new_user trigger should have created one
      // If not found, try to create one using upsert to handle race conditions
      if (!data) {
        console.log('[useAuth] No profile found, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          console.error('[useAuth] Error creating profile:', createError);
          // Even if we can't create, set onboarding to false so user sees onboarding screen
          setHasCompletedOnboarding(false);
          setProfile(null);
          hasFetchedProfile.current = true;
          return false;
        }

        console.log('[useAuth] Profile created:', newProfile);
        setProfile(newProfile);
        setHasCompletedOnboarding(false); // New profile, needs onboarding
        hasFetchedProfile.current = true;
        return false;
      }

      if (data.display_name) {
        console.log('[useAuth] Profile has display_name, onboarding complete. display_name:', data.display_name);
        console.log('[useAuth] Setting hasCompletedOnboarding to TRUE (from checkOnboardingStatus)');
        setProfile(data);
        setHasCompletedOnboarding(true);
        // Cache onboarding status in localStorage
        localStorage.setItem(`onboarding_complete_${userId}`, 'true');
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
      clearTimeout(timeoutId);

      // On error (including timeout/abort), check localStorage cache before assuming not onboarded
      const cachedStatus = localStorage.getItem(`onboarding_complete_${userId}`);
      if (cachedStatus === 'true') {
        // Don't log error if we have a cached fallback - this is expected behavior
        console.log('[useAuth] Profile fetch failed but using cached onboarding status');
        setHasCompletedOnboarding(true);
        hasFetchedProfile.current = true;
        return true;
      }
      // Only log error if we have no fallback
      console.warn('[useAuth] Profile fetch failed and no cached status:', err.message);
      setHasCompletedOnboarding(false);
      setProfile(null);
      hasFetchedProfile.current = true; // Mark as fetched even on error to prevent loops
      return false;
    }
  }, []); // Empty deps - uses refs and localStorage for state

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
          await checkOnboardingStatus(currentSession.user?.id);
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

    // Safety timeout - if loading is still true after 10 seconds, force set it to false
    const safetyTimeout = setTimeout(() => {
      console.log('[useAuth] Safety timeout triggered - forcing loading to false');
      setLoading(false);
    }, 10000);

    // Listen for auth state changes
    console.log('[useAuth] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[useAuth] Auth state changed:', event, newSession?.user?.email);

      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession) {
        console.log('[useAuth] User signed in:', newSession.user?.email);
        setUser(newSession.user);
        await checkOnboardingStatus(newSession.user?.id);
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
      // Clear onboarding cache before sign out (while we still have user)
      if (user?.id) {
        localStorage.removeItem(`onboarding_complete_${user.id}`);
      }
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

    // Helper to add timeout to promises
    const withTimeout = (promise, ms) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
      );
      return Promise.race([promise, timeout]);
    };

    try {
      // 1. Update profile with display_name (with 20 second timeout)
      let profileData = null;
      try {
        const result = await withTimeout(
          supabase
            .from('profiles')
            .upsert({
              id: user.id,
              display_name: displayName,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            })
            .select()
            .single(),
          20000
        );

        if (result.error) {
          console.error('[useAuth] Profile update error:', result.error);
          throw result.error;
        }
        profileData = result.data;
        console.log('[useAuth] Profile updated:', profileData);
      } catch (profileErr) {
        console.error('[useAuth] Profile update failed or timed out:', profileErr);
        // Create a minimal profile object for local use
        profileData = { id: user.id, display_name: displayName };
        console.log('[useAuth] Using fallback profile data');
      }

      // 2. Insert locations into the locations table (if any) - with timeout
      console.log('[useAuth] locationNames received:', locationNames);

      if (locationNames && locationNames.length > 0) {
        const locationsToInsert = locationNames.map((name, index) => ({
          user_id: user.id,
          name: name,
          order_index: index,
        }));

        console.log('[useAuth] Inserting locations:', locationsToInsert);

        try {
          const locResult = await withTimeout(
            supabase
              .from('locations')
              .insert(locationsToInsert)
              .select(),
            20000
          );

          if (locResult.error) {
            console.error('[useAuth] Locations INSERT ERROR:', locResult.error);
            // Don't fail the whole onboarding if locations fail
          } else {
            console.log('[useAuth] Locations inserted successfully!', locResult.data);
          }
        } catch (locErr) {
          console.error('[useAuth] Locations insert timed out or failed:', locErr);
          // Continue anyway - locations can be added later
        }
      } else {
        console.log('[useAuth] No locations to insert');
      }

      // Always set onboarding as complete (even if some DB operations failed)
      setProfile(profileData);
      console.log('[useAuth] Setting hasCompletedOnboarding to TRUE');
      setHasCompletedOnboarding(true);

      // Cache onboarding status and userName in localStorage
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      localStorage.setItem('userName', displayName);

      return { success: true, profile: profileData };
    } catch (err) {
      console.error('[useAuth] Onboarding error:', err);

      // Even on error, try to complete onboarding locally so user isn't stuck
      console.log('[useAuth] Attempting local fallback for onboarding');
      setProfile({ id: user.id, display_name: displayName });
      setHasCompletedOnboarding(true);
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      localStorage.setItem('userName', displayName);

      return { success: true, profile: { id: user.id, display_name: displayName } };
    }
  };

  // Refresh onboarding status
  const refreshOnboardingStatus = async () => {
    if (user) {
      return await checkOnboardingStatus(user.id);
    }
    return false;
  };

  // Update profile (name and photo)
  const updateProfile = async ({ displayName, photoUrl }) => {
    if (!user) {
      return { success: false, error: 'Tidak ada user yang login' };
    }

    console.log('[useAuth] updateProfile called:', { displayName, hasPhoto: !!photoUrl });

    try {
      const updateData = {
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
        console.error('[useAuth] Profile update error:', profileError);
        throw profileError;
      }

      console.log('[useAuth] Profile updated:', profileData);
      setProfile(profileData);

      // Update localStorage cache
      if (displayName) {
        localStorage.setItem('userName', displayName);
        localStorage.setItem('temanTanamUserName', displayName);
      }

      return { success: true, profile: profileData };
    } catch (err) {
      console.error('[useAuth] Profile update error:', err);
      return {
        success: false,
        error: err.message || 'Gagal menyimpan profil. Coba lagi.'
      };
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
  };
}

export default useAuth;
