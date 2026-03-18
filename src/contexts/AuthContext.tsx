/**
 * AuthContext — Fuente de verdad única para auth.
 *
 * COMPORTAMIENTO SUPABASE v2.93.x (fuente: GoTrueClient.js analizado):
 *
 * - Constructor llama initialize() → _acquireLock → _recoverAndRefresh → _callRefreshToken
 * - _callRefreshToken dispara TOKEN_REFRESHED (NO SIGNED_IN) al completar (línea 1984)
 * - onAuthStateChange espera initializePromise antes de emitir INITIAL_SESSION
 * - getSession() también espera initializePromise → SIEMPRE retorna sesión fresca
 *
 * SOLUCIÓN: getSession() + onAuthStateChange en paralelo.
 * - getSession() bloquea hasta que el refresh completa → resuelve loading=false fiable
 * - onAuthStateChange maneja cambios posteriores (TOKEN_REFRESHED, SIGNED_OUT, SIGNED_IN)
 * - loadingResolved flag evita doble-set si ambos llegan
 * - INITIAL_SESSION se ignora en el callback (getSession lo cubre)
 */

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
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

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileLoading: false,
  isAuthenticated: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const hadSession = useRef(false);
  const signedOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadingResolved = false;

    const resolveLoading = () => {
      if (loadingResolved) return;
      loadingResolved = true;
      if (isMounted) setLoading(false);
    };

    const fetchProfile = async (authId: string) => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', authId)
          .single();
        if (!isMounted) return;
        if (!error && data) setProfile(data as Profile);
        else setProfile(null);
      } catch {
        if (isMounted) setProfile(null);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        console.log('[Auth] event:', event, 'hasUser:', !!newSession?.user, 'hadSession:', hadSession.current, 'loadingResolved:', loadingResolved);

        if (newSession?.user) {
          // Sesión válida: TOKEN_REFRESHED, SIGNED_IN, o INITIAL_SESSION con sesión
          if (signedOutTimer.current) {
            clearTimeout(signedOutTimer.current);
            signedOutTimer.current = null;
          }
          hadSession.current = true;
          setSession(newSession);
          setUser(newSession.user);
          resolveLoading();
          await fetchProfile(newSession.user.id);

        } else if (event === 'SIGNED_OUT') {
          if (hadSession.current) {
            // Tenía sesión → verificar estado real con getSession() en lugar de timer
            // SIGNED_OUT puede dispararse por refresh fallido transitorio;
            // getSession() es la fuente de verdad: si devuelve null, la sesión murió
            hadSession.current = false; // evitar loop si SIGNED_OUT vuelve a disparar
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
              if (!isMounted) return;
              if (currentSession?.user) {
                // La sesión sigue viva (TOKEN_REFRESHED ya la restauró)
                hadSession.current = true;
              } else {
                // Sesión genuinamente muerta
                console.log('[Auth] SIGNED_OUT confirmed by getSession() — clearing session');
                setSession(null);
                setUser(null);
                setProfile(null);
              }
            });
          } else {
            // Nunca tuvo sesión — no autenticado confirmado
            setSession(null);
            setUser(null);
            setProfile(null);
            resolveLoading();
          }
        }
        // INITIAL_SESSION sin sesión: ignorar — getSession() lo resuelve abajo
      }
    );

    // getSession() espera initializePromise (incluye token refresh) antes de retornar.
    // Es el mecanismo correcto para estado inicial — sin timers, sin race conditions.
    // .catch() cubre AbortError u otros fallos del lock — sin él, loading nunca se resuelve.
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      console.log('[Auth] getSession resolved — hasSession:', !!initialSession?.user, 'error:', error?.message, 'loadingResolved:', loadingResolved);
      if (!isMounted || loadingResolved) return;
      if (initialSession?.user) {
        hadSession.current = true;
        setSession(initialSession);
        setUser(initialSession.user);
        fetchProfile(initialSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      resolveLoading();
    }).catch((err) => {
      console.warn('[Auth] getSession threw (AbortError or lock failure):', err?.message);
      if (isMounted && !loadingResolved) {
        setSession(null);
        setUser(null);
        setProfile(null);
        resolveLoading();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (signedOutTimer.current) clearTimeout(signedOutTimer.current);
    };
  }, []);

  const signOut = async () => {
    if (signedOutTimer.current) {
      clearTimeout(signedOutTimer.current);
      signedOutTimer.current = null;
    }
    hadSession.current = false;
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      profileLoading,
      isAuthenticated: !!session,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
