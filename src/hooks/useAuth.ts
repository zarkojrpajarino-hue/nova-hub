import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  auth_id: string;
  email: string;
  nombre: string;
  avatar: string | null;
  color: string;
  especialization: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sessionChecked = false;

    const fetchProfile = async (authId: string) => {
      try {
        console.log('🔍 [1] Starting fetchProfile for auth_id:', authId);

        // Test: Can we connect to Supabase at all?
        console.log('🔍 [1.5] Testing basic Supabase connection...');
        const { data: testSession } = await supabase.auth.getSession();
        console.log('🔍 [1.6] Auth session check:', testSession ? 'SUCCESS' : 'FAILED');

        console.log('🔍 [2] Building query...');

        const query = supabase
          .from('members')
          .select('*')
          .eq('auth_id', authId)
          .single();

        console.log('🔍 [3] Query built, executing...');
        const { data, error } = await query;
        console.log('🔍 [4] Query completed. Data:', data, 'Error:', error);

        if (error) {
          console.error('❌ Error fetching profile:', error);
          if (isMounted) setProfile(null);
          return;
        }

        console.log('✅ Profile loaded successfully:', data);
        if (isMounted && data) {
          setProfile(data as Profile);
        }
      } catch (error) {
        console.error('❌ Exception in fetchProfile:', error);
        if (isMounted) setProfile(null);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        // Only set loading to false if we've already checked initial session
        if (sessionChecked) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      sessionChecked = true;
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
  };
}
