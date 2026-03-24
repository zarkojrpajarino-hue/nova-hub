/**
 * ONBOARDING HOOK
 *
 * Gestiona si el usuario ha completado el onboarding.
 * V4.10.2 — Dual sync: localStorage (cache) + Supabase auth user_metadata (server).
 * Reads from server on mount; writes to both localStorage + server.
 *
 * NOTE: If a dedicated `profiles.onboarding_completed` column is added later,
 * migrate from user_metadata to that column for better RLS/query support.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_KEY = 'nova-onboarding-completed';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Read localStorage immediately (fast cache)
    const localValue = localStorage.getItem(ONBOARDING_KEY) === 'true';

    // 2. Read from server (source of truth) and reconcile
    supabase.auth.getUser().then(({ data }) => {
      const serverValue = data?.user?.user_metadata?.onboarding_completed === true;

      if (serverValue && !localValue) {
        // Server says completed but localStorage lost — restore cache
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setHasCompletedOnboarding(true);
      } else if (localValue && !serverValue) {
        // localStorage says completed but server doesn't know — sync up
        supabase.auth.updateUser({
          data: { onboarding_completed: true },
        });
        setHasCompletedOnboarding(true);
      } else {
        setHasCompletedOnboarding(localValue || serverValue);
      }
    }).catch(() => {
      // Fallback to localStorage if server unreachable
      setHasCompletedOnboarding(localValue);
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);

    // Sync to server (fire-and-forget)
    supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);

    // Sync to server (fire-and-forget)
    supabase.auth.updateUser({
      data: { onboarding_completed: false },
    });
  }, []);

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading: hasCompletedOnboarding === null,
  };
}
