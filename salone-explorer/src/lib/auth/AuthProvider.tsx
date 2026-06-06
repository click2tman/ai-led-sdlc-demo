// Auth context provider (SPEC §19 P6, §9.6). Owns the Supabase session and
// exposes sign-in/up/out + OAuth to the tree via useAuth(). SSG-safe: the
// session is read only inside an effect (never during renderToString), and a
// missing Supabase config is treated as a valid signed-out state so public
// pages render without env. Auth *actions* still fail fast via getSupabase().
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

/** OAuth providers wired in Phase 6 (SPEC §9.6). LinkedIn uses OIDC. */
export type OAuthProvider = 'google' | 'facebook' | 'linkedin_oidc';

type AuthContextValue = {
  /** The signed-in user, or null when signed out / not configured. */
  user: User | null;
  /** The active session, or null. */
  session: Session | null;
  /** True until the initial session lookup resolves. */
  loading: boolean;
  /** Whether Supabase auth is configured in this environment. */
  configured: boolean;
  /**
   * Sign in with email + password. Throws on failure. Returns the new
   * session (always present on success) after seeding it into state so the
   * caller can navigate without racing onAuthStateChange.
   */
  signIn(email: string, password: string): Promise<Session>;
  /**
   * Register with email + password; displayName is stored as user metadata.
   * Returns the session, or null when email confirmation is required (no
   * session yet) so the caller can show a "check your email" notice instead
   * of navigating into a protected route and bouncing back to /signin.
   */
  signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Session | null>;
  /** Begin an OAuth redirect flow for the given provider. */
  signInWithOAuth(provider: OAuthProvider): Promise<void>;
  /** Sign out and clear the local session. */
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access the auth context. Throws when used outside <AuthProvider> so a
 * miswired tree fails fast instead of silently rendering a signed-out UI.
 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used within <AuthProvider>.');
  }
  return value;
}

/** Where OAuth providers return the user after the consent screen. */
function oauthRedirectTo(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/account`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  // No config -> nothing to load; otherwise wait for the first getSession.
  const [loading, setLoading] = useState<boolean>(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabase();
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        // A failed initial lookup resolves to "signed out"; the next auth
        // action surfaces the real error loudly. Do not hang on loading.
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // Seed the session synchronously so a caller that navigates right away
    // sees user !== null before onAuthStateChange would otherwise fire.
    setSession(data.session);
    return data.session;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      // data.session is null when email confirmation is required; only seed
      // state when a session actually exists.
      if (data.session) setSession(data.session);
      return data.session;
    },
    [],
  );

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: oauthRedirectTo() },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
    }),
    [session, loading, configured, signIn, signUp, signInWithOAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
