// Supabase browser client (SPEC §5.3, §19 P5). Reads the public anon
// configuration from VITE_-prefixed env vars; the service-role key never
// reaches the client. The client is created lazily and memoized so that
// importing this module in file-repository mode (no Supabase env) does not
// throw - the config is validated only when a Supabase feature is first used.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Whether the public Supabase anon configuration is present. Lets callers
 * (e.g. AuthProvider) treat "no Supabase" as a valid signed-out state so
 * public pages render without env, while auth actions still fail fast via
 * getSupabase(). This is a presence check, not a silent fallback - it never
 * masks a misconfigured call, it only gates whether auth is attempted.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

/**
 * Return the shared Supabase client, creating it on first use. Throws a clear
 * error when the anon configuration is absent (fail fast, no silent fallback).
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured: set VITE_SUPABASE_URL and ' +
        'VITE_SUPABASE_ANON_KEY (see .env.example). The anon key is safe to ' +
        'expose; never expose the service-role key.',
    );
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
